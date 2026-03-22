import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'
import { Client } from 'basic-ftp'

/**
 * POST /api/import/ftp-test
 * Test FTP connection with provided credentials
 */
export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { id: session.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const rbacUser = { id: user.id, role: user.role, orgId: user.orgId, isAdmin: user.isAdmin }
    if (!can(rbacUser, 'settings:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { host, port, username, password, path, secure } = body as {
      host: string
      port: number
      username: string
      password: string
      path: string
      secure: boolean
    }

    if (!host || !username) {
      return NextResponse.json({ error: 'Host and username are required' }, { status: 400 })
    }

    // If password is masked, get the real one from config
    let realPassword = password
    if (password === '********') {
      const org = await db.organization.findUnique({ where: { id: user.orgId } })
      if (org) {
        const config = org.importConfig as Record<string, unknown> || {}
        const ftpConfig = config.ftp as Record<string, unknown> | undefined
        realPassword = (ftpConfig?.password as string) || ''
      }
    }

    const client = new Client()
    client.ftp.verbose = false

    try {
      await client.access({
        host: host.trim(),
        port: port || 21,
        user: username.trim(),
        password: realPassword,
        secure: secure || false,
        secureOptions: { rejectUnauthorized: false },
      })

      const remotePath = path?.trim() || '/'
      const fileList = await client.list(remotePath)
      const audioFiles = fileList.filter(f => {
        if (f.isDirectory) return false
        const ext = f.name.split('.').pop()?.toLowerCase() || ''
        return ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac', 'mp4'].includes(ext)
      })

      return NextResponse.json({
        success: true,
        message: `חיבור הצליח! נמצאו ${audioFiles.length} קבצי אודיו מתוך ${fileList.length} קבצים`,
        totalFiles: fileList.length,
        audioFiles: audioFiles.length,
        sampleFiles: audioFiles.slice(0, 5).map(f => f.name),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed'
      return NextResponse.json({
        success: false,
        message: `שגיאת חיבור: ${message}`,
      })
    } finally {
      client.close()
    }
  } catch (error) {
    console.error('FTP test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
