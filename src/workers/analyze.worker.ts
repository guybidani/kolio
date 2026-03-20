import { Worker, Job } from 'bullmq'
const connection = {
  host: new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname || 'localhost',
  port: parseInt(new URL(process.env.REDIS_URL || 'redis://localhost:6379').port || '6379'),
}
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { analyzeCallTranscript } from '@/lib/openai'
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

    let playbookContext = ''
    if (playbook) {
      playbookContext = `## Playbook: ${playbook.name}
Stages: ${JSON.stringify(playbook.stages)}
Objection Bank: ${JSON.stringify(playbook.objectionBank)}
Keywords: ${JSON.stringify(playbook.keywords)}`
    }

    const analysis = (await analyzeCallTranscript(
      call.transcriptText,
      call.rep?.name || 'Unknown',
      call.callerNumber || '',
      call.recordedAt.toISOString().split('T')[0],
      Math.round(call.duration / 60),
      call.direction,
      playbookContext
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
        coachingTips: toJson(analysis.improvement_points?.map((p) => p.suggested_behavior)),
        talkRatio: Prisma.JsonNull,
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
