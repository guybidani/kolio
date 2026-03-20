import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getRepStreaks } from '@/lib/streaks'

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const repId = url.searchParams.get('repId')
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
