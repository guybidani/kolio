import crypto from 'crypto'
import { db } from '@/lib/db'

interface VixyCrmConfig {
  enabled: boolean
  webhookUrl: string     // e.g. https://crm.projectadam.co.il/api/v1/kolio/webhook
  webhookSecret: string
  workspaceId: string    // Vixy CRM workspace to push into
}

/**
 * Get Vixy CRM integration config from org settings.
 * Returns null if not configured or disabled.
 */
export async function getVixyCrmConfig(orgId: string): Promise<VixyCrmConfig | null> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { settings: true },
  })
  if (!org?.settings || typeof org.settings !== 'object') return null

  const settings = org.settings as Record<string, unknown>
  const vixy = settings.vixyCrm as Record<string, unknown> | undefined
  if (!vixy?.enabled || !vixy.webhookUrl || !vixy.webhookSecret || !vixy.workspaceId) {
    return null
  }

  return {
    enabled: true,
    webhookUrl: vixy.webhookUrl as string,
    webhookSecret: vixy.webhookSecret as string,
    workspaceId: vixy.workspaceId as string,
  }
}

/**
 * Push completed call analysis to Vixy CRM as a CALL activity.
 * Fails silently — never breaks the analysis pipeline.
 */
export async function pushToVixyCrm(callId: string, orgId: string): Promise<void> {
  const config = await getVixyCrmConfig(orgId)
  if (!config) return

  const call = await db.call.findFirst({
    where: { id: callId, orgId },
    include: { rep: true },
  })
  if (!call || call.status !== 'COMPLETE') return

  const payload = {
    workspaceId: config.workspaceId,
    call: {
      id: call.id,
      repName: call.rep?.name || undefined,
      callerNumber: call.callerNumber || undefined,
      calledNumber: call.calledNumber || undefined,
      direction: call.direction,
      duration: call.duration,
      recordedAt: call.recordedAt.toISOString(),
      callType: call.callType || undefined,
    },
    analysis: {
      overallScore: call.overallScore,
      scores: call.scores as Record<string, number> | null,
      summary: call.summary || undefined,
      prospectName: call.prospectName || undefined,
      prospectBusiness: call.prospectBusiness || undefined,
      coachingTips: call.coachingTips,
      objections: call.objections,
      retentionPoints: call.retentionPoints,
      improvementPoints: call.improvementPoints,
      buyingSignals: call.buyingSignals,
      nextCallPrep: call.nextCallPrep,
      talkRatioRep: call.talkRatioRep,
      talkRatioCustomer: call.talkRatioCustomer,
    },
    // Send phone number so Vixy CRM can match to a contact
    contactPhone: call.direction === 'OUTBOUND' ? call.calledNumber : call.callerNumber,
  }

  const body = JSON.stringify(payload)
  const signature = crypto
    .createHmac('sha256', config.webhookSecret)
    .update(body)
    .digest('hex')

  const res = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Kolio-Signature': signature,
    },
    body,
    signal: AbortSignal.timeout(10000), // 10s timeout
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'no body')
    console.error(`[VixyCRM] Push failed for call ${callId}: ${res.status} ${text}`)
  } else {
    const data = await res.json().catch(() => ({}))
    console.log(`[VixyCRM] Pushed call ${callId} → activity ${(data as Record<string, unknown>).activityId}${(data as Record<string, unknown>).contactMatched ? ' (contact matched)' : ''}`)
  }
}
