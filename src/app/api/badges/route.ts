import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    let repId = url.searchParams.get('repId')

    // RBAC: REPs can only see their own badges
    if (session.role === 'REP' && !can(session, 'analytics:read')) {
      const repProfile = await db.rep.findFirst({ where: { orgId: session.orgId, userId: session.id } })
      if (!repProfile) {
        return NextResponse.json({ badges: [] })
      }
      // Force repId to their own profile regardless of query param
      repId = repProfile.id
    }

    const where: Record<string, unknown> = { orgId: session.orgId }
    if (repId) where.repId = repId

    const badges = await db.badge.findMany({
      where,
      orderBy: { earnedAt: 'desc' },
      include: {
        rep: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ badges })
  } catch (error) {
    console.error('Error fetching badges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
