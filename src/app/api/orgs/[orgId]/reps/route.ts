import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await requireAuth()
    const { orgId } = await params

    if (!session.isAdmin && session.orgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rbacUser = {
      id: session.id,
      role: session.role,
      orgId: session.orgId,
      isAdmin: session.isAdmin,
    }

    if (!can(rbacUser, 'reps:read') && !can(rbacUser, 'reps:read:own')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // MANAGER sees only their managed reps, ADMIN/CEO sees all
    const where: Record<string, unknown> = { orgId }

    if (session.role === 'MANAGER' && !session.isAdmin) {
      where.managerId = session.id
    }

    const reps = await db.rep.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        manager: { select: { id: true, name: true } },
        _count: { select: { calls: true } },
        calls: {
          where: { status: 'COMPLETE', overallScore: { not: null } },
          select: { overallScore: true, recordedAt: true },
          orderBy: { recordedAt: 'desc' },
          take: 50,
        },
      },
      orderBy: { name: 'asc' },
    })

    const repList = reps.map((rep) => {
      const scores = rep.calls.map((c) => c.overallScore!).filter(Boolean)
      const avgScore = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : null
      const lastCallDate = rep.calls[0]?.recordedAt ?? null

      return {
        id: rep.id,
        name: rep.name,
        phone: rep.phone,
        extension: rep.extension,
        avatarUrl: rep.avatarUrl,
        isActive: rep.isActive,
        userId: rep.userId,
        user: rep.user,
        managerId: rep.managerId,
        manager: rep.manager,
        callCount: rep._count.calls,
        avgScore,
        lastCallDate,
        createdAt: rep.createdAt,
      }
    })

    return NextResponse.json(repList)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Org reps GET error:', error)
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

    if (!session.isAdmin && session.orgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rbacUser = {
      id: session.id,
      role: session.role,
      orgId: session.orgId,
      isAdmin: session.isAdmin,
    }

    if (!can(rbacUser, 'reps:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, phone, extension, managerId, userId } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const sanitizedName = name.trim().slice(0, 100)
    if (sanitizedName.length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const sanitizedPhone = phone ? String(phone).replace(/[^\d+\-() ]/g, '').slice(0, 20) : null
    const sanitizedExtension = extension ? String(extension).replace(/[^\d*#]/g, '').slice(0, 10) : null

    // Validate managerId if provided
    if (managerId) {
      const manager = await db.user.findFirst({
        where: { id: managerId, orgId, role: { in: ['ADMIN', 'MANAGER'] } },
      })
      if (!manager) {
        return NextResponse.json({ error: 'Manager not found in organization' }, { status: 400 })
      }
    }

    // Validate userId if linking to existing user
    if (userId) {
      const existingUser = await db.user.findFirst({
        where: { id: userId, orgId },
      })
      if (!existingUser) {
        return NextResponse.json({ error: 'User not found in organization' }, { status: 400 })
      }
      // Check user doesn't already have a rep profile
      const existingRep = await db.rep.findUnique({ where: { userId } })
      if (existingRep) {
        return NextResponse.json({ error: 'User already has a rep profile' }, { status: 400 })
      }
    }

    const rep = await db.rep.create({
      data: {
        orgId,
        name: sanitizedName,
        phone: sanitizedPhone,
        extension: sanitizedExtension,
        managerId: managerId || (session.role === 'MANAGER' ? session.id : null),
        userId: userId || null,
      },
    })

    return NextResponse.json(rep)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Org reps POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
