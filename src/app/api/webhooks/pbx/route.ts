import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parsePbxWebhook } from '@/lib/pbx-adapter'
import { uploadAudio, getAudioKey } from '@/lib/r2'
import { enqueueCallProcessing } from '@/lib/queue'
import crypto from 'crypto'

// Max recording file size from PBX (200MB)
const MAX_RECORDING_SIZE = 200 * 1024 * 1024

// Allowed hostnames/patterns for recording URL fetches (SSRF protection)
function isAllowedRecordingUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr)
    // Block private/internal IPs and non-HTTP protocols
    if (!['http:', 'https:'].includes(url.protocol)) return false
    const hostname = url.hostname.toLowerCase()
    // Block localhost, private networks, link-local, metadata endpoints
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname.startsWith('192.168.') ||
      hostname === '169.254.169.254' || // AWS metadata
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}

// Simple in-memory rate limiter for webhook endpoints
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 60 // 60 requests per minute per org

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT_MAX
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const orgSlug = url.searchParams.get('org')
    // Support secret from both query param (legacy) and header (preferred)
    const secret = req.headers.get('x-webhook-secret') || url.searchParams.get('secret')

    if (!orgSlug || !secret) {
      return NextResponse.json({ error: 'Missing org or secret' }, { status: 400 })
    }

    // Rate limit per org slug before DB lookup
    if (!checkRateLimit(`pbx:${orgSlug}`)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // Validate org and webhook secret using timing-safe comparison
    const org = await db.organization.findFirst({
      where: { slug: orgSlug },
      include: { pbxIntegrations: { where: { isActive: true } } },
    })

    if (!org) {
      return NextResponse.json({ error: 'Invalid org or secret' }, { status: 401 })
    }

    // Timing-safe comparison to prevent timing attacks on the secret
    const secretBuffer = Buffer.from(secret)
    const expectedBuffer = Buffer.from(org.webhookSecret)
    if (secretBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(secretBuffer, expectedBuffer)) {
      return NextResponse.json({ error: 'Invalid org or secret' }, { status: 401 })
    }

    const body = await req.json()
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Build extension map from PBX integrations
    const extensionMap: Record<string, string> = {}
    for (const integration of org.pbxIntegrations) {
      const map = integration.extensionMap as Record<string, string>
      Object.assign(extensionMap, map)
    }

    // Parse the webhook payload
    const callData = parsePbxWebhook(body, headers, extensionMap)

    if (!callData) {
      return NextResponse.json({ skipped: true, reason: 'Too short or no recording' })
    }

    // Find or create rep by extension
    let repId: string | null = null
    if (callData.extension) {
      const rep = await db.rep.findFirst({
        where: { orgId: org.id, extension: callData.extension },
      })
      if (rep) {
        repId = rep.id
      } else if (callData.repName && callData.repName !== `Ext ${callData.extension}`) {
        const newRep = await db.rep.create({
          data: {
            orgId: org.id,
            name: callData.repName,
            extension: callData.extension,
          },
        })
        repId = newRep.id
      }
    }

    // Download and re-upload audio to R2 (with SSRF protection)
    let audioUrl = callData.recordingUrl
    if (callData.recordingUrl) {
      // SSRF protection: validate the recording URL is public
      if (!isAllowedRecordingUrl(callData.recordingUrl)) {
        console.warn(`[PBX] Blocked SSRF attempt: ${callData.recordingUrl}`)
        audioUrl = '' // Don't fetch, will rely on later manual upload
      } else {
        try {
          const fetchHeaders: Record<string, string> = {}
          if (callData.authRequired && callData.authCredentials) {
            if (callData.authType === 'basic') {
              fetchHeaders['Authorization'] = `Basic ${Buffer.from(callData.authCredentials).toString('base64')}`
            } else if (callData.authType === 'bearer') {
              fetchHeaders['Authorization'] = `Bearer ${callData.authCredentials}`
            }
          }

          const audioResp = await fetch(callData.recordingUrl, {
            headers: fetchHeaders,
            redirect: 'follow',
            signal: AbortSignal.timeout(30_000), // 30s timeout
          })

          if (audioResp.ok) {
            // Check content-length before downloading
            const contentLength = parseInt(audioResp.headers.get('content-length') || '0', 10)
            if (contentLength > MAX_RECORDING_SIZE) {
              console.warn(`[PBX] Recording too large: ${contentLength} bytes`)
            } else {
              const buffer = Buffer.from(await audioResp.arrayBuffer())
              if (buffer.length > MAX_RECORDING_SIZE) {
                console.warn(`[PBX] Recording too large after download: ${buffer.length} bytes`)
              } else {
                const contentType = audioResp.headers.get('content-type') || 'audio/mpeg'
                const ext = contentType.includes('wav') ? 'wav' : 'mp3'
                const callId = `pbx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
                const key = getAudioKey(org.id, callId, ext)
                audioUrl = await uploadAudio(key, buffer, contentType)
              }
            }
          }
        } catch (err) {
          console.error('Failed to re-upload audio:', err)
          // Keep original URL as fallback
        }
      }
    }

    // Deduplicate: check if a call with this externalId already exists for this org
    if (callData.callId) {
      const existing = await db.call.findFirst({
        where: { orgId: org.id, externalId: callData.callId },
      })
      if (existing) {
        return NextResponse.json({
          success: true,
          callId: existing.id,
          duplicate: true,
        })
      }
    }

    // Create call record
    const directionMap: Record<string, 'INBOUND' | 'OUTBOUND' | 'UNKNOWN'> = {
      inbound: 'INBOUND',
      outbound: 'OUTBOUND',
      unknown: 'UNKNOWN',
    }

    const call = await db.call.create({
      data: {
        orgId: org.id,
        repId,
        audioUrl,
        duration: callData.durationSeconds,
        direction: directionMap[callData.direction] || 'UNKNOWN',
        callerNumber: callData.callerPhone?.slice(0, 20),
        calledNumber: callData.calledPhone?.slice(0, 20),
        status: 'UPLOADED',
        source: 'PBX_WEBHOOK',
        externalId: callData.callId?.slice(0, 255),
        pbxType: callData.pbxType?.slice(0, 50),
        recordedAt: new Date(callData.callDate),
      },
    })

    // Enqueue for processing (transcription -> analysis)
    await enqueueCallProcessing(call.id, org.id)

    return NextResponse.json({
      success: true,
      callId: call.id,
      pbxType: callData.pbxType,
    })
  } catch (error) {
    console.error('PBX webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
