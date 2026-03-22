import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { uploadAudio, getAudioKey } from '@/lib/r2'
import { enqueueCallProcessing } from '@/lib/queue'
import { checkPlanLimits, canUploadCall } from '@/lib/plan-limits'
import { can } from '@/lib/permissions'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 100 * 1024 * 1024
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'mp4'])

// Regex patterns to extract call info from email subject/body
const PHONE_REGEX = /(?:\+?972|0)[\s-]?(?:[2-9]\d[\s-]?\d{3}[\s-]?\d{4}|\d{2}[\s-]?\d{3}[\s-]?\d{4}|\d{1,2}[\s-]?\d{7})/g
const DURATION_REGEX = /(?:duration|משך|אורך|זמן)[\s:]*(\d{1,2}):(\d{2})(?::(\d{2}))?/i
const DURATION_SECONDS_REGEX = /(?:duration|משך)[\s:]*(\d+)\s*(?:seconds|שניות|sec|s)/i
const DIRECTION_REGEX = /(?:inbound|incoming|נכנסת|outbound|outgoing|יוצאת)/i

interface EmailPayload {
  from: string
  subject: string
  body: string
  attachments: Array<{
    filename: string
    contentType: string
    content: string // base64 encoded
    size: number
  }>
}

function extractPhoneNumbers(text: string): { caller: string | null; called: string | null } {
  const phones = text.match(PHONE_REGEX) || []
  const cleaned = phones.map(p => p.replace(/[\s-]/g, ''))
  return {
    caller: cleaned[0]?.slice(0, 20) || null,
    called: cleaned[1]?.slice(0, 20) || null,
  }
}

function extractDuration(text: string): number {
  // Try MM:SS or HH:MM:SS format
  const match = text.match(DURATION_REGEX)
  if (match) {
    const hours = match[3] ? parseInt(match[1]) : 0
    const minutes = match[3] ? parseInt(match[2]) : parseInt(match[1])
    const seconds = match[3] ? parseInt(match[3]) : parseInt(match[2])
    return hours * 3600 + minutes * 60 + seconds
  }

  // Try "X seconds" format
  const secMatch = text.match(DURATION_SECONDS_REGEX)
  if (secMatch) {
    return Math.min(parseInt(secMatch[1]), 86400)
  }

  return 0
}

function extractDirection(text: string): 'INBOUND' | 'OUTBOUND' | 'UNKNOWN' {
  const match = text.match(DIRECTION_REGEX)
  if (!match) return 'UNKNOWN'
  const dir = match[0].toLowerCase()
  if (['inbound', 'incoming', 'נכנסת'].includes(dir)) return 'INBOUND'
  if (['outbound', 'outgoing', 'יוצאת'].includes(dir)) return 'OUTBOUND'
  return 'UNKNOWN'
}

/**
 * POST /api/import/email
 *
 * Accepts forwarded email data with audio attachments.
 * Can be called by:
 * 1. Cloudflare Email Worker forwarding emails
 * 2. Internal IMAP poller
 * 3. Any email-to-webhook service (e.g., Zapier, Mailgun)
 *
 * Auth: JWT session (for internal use) or org API key
 */
export async function POST(req: Request) {
  try {
    let orgId: string

    // Try JWT auth first, fall back to API key
    const session = await getSession().catch(() => null)
    if (session) {
      const user = await db.user.findUnique({ where: { id: session.id } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      const rbacUser = { id: user.id, role: user.role, orgId: user.orgId, isAdmin: user.isAdmin }
      if (!can(rbacUser, 'settings:manage')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      orgId = user.orgId
    } else {
      // API key auth
      const url = new URL(req.url)
      const apiKey = req.headers.get('x-api-key') || url.searchParams.get('key')
      if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const org = await db.organization.findFirst({ where: { apiKey } })
      if (!org) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
      orgId = org.id
    }

    // Check import config
    const org = await db.organization.findUnique({ where: { id: orgId } })
    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

    const importConfig = org.importConfig as Record<string, unknown> || {}
    const emailConfig = importConfig.email as Record<string, unknown> || {}
    if (emailConfig.enabled === false) {
      return NextResponse.json({ error: 'Email import is disabled for this organization' }, { status: 403 })
    }

    // Check plan limits
    const planStatus = await checkPlanLimits(orgId)
    const uploadCheck = canUploadCall(planStatus)
    if (!uploadCheck.allowed) {
      return NextResponse.json({ error: uploadCheck.reason }, { status: 403 })
    }

    const body: EmailPayload = await req.json()

    if (!body.attachments || body.attachments.length === 0) {
      return NextResponse.json({ error: 'No attachments found in email' }, { status: 400 })
    }

    // Filter audio attachments
    const audioAttachments = body.attachments.filter(att => {
      const ext = att.filename?.split('.').pop()?.toLowerCase() || ''
      return AUDIO_EXTENSIONS.has(ext) || att.contentType?.startsWith('audio/')
    })

    if (audioAttachments.length === 0) {
      return NextResponse.json({ error: 'No audio attachments found' }, { status: 400 })
    }

    // Extract metadata from subject + body
    const fullText = `${body.subject || ''} ${body.body || ''}`
    const phones = extractPhoneNumbers(fullText)
    const duration = extractDuration(fullText)
    const direction = extractDirection(fullText)

    const results: Array<{ callId: string; filename: string }> = []

    for (const attachment of audioAttachments) {
      try {
        // Decode base64 content
        const buffer = Buffer.from(attachment.content, 'base64')

        if (buffer.length > MAX_FILE_SIZE) {
          console.warn(`[EmailImport] Attachment too large: ${attachment.filename} (${buffer.length} bytes)`)
          continue
        }

        if (buffer.length < 1000) {
          console.warn(`[EmailImport] Attachment too small: ${attachment.filename} (${buffer.length} bytes)`)
          continue
        }

        const ext = (attachment.filename?.split('.').pop()?.toLowerCase() || 'mp3').replace(/[^a-z0-9]/g, '').slice(0, 5) || 'mp3'

        // Create call record
        const call = await db.call.create({
          data: {
            orgId,
            audioUrl: '',
            audioSize: buffer.length,
            duration,
            direction,
            callerNumber: phones.caller,
            calledNumber: phones.called,
            status: 'UPLOADED',
            source: 'EMAIL_IMPORT',
            externalId: `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          },
        })

        // Upload to R2
        const key = getAudioKey(orgId, call.id, ext)
        const contentType = attachment.contentType || 'audio/mpeg'
        const audioUrl = await uploadAudio(key, buffer, contentType)

        await db.call.update({
          where: { id: call.id },
          data: { audioUrl },
        })

        await enqueueCallProcessing(call.id, orgId)
        results.push({ callId: call.id, filename: attachment.filename })
      } catch (err) {
        console.error(`[EmailImport] Failed to process attachment ${attachment.filename}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.length,
      calls: results,
    })
  } catch (error) {
    console.error('Email import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
