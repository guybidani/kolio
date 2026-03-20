import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { can, canAccessCall } from '@/lib/permissions'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const call = await db.call.findFirst({
      where: { id, orgId: user.orgId },
      include: {
        rep: true,
      },
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    // RBAC: check if user can access this specific call
    const rbacUser = {
      id: user.id,
      role: user.role,
      orgId: user.orgId,
      isAdmin: user.isAdmin,
      repProfileId: user.repProfile?.id ?? null,
    }
    if (!canAccessCall(rbacUser, call)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(call)
  } catch (error) {
    console.error('Error fetching call:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (!can(rbacUser, 'calls:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    // Only allow updating certain fields with validation
    const updateData: Record<string, unknown> = {}

    // Validate repId belongs to same org
    if (body.repId !== undefined) {
      if (body.repId !== null) {
        const rep = await db.rep.findFirst({
          where: { id: body.repId, orgId: user.orgId },
        })
        if (!rep) {
          return NextResponse.json({ error: 'Rep not found in your organization' }, { status: 400 })
        }
      }
      updateData.repId = body.repId
    }

    // Validate direction is an allowed value
    if (body.direction !== undefined) {
      const allowedDirections = ['INBOUND', 'OUTBOUND', 'UNKNOWN']
      if (!allowedDirections.includes(body.direction)) {
        return NextResponse.json({ error: 'Invalid direction' }, { status: 400 })
      }
      updateData.direction = body.direction
    }

    // Sanitize phone number fields (strip non-phone characters)
    if (body.callerNumber !== undefined) {
      updateData.callerNumber = String(body.callerNumber || '').replace(/[^\d+\-() ]/g, '').slice(0, 20)
    }
    if (body.calledNumber !== undefined) {
      updateData.calledNumber = String(body.calledNumber || '').replace(/[^\d+\-() ]/g, '').slice(0, 20)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const call = await db.call.update({
      where: { id, orgId: user.orgId },
      data: updateData,
    })

    return NextResponse.json(call)
  } catch (error) {
    console.error('Error updating call:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
