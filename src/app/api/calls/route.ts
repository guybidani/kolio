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

    const user = await db.user.findUnique({
      where: { id: session.id },
      include: { repProfile: { select: { id: true } } },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const rbacUser = { id: user.id, role: user.role, orgId: user.orgId, isAdmin: user.isAdmin }

    // Check if user has any call read permission
    if (!can(rbacUser, 'calls:read') && !can(rbacUser, 'calls:read:own')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1') || 1)
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '20') || 20), 100)
    const status = url.searchParams.get('status')
    const repId = url.searchParams.get('repId')
    const search = url.searchParams.get('search')

    const allowedStatuses = ['UPLOADED', 'TRANSCRIBING', 'TRANSCRIBED', 'ANALYZING', 'COMPLETE', 'FAILED']
    const where: Record<string, unknown> = { orgId: user.orgId }

    // REP can only see their own calls
    if (!can(rbacUser, 'calls:read')) {
      // User only has calls:read:own
      if (user.repProfile) {
        where.repId = user.repProfile.id
      } else {
        // REP with no rep profile - return empty
        return NextResponse.json({
          calls: [],
          pagination: { page, limit, total: 0, pages: 0 },
        })
      }
    }

    if (status && allowedStatuses.includes(status)) where.status = status
    if (repId) where.repId = repId
    if (search) {
      where.OR = [
        { prospectName: { contains: search, mode: 'insensitive' } },
        { prospectBusiness: { contains: search, mode: 'insensitive' } },
        { callerNumber: { contains: search } },
      ]
    }

    const [calls, total] = await Promise.all([
      db.call.findMany({
        where,
        include: { rep: { select: { id: true, name: true } } },
        orderBy: { recordedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.call.count({ where }),
    ])

    return NextResponse.json({
      calls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching calls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
