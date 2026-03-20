import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const reps = await db.rep.findMany({
      where: { orgId: user.orgId, isActive: true },
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
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    })
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
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
      },
    })

    return NextResponse.json(rep)
  } catch (error) {
    console.error('Error creating rep:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
