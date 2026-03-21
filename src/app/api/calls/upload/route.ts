import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { uploadAudio, getAudioKey } from '@/lib/r2'
import { enqueueCallProcessing } from '@/lib/queue'
import { can } from '@/lib/permissions'
import { checkPlanLimits, canUploadCall } from '@/lib/plan-limits'

export const runtime = 'nodejs'

// Allowed MIME types for audio uploads
const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
  'audio/x-m4a',
  'audio/mp3',
])

// Allowed file extensions (checked independently of MIME type since MIME can be spoofed)
const ALLOWED_EXTENSIONS = new Set(['mp3', 'wav', 'mp4', 'm4a', 'ogg', 'webm', 'flac'])

// Allowed direction values
const ALLOWED_DIRECTIONS = new Set(['INBOUND', 'OUTBOUND', 'UNKNOWN'])

// Audio file magic bytes for content sniffing
const AUDIO_MAGIC_BYTES: Array<{ bytes: number[]; offset: number }> = [
  { bytes: [0x49, 0x44, 0x33], offset: 0 },          // MP3 ID3 tag
  { bytes: [0xFF, 0xFB], offset: 0 },                  // MP3 frame sync
  { bytes: [0xFF, 0xF3], offset: 0 },                  // MP3 frame sync
  { bytes: [0xFF, 0xF2], offset: 0 },                  // MP3 frame sync
  { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },      // WAV (RIFF)
  { bytes: [0x4F, 0x67, 0x67, 0x53], offset: 0 },      // OGG
  { bytes: [0x66, 0x4C, 0x61, 0x43], offset: 0 },      // FLAC
  { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },      // MP4/M4A (ftyp at offset 4)
  { bytes: [0x1A, 0x45, 0xDF, 0xA3], offset: 0 },      // WebM (EBML)
]

function isAudioContent(buffer: Buffer): boolean {
  for (const magic of AUDIO_MAGIC_BYTES) {
    if (buffer.length < magic.offset + magic.bytes.length) continue
    const match = magic.bytes.every((byte, i) => buffer[magic.offset + i] === byte)
    if (match) return true
  }
  return false
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      include: { org: true, repProfile: { select: { id: true } } },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const rbacUser = { id: user.id, role: user.role, orgId: user.orgId, isAdmin: user.isAdmin }
    if (!can(rbacUser, 'calls:upload')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check plan limits before accepting upload
    const planStatus = await checkPlanLimits(user.orgId)
    const uploadCheck = canUploadCall(planStatus)
    if (!uploadCheck.allowed) {
      return NextResponse.json({ error: uploadCheck.reason }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const repId = formData.get('repId') as string | null
    const directionRaw = (formData.get('direction') as string) || 'UNKNOWN'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (max 100MB) - check before reading content
    const MAX_SIZE = 100 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 400 })
    }

    // Validate MIME type against allowlist
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: MP3, WAV, MP4, M4A, OGG, WebM, FLAC' }, { status: 400 })
    }

    // Validate file extension against allowlist
    const rawExt = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.has(rawExt)) {
      return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 })
    }
    // Sanitize extension to prevent path traversal
    const ext = rawExt.replace(/[^a-z0-9]/g, '')

    // Validate direction is an allowed value
    const direction = ALLOWED_DIRECTIONS.has(directionRaw) ? directionRaw : 'UNKNOWN'

    // Read file content
    const buffer = Buffer.from(await file.arrayBuffer())

    // Validate file content (magic bytes) to prevent disguised malicious files
    if (!isAudioContent(buffer)) {
      return NextResponse.json({ error: 'File content does not appear to be audio' }, { status: 400 })
    }

    // If repId is provided, verify it belongs to the same org
    if (repId) {
      const rep = await db.rep.findFirst({
        where: { id: repId, orgId: user.orgId },
      })
      if (!rep) {
        return NextResponse.json({ error: 'Rep not found in your organization' }, { status: 400 })
      }
    }

    // Create call record first to get ID
    const call = await db.call.create({
      data: {
        orgId: user.orgId,
        repId: repId || null,
        audioUrl: '', // Will be updated after upload
        audioSize: file.size,
        direction: direction as 'INBOUND' | 'OUTBOUND' | 'UNKNOWN',
        status: 'UPLOADED',
        source: 'MANUAL_UPLOAD',
      },
    })

    // Upload to R2
    const key = getAudioKey(user.orgId, call.id, ext)
    const audioUrl = await uploadAudio(key, buffer, file.type)

    // Update call with audio URL
    await db.call.update({
      where: { id: call.id },
      data: { audioUrl },
    })

    // Enqueue for processing
    await enqueueCallProcessing(call.id, user.orgId)

    return NextResponse.json({
      success: true,
      callId: call.id,
    })
  } catch (error) {
    console.error('Error uploading call:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
