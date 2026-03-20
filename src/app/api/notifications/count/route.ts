import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUnreadCount } from '@/lib/notifications'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await getUnreadCount(session.id)
    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching notification count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
