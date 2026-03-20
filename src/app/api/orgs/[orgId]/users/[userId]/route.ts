import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { can, isRoleHigherOrEqual } from '@/lib/permissions'
import type { UserRole } from '@/types'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  try {
    const session = await requireAuth()
    const { orgId, userId } = await params

    if (!session.isAdmin && session.orgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rbacUser = {
      id: session.id,
      role: session.role,
      orgId: session.orgId,
      isAdmin: session.isAdmin,
    }

    if (!can(rbacUser, 'users:read') && !can(rbacUser, 'users:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await db.user.findFirst({
      where: { id: userId, orgId },
      include: {
        org: { select: { id: true, name: true, slug: true } },
        repProfile: {
          include: {
            _count: { select: { calls: true } },
            badges: { orderBy: { earnedAt: 'desc' }, take: 10 },
          },
        },
        managedReps: { select: { id: true, name: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      orgId: user.orgId,
      org: user.org,
      repProfile: user.repProfile
        ? {
            id: user.repProfile.id,
            name: user.repProfile.name,
            phone: user.repProfile.phone,
            extension: user.repProfile.extension,
            callCount: user.repProfile._count.calls,
            badges: user.repProfile.badges,
          }
        : null,
      managedReps: user.managedReps,
      createdAt: user.createdAt,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Org user GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  try {
    const session = await requireAuth()
    const { orgId, userId } = await params

    if (!session.isAdmin && session.orgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rbacUser = {
      id: session.id,
      role: session.role,
      orgId: session.orgId,
      isAdmin: session.isAdmin,
    }

    if (!can(rbacUser, 'users:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUser = await db.user.findFirst({
      where: { id: userId, orgId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, role, isActive, managerId } = body

    // Prevent privilege escalation: can't set role higher than own
    if (role && !session.isAdmin) {
      const validRoles: UserRole[] = ['ADMIN', 'CEO', 'MANAGER', 'REP', 'VIEWER']
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      if (isRoleHigherOrEqual(role as UserRole, session.role as UserRole)) {
        return NextResponse.json(
          { error: 'Cannot set a role equal to or higher than your own' },
          { status: 403 }
        )
      }
      // Can't change the role of someone with a higher/equal role
      if (isRoleHigherOrEqual(targetUser.role as UserRole, session.role as UserRole)) {
        return NextResponse.json(
          { error: 'Cannot modify a user with equal or higher role' },
          { status: 403 }
        )
      }
    }

    // Validate managerId if provided
    if (managerId !== undefined && managerId !== null) {
      if (managerId !== '') {
        const manager = await db.user.findFirst({
          where: { id: managerId, orgId, role: { in: ['ADMIN', 'MANAGER'] } },
        })
        if (!manager) {
          return NextResponse.json({ error: 'Manager not found in organization' }, { status: 400 })
        }
      }
    }

    // Build update data (only allowed fields)
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive
    // managerId only applies to the rep profile, not the user directly

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      include: { org: { select: { id: true, name: true, slug: true } } },
    })

    // When deactivating, also deactivate linked rep
    if (isActive === false) {
      await db.rep.updateMany({
        where: { userId, orgId },
        data: { isActive: false },
      })
    }

    // Update managerId on the linked rep profile if provided
    if (managerId !== undefined) {
      await db.rep.updateMany({
        where: { userId, orgId },
        data: { managerId: managerId || null },
      })
    }

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      isAdmin: updatedUser.isAdmin,
      isActive: updatedUser.isActive,
      org: updatedUser.org,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Org user PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  try {
    const session = await requireAuth()
    const { orgId, userId } = await params

    if (!session.isAdmin && session.orgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rbacUser = {
      id: session.id,
      role: session.role,
      orgId: session.orgId,
      isAdmin: session.isAdmin,
    }

    if (!can(rbacUser, 'users:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Can't delete yourself
    if (userId === session.id) {
      return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 })
    }

    const targetUser = await db.user.findFirst({
      where: { id: userId, orgId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Can't delete someone with higher role (unless system admin)
    if (!session.isAdmin) {
      if (isRoleHigherOrEqual(targetUser.role as UserRole, session.role as UserRole)) {
        return NextResponse.json(
          { error: 'Cannot deactivate a user with equal or higher role' },
          { status: 403 }
        )
      }
    }

    // Soft delete: set isActive=false
    await db.user.update({
      where: { id: userId },
      data: { isActive: false },
    })

    // Also deactivate linked rep
    await db.rep.updateMany({
      where: { userId, orgId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Org user DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
