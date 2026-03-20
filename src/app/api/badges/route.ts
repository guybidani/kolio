import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const repId = url.searchParams.get('repId')

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
