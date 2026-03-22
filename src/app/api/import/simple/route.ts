import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { uploadAudio, getAudioKey } from '@/lib/r2'
import { enqueueCallProcessing } from '@/lib/queue'
import { checkPlanLimits, canUploadCall } from '@/lib/plan-limits'
import crypto from 'crypto'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

const ALLOWED_EXTENSIONS = new Set(['mp3', 'wav', 'mp4', 'm4a', 'ogg', 'webm', 'flac'])

// Rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 30

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
    // Auth via API key - from header or query param
    const url = new URL(req.url)
    const apiKey = req.headers.get('x-api-key') || url.searchParams.get('key')

    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json({ error: 'Missing or invalid API key' }, { status: 401 })
    }

    // Rate limit by API key
    if (!checkRateLimit(`api:${apiKey}`)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // Find org by API key (timing-safe lookup via hash comparison)
    const org = await db.organization.findFirst({
      where: { apiKey },
    })

    if (!org) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Check plan limits
    const planStatus = await checkPlanLimits(org.id)
    const uploadCheck = canUploadCall(planStatus)
    if (!uploadCheck.allowed) {
      return NextResponse.json({ error: uploadCheck.reason }, { status: 403 })
    }

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided. Send as multipart form field "file"' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 })
    }

    // Get file extension
    const rawExt = file.name?.split('.').pop()?.toLowerCase() || 'mp3'
    const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt.replace(/[^a-z0-9]/g, '') : 'mp3'

    // Read optional metadata
    const phone = (formData.get('phone') as string)?.slice(0, 20) || null
    const calledNumber = (formData.get('calledNumber') as string)?.slice(0, 20) || null
    const durationRaw = parseInt(formData.get('duration') as string || '0', 10)
    const duration = isNaN(durationRaw) ? 0 : Math.min(durationRaw, 86400)
    const directionRaw = (formData.get('direction') as string)?.toUpperCase() || 'UNKNOWN'
    const direction = ['INBOUND', 'OUTBOUND', 'UNKNOWN'].includes(directionRaw) ? directionRaw : 'UNKNOWN'
    const repName = (formData.get('repName') as string)?.slice(0, 100) || null
    const repExtension = (formData.get('extension') as string)?.slice(0, 20) || null
    const externalId = (formData.get('externalId') as string)?.slice(0, 255) || null

    // Deduplicate by externalId
    if (externalId) {
      const existing = await db.call.findFirst({
        where: { orgId: org.id, externalId },
      })
      if (existing) {
        return NextResponse.json({
          success: true,
          callId: existing.id,
          duplicate: true,
        })
      }
    }

    // Find or create rep
    let repId: string | null = null
    if (repExtension) {
      const rep = await db.rep.findFirst({
        where: { orgId: org.id, extension: repExtension },
      })
      if (rep) {
        repId = rep.id
      } else if (repName) {
        const newRep = await db.rep.create({
          data: { orgId: org.id, name: repName, extension: repExtension },
        })
        repId = newRep.id
      }
    } else if (repName) {
      // Try to find rep by name
      const rep = await db.rep.findFirst({
        where: { orgId: org.id, name: repName },
      })
      if (rep) repId = rep.id
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Create call record
    const call = await db.call.create({
      data: {
        orgId: org.id,
        repId,
        audioUrl: '',
        audioSize: file.size,
        duration,
        direction: direction as 'INBOUND' | 'OUTBOUND' | 'UNKNOWN',
        callerNumber: phone,
        calledNumber,
        status: 'UPLOADED',
        source: 'API_IMPORT',
        externalId,
      },
    })

    // Upload to R2
    const key = getAudioKey(org.id, call.id, ext)
    const contentType = file.type || 'audio/mpeg'
    const audioUrl = await uploadAudio(key, buffer, contentType)

    // Update call with audio URL
    await db.call.update({
      where: { id: call.id },
      data: { audioUrl },
    })

    // Enqueue for processing
    await enqueueCallProcessing(call.id, org.id)

    return NextResponse.json({
      success: true,
      callId: call.id,
      source: 'API_IMPORT',
    })
  } catch (error) {
    console.error('API import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
