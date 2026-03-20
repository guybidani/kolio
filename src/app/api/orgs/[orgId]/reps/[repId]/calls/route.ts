import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'
import type { Prisma } from '@prisma/client'

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

    if (!can(rbacUser, 'calls:read') && !can(rbacUser, 'calls:read:own')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify rep exists in this org
    const rep = await db.rep.findFirst({
      where: { id: repId, orgId },
    })

    if (!rep) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    // Parse query params
    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1') || 1)
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20') || 20))
    const skip = (page - 1) * limit
    const sortBy = url.searchParams.get('sortBy') === 'score' ? 'overallScore' : 'recordedAt'
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    const status = url.searchParams.get('status')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')

    // Build where clause
    const where: Prisma.CallWhereInput = { repId, orgId }

    if (status) {
      const validStatuses = ['UPLOADED', 'TRANSCRIBING', 'TRANSCRIBED', 'ANALYZING', 'COMPLETE', 'FAILED']
      if (validStatuses.includes(status)) {
        where.status = status as Prisma.CallWhereInput['status']
      }
    }

    if (dateFrom || dateTo) {
      where.recordedAt = {}
      if (dateFrom) {
        const from = new Date(dateFrom)
        if (!isNaN(from.getTime())) {
          (where.recordedAt as Prisma.DateTimeFilter).gte = from
        }
      }
      if (dateTo) {
        const to = new Date(dateTo)
        if (!isNaN(to.getTime())) {
          (where.recordedAt as Prisma.DateTimeFilter).lte = to
        }
      }
    }

    const orderBy: Prisma.CallOrderByWithRelationInput = { [sortBy]: sortOrder }

    const [calls, total] = await Promise.all([
      db.call.findMany({
        where,
        select: {
          id: true,
          overallScore: true,
          status: true,
          duration: true,
          direction: true,
          recordedAt: true,
          summary: true,
          prospectName: true,
          source: true,
        },
        orderBy,
        take: limit,
        skip,
      }),
      db.call.count({ where }),
    ])

    return NextResponse.json({
      calls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Rep calls GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
