import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { uploadAudio, getAudioKey } from '@/lib/r2'
import { enqueueCallProcessing } from '@/lib/queue'
import { checkPlanLimits, canUploadCall } from '@/lib/plan-limits'
import { can } from '@/lib/permissions'
import { Client } from 'basic-ftp'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 100 * 1024 * 1024
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'mp4'])

interface FtpConfig {
  enabled: boolean
  host: string
  port: number
  username: string
  password: string
  path: string
  secure: boolean // true = FTPS/SFTP
  filePattern?: string
  lastPollAt?: string
}

/**
 * POST /api/import/ftp-poll
 *
 * Connects to configured FTP/SFTP server, downloads new audio files,
 * uploads them to R2, and enqueues for processing.
 *
 * Can be triggered by:
 * 1. Manual click from settings UI
 * 2. Cron job (with API key auth)
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
      const url = new URL(req.url)
      const apiKey = req.headers.get('x-api-key') || url.searchParams.get('key')
      if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const org = await db.organization.findFirst({ where: { apiKey } })
      if (!org) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
      orgId = org.id
    }

    const org = await db.organization.findUnique({ where: { id: orgId } })
    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

    const importConfig = org.importConfig as Record<string, unknown> || {}
    const ftpConfig = importConfig.ftp as FtpConfig | undefined

    if (!ftpConfig || !ftpConfig.enabled) {
      return NextResponse.json({ error: 'FTP import is not configured or disabled' }, { status: 400 })
    }

    if (!ftpConfig.host || !ftpConfig.username) {
      return NextResponse.json({ error: 'FTP configuration is incomplete' }, { status: 400 })
    }

    // Check plan limits
    const planStatus = await checkPlanLimits(orgId)
    const uploadCheck = canUploadCall(planStatus)
    if (!uploadCheck.allowed) {
      return NextResponse.json({ error: uploadCheck.reason }, { status: 403 })
    }

    const client = new Client()
    client.ftp.verbose = false

    const results: Array<{ callId: string; filename: string }> = []
    const errors: string[] = []

    try {
      await client.access({
        host: ftpConfig.host,
        port: ftpConfig.port || 21,
        user: ftpConfig.username,
        password: ftpConfig.password,
        secure: ftpConfig.secure || false,
        secureOptions: { rejectUnauthorized: false },
      })

      const remotePath = ftpConfig.path || '/'
      const fileList = await client.list(remotePath)

      // Filter for audio files, sorted by date (newest first)
      const lastPollAt = ftpConfig.lastPollAt ? new Date(ftpConfig.lastPollAt) : new Date(0)
      const audioFiles = fileList
        .filter(f => {
          if (f.isDirectory) return false
          const ext = f.name.split('.').pop()?.toLowerCase() || ''
          if (!AUDIO_EXTENSIONS.has(ext)) return false
          // Filter by file pattern if configured
          if (ftpConfig.filePattern) {
            const regex = new RegExp(ftpConfig.filePattern, 'i')
            if (!regex.test(f.name)) return false
          }
          // Only grab files newer than last poll
          if (f.modifiedAt && f.modifiedAt > lastPollAt) return true
          // If no modifiedAt, include it
          return !ftpConfig.lastPollAt
        })
        .filter(f => !f.size || f.size <= MAX_FILE_SIZE)
        .slice(0, 50) // Max 50 files per poll

      for (const file of audioFiles) {
        try {
          const remoteFull = remotePath.endsWith('/') ? `${remotePath}${file.name}` : `${remotePath}/${file.name}`

          // Download to buffer via writable stream
          const chunks: Buffer[] = []
          const { Writable } = await import('stream')
          const writable = new Writable({
            write(chunk, _encoding, callback) {
              chunks.push(Buffer.from(chunk))
              callback()
            },
          })

          await client.downloadTo(writable, remoteFull)
          const buffer = Buffer.concat(chunks)

          if (buffer.length < 1000) {
            console.warn(`[FTPImport] File too small: ${file.name}`)
            continue
          }

          const ext = (file.name.split('.').pop()?.toLowerCase() || 'mp3').replace(/[^a-z0-9]/g, '').slice(0, 5) || 'mp3'

          // Deduplicate by filename as externalId
          const externalId = `ftp-${file.name}`
          const existing = await db.call.findFirst({
            where: { orgId, externalId },
          })
          if (existing) continue

          // Create call
          const call = await db.call.create({
            data: {
              orgId,
              audioUrl: '',
              audioSize: buffer.length,
              duration: 0,
              direction: 'UNKNOWN',
              status: 'UPLOADED',
              source: 'FTP_IMPORT',
              externalId,
              recordedAt: file.modifiedAt || new Date(),
            },
          })

          // Upload to R2
          const key = getAudioKey(orgId, call.id, ext)
          const contentType = ext === 'wav' ? 'audio/wav' : ext === 'ogg' ? 'audio/ogg' : 'audio/mpeg'
          const audioUrl = await uploadAudio(key, buffer, contentType)

          await db.call.update({
            where: { id: call.id },
            data: { audioUrl },
          })

          await enqueueCallProcessing(call.id, orgId)
          results.push({ callId: call.id, filename: file.name })
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          errors.push(`${file.name}: ${msg}`)
          console.error(`[FTPImport] Failed to process ${file.name}:`, err)
        }
      }

      // Update last poll timestamp
      const updatedConfig = {
        ...importConfig,
        ftp: { ...ftpConfig, lastPollAt: new Date().toISOString() },
      }
      await db.organization.update({
        where: { id: orgId },
        data: { importConfig: JSON.parse(JSON.stringify(updatedConfig)) },
      })
    } finally {
      client.close()
    }

    return NextResponse.json({
      success: true,
      imported: results.length,
      calls: results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('FTP import error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
