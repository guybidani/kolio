import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { getRepStreaks } from '@/lib/streaks'
import { can } from '@/lib/permissions'

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    let repId = url.searchParams.get('repId')

    // RBAC: REPs can only see their own streaks
    if (session.role === 'REP' && !can(session, 'analytics:read')) {
      const repProfile = await db.rep.findFirst({ where: { orgId: session.orgId, userId: session.id } })
      if (!repProfile) {
        return NextResponse.json({ streaks: [] })
      }
      repId = repProfile.id
    }

    if (!repId) {
      return NextResponse.json({ error: 'repId is required' }, { status: 400 })
    }

    const streaks = await getRepStreaks(repId, session.orgId)
    return NextResponse.json({ streaks })
  } catch (error) {
    console.error('Error fetching streaks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
