import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'
import crypto from 'crypto'

/**
 * GET /api/import/config
 * Fetch current import configuration for the user's org
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { id: session.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const rbacUser = { id: user.id, role: user.role, orgId: user.orgId, isAdmin: user.isAdmin }
    if (!can(rbacUser, 'settings:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const org = await db.organization.findUnique({ where: { id: user.orgId } })
    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

    const importConfig = org.importConfig as Record<string, unknown> || {}

    // Mask FTP password in response
    const ftpConfig = importConfig.ftp as Record<string, unknown> | undefined
    const maskedFtp = ftpConfig ? {
      ...ftpConfig,
      password: ftpConfig.password ? '********' : '',
    } : null

    return NextResponse.json({
      importConfig: {
        ...importConfig,
        ftp: maskedFtp,
      },
      apiKey: org.apiKey || null,
      orgSlug: org.slug,
    })
  } catch (error) {
    console.error('Import config GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/import/config
 * Update import configuration
 */
export async function PATCH(req: Request) {
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
    const { section, config } = body as { section: string; config: Record<string, unknown> }

    if (!section || !['email', 'ftp'].includes(section)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
    }

    const org = await db.organization.findUnique({ where: { id: user.orgId } })
    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

    const currentConfig = org.importConfig as Record<string, unknown> || {}

    // If FTP password is masked, preserve the existing one
    if (section === 'ftp' && config.password === '********') {
      const existingFtp = currentConfig.ftp as Record<string, unknown> | undefined
      config.password = existingFtp?.password || ''
    }

    // Validate FTP config
    if (section === 'ftp' && config.enabled) {
      if (!config.host || typeof config.host !== 'string') {
        return NextResponse.json({ error: 'FTP host is required' }, { status: 400 })
      }
      if (!config.username || typeof config.username !== 'string') {
        return NextResponse.json({ error: 'FTP username is required' }, { status: 400 })
      }
      // Sanitize host - no spaces, reasonable length
      config.host = (config.host as string).trim().slice(0, 255)
      config.username = (config.username as string).trim().slice(0, 100)
      config.path = ((config.path as string) || '/').trim().slice(0, 500)
      config.port = Math.min(Math.max(parseInt(config.port as string) || 21, 1), 65535)
    }

    const updatedConfig = {
      ...currentConfig,
      [section]: config,
    }

    await db.organization.update({
      where: { id: user.orgId },
      data: { importConfig: JSON.parse(JSON.stringify(updatedConfig)) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Import config PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/import/config
 * Generate or regenerate API key
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
    const { action } = body as { action: string }

    if (action === 'generate-api-key') {
      const apiKey = `kol_${crypto.randomBytes(24).toString('hex')}`

      await db.organization.update({
        where: { id: user.orgId },
        data: { apiKey },
      })

      return NextResponse.json({ apiKey })
    }

    if (action === 'revoke-api-key') {
      await db.organization.update({
        where: { id: user.orgId },
        data: { apiKey: null },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Import config POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
