import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  getNotifications,
  markAsRead,
  markAllRead,
} from '@/lib/notifications'

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const unreadOnly = url.searchParams.get('unread') === 'true'
    const limit = Math.min(
      Math.max(1, parseInt(url.searchParams.get('limit') || '20') || 20),
      50
    )
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0') || 0)

    const result = await getNotifications(session.id, { unreadOnly, limit, offset })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { notificationId, markAll } = body as {
      notificationId?: string
      markAll?: boolean
    }

    if (markAll) {
      await markAllRead(session.id)
      return NextResponse.json({ success: true })
    }

    if (notificationId) {
      await markAsRead(notificationId, session.id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Missing notificationId or markAll' }, { status: 400 })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
