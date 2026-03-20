import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string; repId: string }> }
) {
  try {
    const session = await requireAuth()
    const { orgId, repId } = await params

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

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1') || 1)
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20') || 20))
    const skip = (page - 1) * limit

    const rep = await db.rep.findFirst({
      where: { id: repId, orgId },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        manager: { select: { id: true, name: true } },
        badges: { orderBy: { earnedAt: 'desc' } },
        streaks: true,
        _count: { select: { calls: true } },
      },
    })

    if (!rep) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    // MANAGER can only see reps they manage
    if (session.role === 'MANAGER' && !session.isAdmin && rep.managerId !== session.id) {
      // Check if this rep is one they manage
      if (!can(rbacUser, 'reps:read')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get paginated calls with scores over time
    const [calls, totalCalls] = await Promise.all([
      db.call.findMany({
        where: { repId, orgId },
        select: {
          id: true,
          overallScore: true,
          status: true,
          duration: true,
          direction: true,
          recordedAt: true,
          summary: true,
          prospectName: true,
        },
        orderBy: { recordedAt: 'desc' },
        take: limit,
        skip,
      }),
      db.call.count({ where: { repId, orgId } }),
    ])

    // Compute scores over time (last 30 completed calls)
    const recentScores = await db.call.findMany({
      where: { repId, orgId, status: 'COMPLETE', overallScore: { not: null } },
      select: { overallScore: true, recordedAt: true },
      orderBy: { recordedAt: 'desc' },
      take: 30,
    })

    const scoresOverTime = recentScores.reverse().map((c) => ({
      score: c.overallScore,
      date: c.recordedAt,
    }))

    return NextResponse.json({
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
      badges: rep.badges,
      streaks: rep.streaks,
      totalCalls: rep._count.calls,
      scoresOverTime,
      calls,
      callsPagination: {
        page,
        limit,
        total: totalCalls,
        totalPages: Math.ceil(totalCalls / limit),
      },
      createdAt: rep.createdAt,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Org rep GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgId: string; repId: string }> }
) {
  try {
    const session = await requireAuth()
    const { orgId, repId } = await params

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

    const rep = await db.rep.findFirst({
      where: { id: repId, orgId },
    })

    if (!rep) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, phone, extension, managerId, isActive } = body

    // Validate managerId if provided
    if (managerId !== undefined && managerId !== null && managerId !== '') {
      const manager = await db.user.findFirst({
        where: { id: managerId, orgId, role: { in: ['ADMIN', 'MANAGER'] } },
      })
      if (!manager) {
        return NextResponse.json({ error: 'Manager not found in organization' }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim().slice(0, 100)
    if (phone !== undefined) updateData.phone = phone ? String(phone).replace(/[^\d+\-() ]/g, '').slice(0, 20) : null
    if (extension !== undefined) updateData.extension = extension ? String(extension).replace(/[^\d*#]/g, '').slice(0, 10) : null
    if (managerId !== undefined) updateData.managerId = managerId || null
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedRep = await db.rep.update({
      where: { id: repId },
      data: updateData,
    })

    return NextResponse.json(updatedRep)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Org rep PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; repId: string }> }
) {
  try {
    const session = await requireAuth()
    const { orgId, repId } = await params

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

    const rep = await db.rep.findFirst({
      where: { id: repId, orgId },
    })

    if (!rep) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    // Soft delete - don't hard delete because calls reference this rep
    await db.rep.update({
      where: { id: repId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Org rep DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
