import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'

export const runtime = 'nodejs'

// GET /api/settings/vixy-crm — get Vixy CRM integration config
export async function GET() {
  try {
    const session = await requireAuth()
    const rbacUser = { id: session.id, role: session.role, orgId: session.orgId, isAdmin: session.isAdmin }
    if (!can(rbacUser, 'settings:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const org = await db.organization.findUnique({
      where: { id: session.orgId },
      select: { settings: true },
    })

    const settings = (org?.settings && typeof org.settings === 'object' ? org.settings : {}) as Record<string, unknown>
    const vixy = (settings.vixyCrm || { enabled: false, webhookUrl: '', webhookSecret: '', workspaceId: '' }) as Record<string, unknown>

    return NextResponse.json({
      enabled: !!vixy.enabled,
      webhookUrl: vixy.webhookUrl || '',
      workspaceId: vixy.workspaceId || '',
      // Don't return the full secret, just indicate if it's set
      hasSecret: !!(vixy.webhookSecret as string),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/settings/vixy-crm — update Vixy CRM integration config
export async function PATCH(req: Request) {
  try {
    const session = await requireAuth()
    const rbacUser = { id: session.id, role: session.role, orgId: session.orgId, isAdmin: session.isAdmin }
    if (!can(rbacUser, 'settings:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { enabled, webhookUrl, webhookSecret, workspaceId } = body

    const org = await db.organization.findUnique({
      where: { id: session.orgId },
      select: { settings: true },
    })

    const currentSettings = (org?.settings && typeof org.settings === 'object' ? org.settings : {}) as Record<string, unknown>
    const currentVixy = (currentSettings.vixyCrm || {}) as Record<string, unknown>

    // Merge: only update provided fields
    const updatedVixy = {
      ...currentVixy,
      ...(enabled !== undefined ? { enabled } : {}),
      ...(webhookUrl !== undefined ? { webhookUrl } : {}),
      ...(webhookSecret !== undefined ? { webhookSecret } : {}),
      ...(workspaceId !== undefined ? { workspaceId } : {}),
    }

    await db.organization.update({
      where: { id: session.orgId },
      data: {
        settings: { ...currentSettings, vixyCrm: updatedVixy },
      },
    })

    return NextResponse.json({
      enabled: !!updatedVixy.enabled,
      webhookUrl: updatedVixy.webhookUrl || '',
      workspaceId: updatedVixy.workspaceId || '',
      hasSecret: !!(updatedVixy.webhookSecret as string),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
