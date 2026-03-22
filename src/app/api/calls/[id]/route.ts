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

    // Assemble the analysis object from individual call fields
    const scores = call.scores as Record<string, number> | null
    const hasAnalysis = call.status === 'COMPLETE' && scores

    const analysis = hasAnalysis ? {
      call_metadata: {
        prospect_name: call.prospectName || '',
        prospect_business: call.prospectBusiness || '',
        prospect_tier: 'unknown',
        estimated_media_budget: '',
        call_duration_estimate: call.duration < 300 ? 'short' : call.duration < 900 ? 'medium' : 'long',
        decision_maker: false,
        other_stakeholders: null,
      },
      call_type: (call.callType as string) || undefined,
      summary: {
        prospect_needs: call.summary || '',
        what_was_offered: '',
        what_was_agreed: '',
        current_marketing: '',
      },
      scores: scores as { overall: number; discovery: number; objection_handling: number; closing: number; rapport: number; value_communication: number },
      scores_reasoning: '',
      coaching_format: call.coachingTips && typeof call.coachingTips === 'object' && !Array.isArray(call.coachingTips)
        ? call.coachingTips as { wins: Array<{ point: string; evidence: string }>; improvements: Array<{ point: string; advice: string }>; focus_area: { area: string; tip_hebrew: string } }
        : undefined,
      buying_signals: [],
      buying_signals_enhanced: (call.buyingSignals as Array<{ signal: string; minute_mark: number; strength: 'weak' | 'moderate' | 'strong' }>) || undefined,
      objections_detected: (call.objections as Array<Record<string, unknown>>) || [],
      pain_points: [],
      retention_points: (call.retentionPoints as Array<Record<string, unknown>>) || [],
      improvement_points: (call.improvementPoints as Array<Record<string, unknown>>) || [],
      next_call_prep: (call.nextCallPrep as Record<string, unknown>) || undefined,
      pricing_discussion_details: (call.pricingDetails as { mentioned: boolean; count: number; first_mention_minute: number; context: string }) || undefined,
      // competitorMentions may contain either detailed (with minute_mark/sentiment) or old format (with timestamp)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      competitor_mentions_detailed: Array.isArray(call.competitorMentions) && (call.competitorMentions as any[])[0]?.minute_mark !== undefined
        ? (call.competitorMentions as Array<{ name: string; context: string; minute_mark: number; sentiment: 'positive' | 'negative' | 'neutral' }>)
        : undefined,
      questions_analysis: (call.keyMoments as { total_asked: number; open_questions: number; closed_questions: number; best_question: string; question_distribution: string } | null) || undefined,
      next_steps_clarity: (call.nextStepsClarity as { has_next_steps: boolean; is_specific: boolean; is_scheduled: boolean; description: string }) || undefined,
      benchmark_comparison: (call.benchmarkComparison as { talk_ratio: { actual: number; benchmark: number; verdict: string }; questions_asked: { actual: number; benchmark: number; verdict: string }; longest_monologue: { actual: number; benchmark: number; verdict: string } }) || undefined,
      advanced_metrics: {
        talk_ratio_rep: call.talkRatioRep ?? 0,
        talk_ratio_customer: call.talkRatioCustomer ?? 0,
        filler_word_count: call.fillerWordCount ?? 0,
        question_count: call.questionCount ?? 0,
        longest_monologue_seconds: call.longestMonologue ?? 0,
        silence_gaps: call.silenceGaps ?? 0,
        energy_score: call.energyScore ?? 0,
        next_steps_score: call.nextStepsScore ?? 0,
        competitor_mentions: (call.competitorMentions as Array<{ name: string; context: string; timestamp: string }>) || [],
        pricing_discussion: (call.pricingDiscussion as { mentioned: boolean; timestamp: string | null; handling: string }) || { mentioned: false, timestamp: null, handling: '' },
        sentiment_trajectory: (call.sentimentTrajectory as { start: string; middle: string; end: string }) || undefined,
      },
      missed_opportunities: [],
      spin_analysis: (call.spinAnalysis as Record<string, string>) || undefined,
      _internal: (call.internalInsights as Record<string, unknown>) || undefined,
    } : null

    return NextResponse.json({
      ...call,
      analysis,
      utterances: call.transcript,
    })
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
