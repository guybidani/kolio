import { Worker, Job } from 'bullmq'
import { connection } from '@/lib/queue'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { analyzeCallTranscript } from '@/lib/openai'
import { buildAnalysisPrompt } from '@/lib/analysis-prompt'
import { checkAndAwardBadges } from '@/lib/badges'
import { updateStreaks } from '@/lib/streaks'
import { notifyCallEvent } from '@/lib/notifications'
import type { CallAnalysis } from '@/types'

interface AnalyzeJobData {
  callId: string
  orgId: string
}

async function processAnalysis(job: Job<AnalyzeJobData>) {
  const { callId, orgId } = job.data

  // Tenant isolation: always verify call belongs to the expected org
  const call = await db.call.findFirst({
    where: { id: callId, orgId },
    include: { rep: true },
  })
  if (!call) throw new Error(`Call ${callId} not found for org ${orgId}`)
  if (!call.transcriptText) throw new Error(`Call ${callId} has no transcript`)

  await db.call.update({
    where: { id: callId },
    data: { status: 'ANALYZING' },
  })

  try {
    // Load playbook context for this org
    const playbook = await db.playbook.findFirst({
      where: { orgId, isDefault: true, isActive: true },
    })

    // Build customized system prompt from org's playbook
    const customSystemPrompt = buildAnalysisPrompt(
      playbook
        ? {
            name: playbook.name,
            stages: playbook.stages,
            objectionBank: playbook.objectionBank,
            keywords: playbook.keywords,
            techniques: (playbook as Record<string, unknown>).techniques,
            scripts: (playbook as Record<string, unknown>).scripts,
          }
        : null
    )

    const analysis = (await analyzeCallTranscript(
      call.transcriptText,
      call.rep?.name || 'Unknown',
      call.callerNumber || '',
      call.recordedAt.toISOString().split('T')[0],
      Math.round(call.duration / 60),
      call.direction,
      undefined,
      customSystemPrompt
    )) as unknown as CallAnalysis

    // Store analysis results - use JSON roundtrip to ensure Prisma-compatible types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toJson = (val: unknown) => JSON.parse(JSON.stringify(val ?? null)) as any

    await db.call.update({
      where: { id: callId },
      data: {
        status: 'COMPLETE',
        overallScore: analysis.scores?.overall || null,
        scores: toJson(analysis.scores),
        summary: analysis.summary?.prospect_needs || null,
        prospectName: analysis.call_metadata?.prospect_name || null,
        prospectBusiness: analysis.call_metadata?.prospect_business || null,
        objections: toJson(analysis.objections_detected),
        retentionPoints: toJson(analysis.retention_points),
        improvementPoints: toJson(analysis.improvement_points),
        nextCallPrep: toJson(analysis.next_call_prep),
        spinAnalysis: toJson(analysis.spin_analysis),
        internalInsights: toJson(analysis._internal),
        coachingTips: toJson(analysis.coaching_format ?? analysis.improvement_points?.map((p) => p.suggested_behavior)),
        keyMoments: toJson(analysis.questions_analysis),
        talkRatio: Prisma.JsonNull,
        // Advanced analytics fields
        fillerWordCount: analysis.advanced_metrics?.filler_word_count ?? null,
        questionCount: analysis.advanced_metrics?.question_count ?? null,
        longestMonologue: analysis.advanced_metrics?.longest_monologue_seconds ?? null,
        silenceGaps: analysis.advanced_metrics?.silence_gaps ?? null,
        talkRatioRep: analysis.advanced_metrics?.talk_ratio_rep ?? null,
        talkRatioCustomer: analysis.advanced_metrics?.talk_ratio_customer ?? null,
        energyScore: analysis.advanced_metrics?.energy_score ?? null,
        nextStepsScore: analysis.advanced_metrics?.next_steps_score ?? null,
        competitorMentions: toJson(analysis.competitor_mentions_detailed || analysis.advanced_metrics?.competitor_mentions),
        pricingDiscussion: toJson(analysis.advanced_metrics?.pricing_discussion),
        sentimentTrajectory: toJson(analysis.advanced_metrics?.sentiment_trajectory),
        // Enhanced analysis fields
        callType: analysis.call_type || null,
        pricingDetails: toJson(analysis.pricing_discussion_details),
        buyingSignals: toJson(analysis.buying_signals_enhanced),
        nextStepsClarity: toJson(analysis.next_steps_clarity),
        benchmarkComparison: toJson(analysis.benchmark_comparison),
        processedAt: new Date(),
      },
    })

    // If any retention points are playbook-worthy, flag them
    const playbookWorthy = analysis.retention_points?.filter((p) => p.playbook_worthy) || []
    if (playbookWorthy.length > 0 && playbook) {
      const currentBank = (playbook.objectionBank as unknown as unknown[]) || []
      await db.playbook.update({
        where: { id: playbook.id },
        data: {
          objectionBank: toJson([...currentBank, ...playbookWorthy]),
        },
      })
    }

    // Gamification: award badges, update streaks, send notifications
    const overallScore = analysis.scores?.overall ?? null
    if (call.repId) {
      try {
        const [badges] = await Promise.all([
          checkAndAwardBadges(callId, orgId, call.repId),
          updateStreaks(call.repId, orgId, overallScore),
        ])
        await notifyCallEvent(callId, orgId, call.repId, overallScore, badges)
      } catch (gamificationError) {
        // Don't fail the analysis if gamification fails
        console.error('[Analyze] Gamification error:', gamificationError)
      }
    }

    return { callId, score: analysis.scores?.overall }
  } catch (error) {
    await db.call.update({
      where: { id: callId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Analysis failed',
      },
    })
    throw error
  }
}

export const analyzeWorker = new Worker('call-analysis', processAnalysis, {
  connection,
  concurrency: 2,
  limiter: {
    max: 5,
    duration: 60000,
  },
})

analyzeWorker.on('completed', (job) => {
  console.log(`[Analyze] Completed: ${job.id}`)
})

analyzeWorker.on('failed', (job, err) => {
  console.error(`[Analyze] Failed: ${job?.id}`, err.message)
})
