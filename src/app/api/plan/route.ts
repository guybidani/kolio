import { NextResponse } from 'next/server'
import { getSession, requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkPlanLimits, PLAN_LIMITS } from '@/lib/plan-limits'
import type { Plan } from '@/types'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await checkPlanLimits(session.orgId)
    return NextResponse.json(status)
  } catch (error) {
    console.error('Plan GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin()

    const { orgId, plan, planSeats, trialEndsAt } = await req.json()

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 })
    }

    const org = await db.organization.findUnique({ where: { id: orgId } })
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const validPlans: Plan[] = ['TRIAL', 'STARTER', 'PRO', 'ENTERPRISE']
    const updateData: Record<string, unknown> = {}

    if (plan && validPlans.includes(plan)) {
      updateData.plan = plan
      // Set default seats for new plan if not explicitly provided
      if (!planSeats) {
        updateData.planSeats = PLAN_LIMITS[plan as Plan].seats === -1
          ? 999
          : PLAN_LIMITS[plan as Plan].seats
      }
    }

    if (planSeats !== undefined && typeof planSeats === 'number' && planSeats > 0) {
      updateData.planSeats = planSeats
    }

    if (trialEndsAt) {
      updateData.trialEndsAt = new Date(trialEndsAt)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await db.organization.update({
      where: { id: orgId },
      data: updateData,
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      plan: updated.plan,
      planSeats: updated.planSeats,
      trialEndsAt: updated.trialEndsAt,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Plan POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
