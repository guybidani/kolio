import { Worker, Job } from 'bullmq'
const connection = {
  host: new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname || 'localhost',
  port: parseInt(new URL(process.env.REDIS_URL || 'redis://localhost:6379').port || '6379'),
}
import { db } from '@/lib/db'

interface ReportJobData {
  orgId: string
  weekStart?: string // ISO date, defaults to last Monday
}

async function generateWeeklyReport(job: Job<ReportJobData>) {
  const { orgId, weekStart: weekStartStr } = job.data

  // Calculate week boundaries
  const now = new Date()
  let weekStart: Date
  if (weekStartStr) {
    weekStart = new Date(weekStartStr)
  } else {
    weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() - 6) // Last Monday
    weekStart.setHours(0, 0, 0, 0)
  }
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  // Get all completed calls for the week
  const calls = await db.call.findMany({
    where: {
      orgId,
      status: 'COMPLETE',
      recordedAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    include: { rep: true },
  })

  if (calls.length === 0) {
    return { orgId, message: 'No calls this week' }
  }

  // Calculate aggregate stats
  const totalCalls = calls.length
  const scoredCalls = calls.filter((c) => c.overallScore !== null)
  const avgScore = scoredCalls.length > 0
    ? scoredCalls.reduce((sum, c) => sum + (c.overallScore || 0), 0) / scoredCalls.length
    : null

  // Rep leaderboard
  const repStats: Record<string, { name: string; calls: number; totalScore: number }> = {}
  for (const call of calls) {
    const repId = call.repId || 'unassigned'
    const repName = call.rep?.name || 'Unassigned'
    if (!repStats[repId]) {
      repStats[repId] = { name: repName, calls: 0, totalScore: 0 }
    }
    repStats[repId].calls++
    repStats[repId].totalScore += call.overallScore || 0
  }

  const leaderboard = Object.entries(repStats)
    .map(([id, stats]) => ({
      repId: id,
      name: stats.name,
      calls: stats.calls,
      avgScore: stats.calls > 0 ? stats.totalScore / stats.calls : 0,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)

  const topRep = leaderboard[0]?.name || null

  // Collect highlights (top retention points from the week)
  const highlights = calls
    .filter((c) => c.retentionPoints)
    .flatMap((c) => {
      const points = c.retentionPoints as unknown as Array<{
        what: string
        playbook_worthy: boolean
      }>
      return points.filter((p) => p.playbook_worthy).map((p) => p.what)
    })
    .slice(0, 5)

  // Common objection patterns
  const objectionTypes: Record<string, number> = {}
  for (const call of calls) {
    const objections = call.objections as unknown as Array<{ type: string }> | null
    if (objections) {
      for (const obj of objections) {
        objectionTypes[obj.type] = (objectionTypes[obj.type] || 0) + 1
      }
    }
  }

  // Score distribution
  const scoreDistribution = {
    poor: scoredCalls.filter((c) => (c.overallScore || 0) <= 3).length,
    needsWork: scoredCalls.filter((c) => (c.overallScore || 0) > 3 && (c.overallScore || 0) <= 5).length,
    solid: scoredCalls.filter((c) => (c.overallScore || 0) > 5 && (c.overallScore || 0) <= 7).length,
    strong: scoredCalls.filter((c) => (c.overallScore || 0) > 7 && (c.overallScore || 0) <= 9).length,
    masterclass: scoredCalls.filter((c) => (c.overallScore || 0) === 10).length,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toJson = (val: unknown) => JSON.parse(JSON.stringify(val ?? null)) as any

  // Save report
  const report = await db.weeklyReport.upsert({
    where: {
      orgId_weekStart: { orgId, weekStart },
    },
    create: {
      orgId,
      weekStart,
      weekEnd,
      totalCalls,
      avgScore,
      topRep,
      highlights: toJson(highlights),
      data: toJson({ leaderboard, objectionTypes, scoreDistribution }),
    },
    update: {
      totalCalls,
      avgScore,
      topRep,
      highlights: toJson(highlights),
      data: toJson({ leaderboard, objectionTypes, scoreDistribution }),
    },
  })

  return { reportId: report.id, totalCalls, avgScore }
}

export const reportWorker = new Worker('weekly-report', generateWeeklyReport, {
  connection,
  concurrency: 1,
})

reportWorker.on('completed', (job) => {
  console.log(`[Report] Completed: ${job.id}`)
})

reportWorker.on('failed', (job, err) => {
  console.error(`[Report] Failed: ${job?.id}`, err.message)
})
