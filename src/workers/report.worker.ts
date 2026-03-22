import { Worker, Job } from 'bullmq'
import { connection } from '@/lib/queue'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { weeklyDigestEmail } from '@/lib/email-templates'

interface ReportJobData {
  orgId: string
  weekStart?: string // ISO date, defaults to last Monday
}

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
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
  const topRepScore = leaderboard[0]?.avgScore || null

  // Count active reps (reps who had at least one call this week)
  const activeReps = Object.keys(repStats).filter((id) => id !== 'unassigned').length

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

  // Calls needing attention (lowest scored calls)
  const callsNeedingAttention = scoredCalls
    .filter((c) => (c.overallScore || 0) < 5)
    .sort((a, b) => (a.overallScore || 0) - (b.overallScore || 0))
    .slice(0, 3)
    .map((c) => ({
      repName: c.rep?.name || 'לא משויך',
      score: c.overallScore || 0,
      callId: c.id,
    }))

  // Calculate score trend vs previous week
  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  const prevReport = await db.weeklyReport.findUnique({
    where: { orgId_weekStart: { orgId, weekStart: prevWeekStart } },
  })
  let scoreTrend: number | null = null
  if (prevReport?.avgScore && avgScore) {
    scoreTrend = ((avgScore - prevReport.avgScore) / prevReport.avgScore) * 100
  }

  // Generate a key insight from the data
  let keyInsight: string | null = null
  if (highlights.length > 0) {
    keyInsight = highlights[0]
  } else if (scoreTrend !== null && scoreTrend > 5) {
    keyInsight = `הצוות שיפר את הביצועים ב-${scoreTrend.toFixed(1)}% השבוע — כל הכבוד!`
  } else if (scoreTrend !== null && scoreTrend < -5) {
    keyInsight = `חלה ירידה של ${Math.abs(scoreTrend).toFixed(1)}% בציון הממוצע. מומלץ לבדוק שיחות עם ציונים נמוכים.`
  } else if (totalCalls > 0) {
    keyInsight = `${totalCalls} שיחות נותחו השבוע עם ציון ממוצע של ${avgScore?.toFixed(1) || '-'}.`
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

  // ── Send email digest to all ADMIN, CEO, and MANAGER users ──
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kolio.projectadam.co.il'

  const recipients = await db.user.findMany({
    where: {
      orgId,
      isActive: true,
      emailDigest: true,
      role: { in: ['ADMIN', 'CEO', 'MANAGER'] },
    },
    select: { id: true, email: true, name: true },
  })

  let emailsSent = 0
  for (const user of recipients) {
    const unsubscribeUrl = `${appUrl}/dashboard/settings?tab=notifications&unsubscribe=digest&uid=${user.id}`

    const html = weeklyDigestEmail({
      recipientName: user.name,
      weekStartDate: formatDate(weekStart),
      weekEndDate: formatDate(weekEnd),
      totalCalls,
      avgScore,
      activeReps,
      topRepName: topRep,
      topRepScore,
      scoreTrend,
      callsNeedingAttention,
      keyInsight,
      appUrl,
      unsubscribeUrl,
    })

    const success = await sendEmail({
      to: user.email,
      subject: `דוח שבועי - ${formatDate(weekStart)} עד ${formatDate(weekEnd)} | Kolio`,
      html,
    })
    if (success) emailsSent++
  }

  // Track email sent status
  if (emailsSent > 0) {
    await db.weeklyReport.update({
      where: { id: report.id },
      data: { emailSentAt: new Date() },
    })
  }

  console.log(`[Report] Sent ${emailsSent}/${recipients.length} digest emails for org ${orgId}`)

  return { reportId: report.id, totalCalls, avgScore, emailsSent }
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
