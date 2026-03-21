import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'

export async function GET() {
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
    if (!can(rbacUser, 'analytics:read') && !can(rbacUser, 'reports:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const orgId = user.orgId
    const now = new Date()

    // Current month boundaries
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    // 12 weeks ago for trend data
    const twelveWeeksAgo = new Date(now)
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

    // Fetch all necessary data in parallel
    const [
      thisMonthCalls,
      lastMonthCalls,
      trendCalls,
      reps,
      activeRepsCount,
      totalRepsCount,
    ] = await Promise.all([
      // This month's completed calls
      db.call.findMany({
        where: {
          orgId,
          status: 'COMPLETE',
          overallScore: { not: null },
          recordedAt: { gte: thisMonthStart },
        },
        select: {
          overallScore: true,
          scores: true,
          repId: true,
          recordedAt: true,
        },
      }),
      // Last month's completed calls
      db.call.findMany({
        where: {
          orgId,
          status: 'COMPLETE',
          overallScore: { not: null },
          recordedAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        select: {
          overallScore: true,
          scores: true,
          repId: true,
        },
      }),
      // Last 12 weeks for trend chart
      db.call.findMany({
        where: {
          orgId,
          status: 'COMPLETE',
          overallScore: { not: null },
          recordedAt: { gte: twelveWeeksAgo },
        },
        select: {
          overallScore: true,
          recordedAt: true,
          repId: true,
        },
        orderBy: { recordedAt: 'asc' },
      }),
      // Rep data with recent calls
      db.rep.findMany({
        where: { orgId, isActive: true },
        include: {
          calls: {
            where: {
              status: 'COMPLETE',
              overallScore: { not: null },
              recordedAt: { gte: lastMonthStart },
            },
            select: {
              overallScore: true,
              scores: true,
              recordedAt: true,
            },
            orderBy: { recordedAt: 'desc' },
            take: 100,
          },
        },
      }),
      db.rep.count({ where: { orgId, isActive: true } }),
      db.rep.count({ where: { orgId } }),
    ])

    // Helper
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

    // KPIs
    const currentCallCount = thisMonthCalls.length
    const lastMonthCallCount = lastMonthCalls.length
    const callsChange = lastMonthCallCount > 0
      ? Math.round(((currentCallCount - lastMonthCallCount) / lastMonthCallCount) * 100)
      : 0

    const currentAvgScore = Math.round(avg(thisMonthCalls.map(c => c.overallScore!)) * 10) / 10
    const lastMonthAvgScore = Math.round(avg(lastMonthCalls.map(c => c.overallScore!)) * 10) / 10
    const scoreChange = Math.round((currentAvgScore - lastMonthAvgScore) * 10) / 10

    // Weekly trend data
    const weeklyData = buildWeeklyData(trendCalls, 12)

    // Rep rankings
    const repRankings = reps.map(rep => {
      const thisMonthRepCalls = rep.calls.filter(c => c.recordedAt >= thisMonthStart)
      const lastMonthRepCalls = rep.calls.filter(c => c.recordedAt >= lastMonthStart && c.recordedAt <= lastMonthEnd)
      const thisMonthScores = thisMonthRepCalls.map(c => c.overallScore!).filter(Boolean)
      const lastMonthScores = lastMonthRepCalls.map(c => c.overallScore!).filter(Boolean)
      const thisAvg = avg(thisMonthScores)
      const lastAvg = avg(lastMonthScores)
      const trendValue = lastMonthScores.length > 0 ? Math.round((thisAvg - lastAvg) * 10) / 10 : 0

      // Extract top strength and biggest gap from scores
      let topStrength = ''
      let biggestGap = ''
      if (thisMonthRepCalls.length > 0) {
        const scoreCategories = aggregateScoreCategories(thisMonthRepCalls.map(c => c.scores))
        const sorted = Object.entries(scoreCategories).sort((a, b) => b[1] - a[1])
        if (sorted.length > 0) topStrength = sorted[0][0]
        if (sorted.length > 1) biggestGap = sorted[sorted.length - 1][0]
      }

      return {
        id: rep.id,
        name: rep.name,
        callsThisMonth: thisMonthRepCalls.length,
        avgScore: Math.round(thisAvg),
        trend: trendValue > 0 ? 'up' as const : trendValue < 0 ? 'down' as const : 'stable' as const,
        trendValue,
        topStrength,
        biggestGap,
      }
    }).sort((a, b) => b.avgScore - a.avgScore)

    // Insights based on real data
    const insights: string[] = []
    if (scoreChange > 0) {
      insights.push(`Team average score improved by ${scoreChange} points this month`)
    } else if (scoreChange < 0) {
      insights.push(`Team average score dropped by ${Math.abs(scoreChange)} points this month`)
    }
    const lowPerformers = repRankings.filter(r => r.avgScore > 0 && r.avgScore < 50)
    if (lowPerformers.length > 0) {
      insights.push(`${lowPerformers.length} rep(s) below score 50 - need attention`)
    }
    const mostImproved = repRankings.filter(r => r.trendValue > 0).sort((a, b) => b.trendValue - a.trendValue)
    if (mostImproved.length > 0 && mostImproved[0].trendValue > 2) {
      insights.push(`${mostImproved[0].name} showed the biggest improvement (+${mostImproved[0].trendValue} points)`)
    }
    if (callsChange > 10) {
      insights.push(`Call volume increased by ${callsChange}% compared to last month`)
    } else if (callsChange < -10) {
      insights.push(`Call volume decreased by ${Math.abs(callsChange)}% compared to last month`)
    }

    // Action items based on real data
    const actionItems: Array<{ type: 'coach' | 'review' | 'update'; rep: string | null; action: string }> = []
    for (const rep of lowPerformers.slice(0, 3)) {
      actionItems.push({
        type: 'coach',
        rep: rep.name,
        action: rep.biggestGap
          ? `Coaching needed on ${rep.biggestGap}`
          : 'Review recent calls and provide coaching',
      })
    }
    const declining = repRankings.filter(r => r.trendValue < -3)
    for (const rep of declining.slice(0, 2)) {
      actionItems.push({
        type: 'review',
        rep: rep.name,
        action: 'Review recent calls - performance declining',
      })
    }

    // Radar comparison: this month vs last month category averages
    const radarComparison = buildRadarComparison(thisMonthCalls, lastMonthCalls)

    return NextResponse.json({
      kpis: {
        totalCallsThisMonth: currentCallCount,
        totalCallsLastMonth: lastMonthCallCount,
        callsChange,
        avgTeamScore: currentAvgScore,
        avgTeamScoreLastMonth: lastMonthAvgScore,
        scoreChange,
        activeReps: activeRepsCount,
        totalReps: totalRepsCount,
      },
      weeklyData,
      reps: repRankings,
      insights,
      actionItems,
      radarComparison,
    })
  } catch (error) {
    console.error('Error fetching executive data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function buildWeeklyData(
  calls: Array<{ overallScore: number | null; recordedAt: Date }>,
  weeks: number
) {
  const now = new Date()
  const result = []

  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() - i * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 7)

    const weekCalls = calls.filter(
      c => c.recordedAt >= weekStart && c.recordedAt < weekEnd
    )
    const scores = weekCalls.map(c => c.overallScore!).filter(Boolean)
    const avgScore = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0

    result.push({
      week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
      score: avgScore,
      calls: weekCalls.length,
    })
  }

  return result
}

function aggregateScoreCategories(
  scoresArray: Array<unknown>
): Record<string, number> {
  const categories: Record<string, number[]> = {}

  for (const scores of scoresArray) {
    if (!scores || typeof scores !== 'object') continue
    const s = scores as Record<string, unknown>
    for (const [key, val] of Object.entries(s)) {
      if (typeof val === 'number') {
        if (!categories[key]) categories[key] = []
        categories[key].push(val)
      }
    }
  }

  const result: Record<string, number> = {}
  for (const [key, vals] of Object.entries(categories)) {
    result[key] = vals.reduce((a, b) => a + b, 0) / vals.length
  }
  return result
}

function buildRadarComparison(
  thisMonthCalls: Array<{ scores: unknown }>,
  lastMonthCalls: Array<{ scores?: unknown }>
) {
  const thisMonthCategories = aggregateScoreCategories(
    thisMonthCalls.map(c => c.scores)
  )
  const lastMonthCategories = aggregateScoreCategories(
    lastMonthCalls.map(c => (c as { scores?: unknown }).scores).filter(Boolean)
  )

  // Use the categories from this month as the base
  const allCategories = [
    ...new Set([
      ...Object.keys(thisMonthCategories),
      ...Object.keys(lastMonthCategories),
    ]),
  ]

  if (allCategories.length === 0) {
    return {
      categories: [],
      thisMonth: [],
      lastMonth: [],
    }
  }

  return {
    categories: allCategories,
    thisMonth: allCategories.map(c => Math.round((thisMonthCategories[c] || 0) * 10) / 10),
    lastMonth: allCategories.map(c => Math.round((lastMonthCategories[c] || 0) * 10) / 10),
  }
}
