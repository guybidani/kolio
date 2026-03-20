import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  try {
    const session = await requireAuth()
    const { orgId, id } = await params

    if (!session.isAdmin && session.orgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rbacUser = {
      id: session.id,
      role: session.role,
      orgId: session.orgId,
      isAdmin: session.isAdmin,
    }

    if (!can(rbacUser, 'settings:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify integration belongs to this org
    const existing = await db.pbxIntegration.findFirst({
      where: { id, orgId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, isActive, extensionMap } = body

    const updateData: Record<string, unknown> = {}
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (extensionMap !== undefined) updateData.extensionMap = extensionMap

    // Store name in config JSON
    if (name !== undefined) {
      const existingConfig = (existing.config && typeof existing.config === 'object'
        ? existing.config : {}) as Record<string, unknown>
      updateData.config = { ...existingConfig, name }
    }

    const integration = await db.pbxIntegration.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ integration })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('PATCH integration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  try {
    const session = await requireAuth()
    const { orgId, id } = await params

    if (!session.isAdmin && session.orgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rbacUser = {
      id: session.id,
      role: session.role,
      orgId: session.orgId,
      isAdmin: session.isAdmin,
    }

    if (!can(rbacUser, 'settings:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify integration belongs to this org
    const existing = await db.pbxIntegration.findFirst({
      where: { id, orgId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    await db.pbxIntegration.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('DELETE integration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
