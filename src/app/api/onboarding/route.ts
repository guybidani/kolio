import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [repsCount, callsCount, playbook, pbxCount, org] = await Promise.all([
      db.rep.count({ where: { orgId: session.orgId, isActive: true } }),
      db.call.count({ where: { orgId: session.orgId } }),
      db.playbook.findFirst({ where: { orgId: session.orgId, isActive: true } }),
      db.pbxIntegration.count({ where: { orgId: session.orgId } }),
      db.organization.findUnique({ where: { id: session.orgId }, select: { settings: true } }),
    ])

    const settings = (org?.settings as Record<string, unknown>) || {}
    const dismissed = settings.onboardingDismissed === true

    const hasReps = repsCount > 0
    const hasCalls = callsCount > 0
    const hasPlaybook = playbook !== null
    const hasIntegration = pbxCount > 0
    const isComplete = dismissed || (hasReps && hasCalls && hasPlaybook && hasIntegration)

    return NextResponse.json({
      hasReps,
      hasCalls,
      hasPlaybook,
      hasIntegration,
      isComplete,
    })
  } catch (error) {
    console.error('[Onboarding GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const org = await db.organization.findUnique({
      where: { id: session.orgId },
      select: { settings: true },
    })

    const currentSettings = (org?.settings as Record<string, unknown>) || {}

    await db.organization.update({
      where: { id: session.orgId },
      data: {
        settings: {
          ...currentSettings,
          onboardingDismissed: true,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Onboarding POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
