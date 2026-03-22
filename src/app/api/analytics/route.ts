import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { SALES_BENCHMARKS, classifyBenchmark, gapFromIdeal } from '@/lib/benchmarks'

export async function GET(req: Request) {
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

    const orgId = user.orgId
    const url = new URL(req.url)
    const period = url.searchParams.get('period') || 'monthly' // daily, weekly, monthly
    const repId = url.searchParams.get('repId') || undefined

    // Base where clause with tenant isolation
    const baseWhere = {
      orgId,
      status: 'COMPLETE' as const,
      overallScore: { not: null },
      ...(repId ? { repId } : {}),
    }

    // 1. Get all completed calls for the org
    const calls = await db.call.findMany({
      where: baseWhere,
      select: {
        id: true,
        repId: true,
        overallScore: true,
        scores: true,
        fillerWordCount: true,
        questionCount: true,
        longestMonologue: true,
        silenceGaps: true,
        talkRatioRep: true,
        talkRatioCustomer: true,
        energyScore: true,
        nextStepsScore: true,
        pricingDiscussion: true,
        recordedAt: true,
        rep: { select: { id: true, name: true } },
      },
      orderBy: { recordedAt: 'desc' },
      take: 500, // Reasonable limit for aggregation
    })

    // 2. Aggregate scores by time period
    const scoresByPeriod = aggregateByPeriod(calls, period)

    // 3. Rep comparison data
    const repMap = new Map<string, {
      name: string
      scores: number[]
      fillerWords: number[]
      talkRatios: number[]
      energyScores: number[]
      callDates: string[]
    }>()

    for (const call of calls) {
      if (!call.repId || !call.rep) continue
      if (!repMap.has(call.repId)) {
        repMap.set(call.repId, {
          name: call.rep.name,
          scores: [],
          fillerWords: [],
          talkRatios: [],
          energyScores: [],
          callDates: [],
        })
      }
      const rep = repMap.get(call.repId)!
      if (call.overallScore != null) rep.scores.push(call.overallScore)
      if (call.fillerWordCount != null) rep.fillerWords.push(call.fillerWordCount)
      if (call.talkRatioRep != null) rep.talkRatios.push(call.talkRatioRep)
      if (call.energyScore != null) rep.energyScores.push(call.energyScore)
      rep.callDates.push(call.recordedAt.toISOString())
    }

    const repComparison = Array.from(repMap.entries()).map(([id, data]) => {
      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
      // Trend: compare first half vs second half of scores
      const mid = Math.floor(data.scores.length / 2)
      const recentAvg = avg(data.scores.slice(0, mid || 1))
      const olderAvg = avg(data.scores.slice(mid || 1))
      const trend = data.scores.length > 3 ? recentAvg - olderAvg : 0

      return {
        id,
        name: data.name,
        avgScore: Math.round(avg(data.scores) * 10) / 10,
        avgFillerWords: Math.round(avg(data.fillerWords) * 10) / 10,
        avgTalkRatio: Math.round(avg(data.talkRatios) * 10) / 10,
        avgEnergy: Math.round(avg(data.energyScores) * 10) / 10,
        totalCalls: data.scores.length,
        trend: Math.round(trend * 10) / 10,
      }
    }).sort((a, b) => b.avgScore - a.avgScore)

    // 4. Call volume by period
    const callVolume = aggregateCallVolume(calls, period)

    // 5. Score distribution histogram
    const scoreBins = [0, 0, 0, 0, 0] // 0-2, 2-4, 4-6, 6-8, 8-10
    for (const call of calls) {
      if (call.overallScore == null) continue
      const bin = Math.min(4, Math.floor(call.overallScore / 2))
      scoreBins[bin]++
    }
    const scoreDistribution = [
      { range: '0-2', count: scoreBins[0], color: '#EF4444' },
      { range: '2-4', count: scoreBins[1], color: '#F97316' },
      { range: '4-6', count: scoreBins[2], color: '#EAB308' },
      { range: '6-8', count: scoreBins[3], color: '#22C55E' },
      { range: '8-10', count: scoreBins[4], color: '#059669' },
    ]

    // 6. Talk ratio distribution
    const talkRatioDistribution = calls
      .filter((c) => c.talkRatioRep != null)
      .map((c) => ({
        rep: c.talkRatioRep!,
        customer: c.talkRatioCustomer ?? (100 - c.talkRatioRep!),
      }))

    // 7. Overall averages
    const avgAll = (arr: (number | null)[]) => {
      const valid = arr.filter((v): v is number => v != null)
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0
    }

    const summary = {
      totalCalls: calls.length,
      avgScore: Math.round(avgAll(calls.map((c) => c.overallScore)) * 10) / 10,
      avgTalkRatio: Math.round(avgAll(calls.map((c) => c.talkRatioRep)) * 10) / 10,
      avgFillerWords: Math.round(avgAll(calls.map((c) => c.fillerWordCount)) * 10) / 10,
      avgEnergy: Math.round(avgAll(calls.map((c) => c.energyScore)) * 10) / 10,
      avgNextSteps: Math.round(avgAll(calls.map((c) => c.nextStepsScore)) * 10) / 10,
      totalCoachingTips: calls.length * 3, // Approximate
    }

    // 8. Team benchmark comparison (Gong research data)
    const getPricingMentions = (pd: unknown): number | null => {
      if (!pd || typeof pd !== 'object') return null
      const obj = pd as Record<string, unknown>
      if (typeof obj.count === 'number') return obj.count
      if (Array.isArray(obj.mentions)) return obj.mentions.length
      return null
    }
    const getPricingTiming = (pd: unknown): number | null => {
      if (!pd || typeof pd !== 'object') return null
      const obj = pd as Record<string, unknown>
      if (typeof obj.firstMentionMinute === 'number') return obj.firstMentionMinute
      if (typeof obj.timing === 'number') return obj.timing
      return null
    }

    const teamBenchmarks = {
      talkRatio: {
        value: Math.round(avgAll(calls.map((c) => c.talkRatioRep)) * 10) / 10,
      },
      questionsPerCall: {
        value: Math.round(avgAll(calls.map((c) => c.questionCount)) * 10) / 10,
      },
      longestMonologue: {
        value: Math.round(avgAll(calls.map((c) => c.longestMonologue)) * 10) / 10,
      },
      pricingMentions: {
        value: Math.round(avgAll(calls.map((c) => getPricingMentions(c.pricingDiscussion))) * 10) / 10,
      },
      pricingTiming: {
        value: Math.round(avgAll(calls.map((c) => getPricingTiming(c.pricingDiscussion))) * 10) / 10,
      },
    }

    const teamBenchmarkAnalysis = Object.entries(teamBenchmarks).map(([key, { value }]) => ({
      key,
      value,
      zone: classifyBenchmark(key, value),
      gap: gapFromIdeal(key, value),
      ideal: SALES_BENCHMARKS[key]?.ideal ?? 0,
      label: SALES_BENCHMARKS[key]?.label ?? key,
    }))

    return NextResponse.json({
      summary,
      scoresByPeriod,
      repComparison,
      callVolume,
      scoreDistribution,
      talkRatioDistribution,
      teamBenchmarks,
      teamBenchmarkAnalysis,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

interface CallRow {
  overallScore: number | null
  scores: unknown
  recordedAt: Date
  fillerWordCount: number | null
  energyScore: number | null
  talkRatioRep: number | null
}

function getPeriodKey(date: Date, period: string): string {
  const d = new Date(date)
  if (period === 'daily') {
    return d.toISOString().split('T')[0]
  } else if (period === 'weekly') {
    // Get Monday of the week
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    return monday.toISOString().split('T')[0]
  } else {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
}

function aggregateByPeriod(calls: CallRow[], period: string) {
  const groups = new Map<string, { scores: number[]; energy: number[]; fillerWords: number[] }>()

  for (const call of calls) {
    const key = getPeriodKey(call.recordedAt, period)
    if (!groups.has(key)) {
      groups.set(key, { scores: [], energy: [], fillerWords: [] })
    }
    const g = groups.get(key)!
    if (call.overallScore != null) g.scores.push(call.overallScore)
    if (call.energyScore != null) g.energy.push(call.energyScore)
    if (call.fillerWordCount != null) g.fillerWords.push(call.fillerWordCount)
  }

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

  return Array.from(groups.entries())
    .map(([period, data]) => ({
      period,
      avgScore: Math.round(avg(data.scores) * 10) / 10,
      avgEnergy: Math.round(avg(data.energy) * 10) / 10,
      avgFillerWords: Math.round(avg(data.fillerWords) * 10) / 10,
      callCount: data.scores.length,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

function aggregateCallVolume(calls: CallRow[], period: string) {
  const groups = new Map<string, number>()
  for (const call of calls) {
    const key = getPeriodKey(call.recordedAt, period)
    groups.set(key, (groups.get(key) || 0) + 1)
  }
  return Array.from(groups.entries())
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period))
}
