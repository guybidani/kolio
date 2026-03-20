import { NextResponse } from 'next/server'
import { requireAuth, hashPassword } from '@/lib/auth'
import { db } from '@/lib/db'
import { can, canCreateUserWithRole } from '@/lib/permissions'
import type { UserRole } from '@/types'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await requireAuth()
    const { orgId } = await params

    // Must belong to this org (or be system admin)
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

    const users = await db.user.findMany({
      where: { orgId },
      include: {
        org: { select: { id: true, name: true, slug: true } },
        repProfile: { select: { id: true, name: true } },
        managedReps: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isAdmin: u.isAdmin,
        isActive: u.isActive,
        orgId: u.orgId,
        org: u.org,
        repProfile: u.repProfile,
        managedReps: u.managedReps,
        createdAt: u.createdAt,
      }))
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Org users GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await requireAuth()
    const { orgId } = await params

    // Must belong to this org (or be system admin)
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

    const { email, password, name, role, managerId } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'email, password, and name are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles: UserRole[] = ['ADMIN', 'CEO', 'MANAGER', 'REP', 'VIEWER']
    const userRole = (validRoles.includes(role) ? role : 'VIEWER') as UserRole

    // Org ADMIN can create MANAGER, REP, VIEWER. System admin can create any role.
    if (!session.isAdmin) {
      if (userRole === 'ADMIN' || userRole === 'CEO') {
        return NextResponse.json(
          { error: `Org admins cannot create users with the ${userRole} role` },
          { status: 403 }
        )
      }
    }

    // Check general role creation permission
    if (!canCreateUserWithRole(rbacUser, userRole)) {
      return NextResponse.json(
        { error: `You cannot create users with the ${userRole} role` },
        { status: 403 }
      )
    }

    // Verify org exists
    const org = await db.organization.findUnique({ where: { id: orgId } })
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    // Validate managerId if provided
    if (managerId) {
      const manager = await db.user.findFirst({
        where: {
          id: managerId,
          orgId,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
      })
      if (!manager) {
        return NextResponse.json({ error: 'Manager not found in organization' }, { status: 400 })
      }
    }

    const passwordHash = await hashPassword(password)

    const user = await db.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash,
        orgId,
        role: userRole,
        isAdmin: false, // Org-level API never sets system admin
      },
      include: { org: { select: { id: true, name: true, slug: true } } },
    })

    // Auto-create Rep profile when role is REP
    if (userRole === 'REP') {
      await db.rep.create({
        data: {
          orgId,
          name: name.trim(),
          userId: user.id,
          managerId: managerId || (session.role === 'MANAGER' ? session.id : null),
        },
      })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      org: user.org,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Org users POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
