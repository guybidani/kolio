import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin, hashPassword } from '@/lib/auth'
import { db } from '@/lib/db'
import { can, canCreateUserWithRole } from '@/lib/permissions'
import type { UserRole } from '@/types'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await requireAdmin()

    const users = await db.user.findMany({
      include: {
        org: { select: { id: true, name: true, slug: true } },
        repProfile: { select: { id: true } },
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
        repProfileId: u.repProfile?.id ?? null,
        managedReps: u.managedReps,
        createdAt: u.createdAt,
      }))
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Admin users GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()

    const rbacUser = {
      id: session.id,
      role: session.role,
      orgId: session.orgId,
      isAdmin: session.isAdmin,
    }

    // Must have users:manage permission
    if (!can(rbacUser, 'users:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { email, password, name, orgId, role, isAdmin, managerId } = await req.json()

    if (!email || !password || !name || !orgId) {
      return NextResponse.json(
        { error: 'email, password, name, and orgId are required' },
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

    // Check if creator can create this role
    if (!canCreateUserWithRole(rbacUser, userRole)) {
      return NextResponse.json(
        { error: `You cannot create users with the ${userRole} role` },
        { status: 403 }
      )
    }

    // Non-admin managers can only create users in their own org
    if (!session.isAdmin && session.orgId !== orgId) {
      return NextResponse.json(
        { error: 'You can only create users in your own organization' },
        { status: 403 }
      )
    }

    // Only system admins can set the isAdmin flag
    const setIsAdmin = session.isAdmin ? isAdmin === true : false

    // Verify org exists
    const org = await db.organization.findUnique({ where: { id: orgId } })
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    // If role is REP and managerId provided, validate it
    if (userRole === 'REP' && managerId) {
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
        isAdmin: setIsAdmin,
      },
      include: { org: { select: { id: true, name: true, slug: true } } },
    })

    // If role is REP, auto-create a linked Rep profile
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
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Admin users POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
