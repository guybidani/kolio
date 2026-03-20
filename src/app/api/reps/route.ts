import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      include: { repProfile: { select: { id: true } } },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const rbacUser = { id: user.id, role: user.role, orgId: user.orgId, isAdmin: user.isAdmin }

    if (!can(rbacUser, 'reps:read') && !can(rbacUser, 'reps:read:own')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build where clause based on permissions
    const where: Record<string, unknown> = { orgId: user.orgId, isActive: true }

    // REP can only see themselves
    if (!can(rbacUser, 'reps:read')) {
      if (user.repProfile) {
        where.id = user.repProfile.id
      } else {
        return NextResponse.json([])
      }
    }

    const reps = await db.rep.findMany({
      where,
      include: {
        _count: { select: { calls: true } },
        calls: {
          where: { status: 'COMPLETE', overallScore: { not: null } },
          select: { overallScore: true },
          orderBy: { recordedAt: 'desc' },
          take: 50,
        },
      },
      orderBy: { name: 'asc' },
    })

    const repStats = reps.map((rep) => {
      const scores = rep.calls.map((c) => c.overallScore!).filter(Boolean)
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      const recentScores = scores.slice(0, 10)
      const olderScores = scores.slice(10, 20)
      const recentAvg = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0
      const olderAvg = olderScores.length > 0 ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length : 0
      const trend = olderScores.length > 0 ? recentAvg - olderAvg : 0

      return {
        id: rep.id,
        name: rep.name,
        phone: rep.phone,
        extension: rep.extension,
        avatarUrl: rep.avatarUrl,
        totalCalls: rep._count.calls,
        avgScore: Math.round(avgScore * 10) / 10,
        trend: Math.round(trend * 10) / 10,
      }
    })

    return NextResponse.json(repStats)
  } catch (error) {
    console.error('Error fetching reps:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const rbacUser = { id: user.id, role: user.role, orgId: user.orgId, isAdmin: user.isAdmin }
    if (!can(rbacUser, 'reps:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, phone, extension } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Validate and sanitize input lengths
    const sanitizedName = name.trim().slice(0, 100)
    if (sanitizedName.length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const sanitizedPhone = phone ? String(phone).replace(/[^\d+\-() ]/g, '').slice(0, 20) : null
    const sanitizedExtension = extension ? String(extension).replace(/[^\d*#]/g, '').slice(0, 10) : null

    const rep = await db.rep.create({
      data: {
        orgId: user.orgId,
        name: sanitizedName,
        phone: sanitizedPhone,
        extension: sanitizedExtension,
        // If manager is creating, set themselves as manager
        ...(user.role === 'MANAGER' ? { managerId: user.id } : {}),
      },
    })

    return NextResponse.json(rep)
  } catch (error) {
    console.error('Error creating rep:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
