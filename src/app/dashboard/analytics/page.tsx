'use client'

import { useState, useEffect } from 'react'
import { AdvancedStats } from '@/components/dashboard/advanced-stats'
import { CallVolumeChart } from '@/components/dashboard/call-volume-chart'
import { ScoreDistribution } from '@/components/dashboard/score-distribution'
import { TalkRatioGauge } from '@/components/dashboard/talk-ratio-gauge'
import { FillerWords } from '@/components/dashboard/filler-words'
import { TrendChart } from '@/components/dashboard/trend-chart'

interface AnalyticsData {
  summary: {
    totalCalls: number
    avgScore: number
    avgTalkRatio: number
    avgFillerWords: number
    avgEnergy: number
    avgNextSteps: number
    totalCoachingTips: number
  }
  scoresByPeriod: Array<{
    period: string
    avgScore: number
    avgEnergy: number
    avgFillerWords: number
    callCount: number
  }>
  repComparison: Array<{
    id: string
    name: string
    avgScore: number
    avgFillerWords: number
    avgTalkRatio: number
    avgEnergy: number
    totalCalls: number
    trend: number
  }>
  callVolume: Array<{ period: string; count: number }>
  scoreDistribution: Array<{ range: string; count: number; color: string }>
  talkRatioDistribution: Array<{ rep: number; customer: number }>
}

// Mock data for development until API is connected
const MOCK_DATA: AnalyticsData = {
  summary: {
    totalCalls: 164,
    avgScore: 7.2,
    avgTalkRatio: 55,
    avgFillerWords: 6.3,
    avgEnergy: 7.1,
    avgNextSteps: 6.8,
    totalCoachingTips: 492,
  },
  scoresByPeriod: [
    { period: '2026-01', avgScore: 6.5, avgEnergy: 6.2, avgFillerWords: 8.1, callCount: 35 },
    { period: '2026-02', avgScore: 6.9, avgEnergy: 6.8, avgFillerWords: 7.2, callCount: 48 },
    { period: '2026-03', avgScore: 7.2, avgEnergy: 7.1, avgFillerWords: 6.3, callCount: 42 },
  ],
  repComparison: [
    { id: '1', name: 'יוסי אברהם', avgScore: 8.1, avgFillerWords: 3.2, avgTalkRatio: 52, avgEnergy: 8.0, totalCalls: 52, trend: 1.2 },
    { id: '2', name: 'גיא בידני', avgScore: 7.8, avgFillerWords: 5.1, avgTalkRatio: 58, avgEnergy: 7.5, totalCalls: 45, trend: 0.5 },
    { id: '3', name: 'מיכל דוד', avgScore: 6.9, avgFillerWords: 7.8, avgTalkRatio: 65, avgEnergy: 6.5, totalCalls: 38, trend: -0.2 },
    { id: '4', name: 'נועה שמיר', avgScore: 6.2, avgFillerWords: 9.4, avgTalkRatio: 48, avgEnergy: 6.0, totalCalls: 29, trend: 0.8 },
  ],
  callVolume: [
    { period: '03/01', count: 8 },
    { period: '03/02', count: 5 },
    { period: '03/03', count: 12 },
    { period: '03/04', count: 7 },
    { period: '03/05', count: 9 },
    { period: '03/06', count: 3 },
    { period: '03/07', count: 1 },
    { period: '03/08', count: 11 },
    { period: '03/09', count: 6 },
    { period: '03/10', count: 14 },
    { period: '03/11', count: 8 },
    { period: '03/12', count: 10 },
    { period: '03/13', count: 4 },
    { period: '03/14', count: 2 },
  ],
  scoreDistribution: [
    { range: '0-2', count: 3, color: '#EF4444' },
    { range: '2-4', count: 12, color: '#F97316' },
    { range: '4-6', count: 38, color: '#EAB308' },
    { range: '6-8', count: 78, color: '#22C55E' },
    { range: '8-10', count: 33, color: '#059669' },
  ],
  talkRatioDistribution: [],
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(MOCK_DATA)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/analytics?period=${period}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch {
        // Use mock data on error
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period])

  // Build trend chart data from scoresByPeriod and repComparison
  const trendData = data.scoresByPeriod.map((p) => {
    const point: { period: string; [repName: string]: string | number } = { period: p.period }
    for (const rep of data.repComparison) {
      // In real data, this would come from per-rep period data
      // For now, offset from the period average
      point[rep.name] = Math.max(1, Math.min(10,
        p.avgScore + (rep.avgScore - data.summary.avgScore) + (Math.random() - 0.5) * 0.5
      ))
    }
    return point
  })

  const repTrends = data.repComparison.map((r) => ({
    id: r.id,
    name: r.name,
    improving: r.trend > 0,
  }))

  // Calculate stats
  const callsBelowThreshold = data.scoreDistribution
    .filter((b) => b.range === '0-2' || b.range === '2-4')
    .reduce((sum, b) => sum + b.count, 0)

  const improvingReps = data.repComparison.filter((r) => r.trend > 0).length
  const repImprovementRate = data.repComparison.length > 0
    ? (improvingReps / data.repComparison.length) * 100
    : 0

  // Avg talk ratio from talkRatioDistribution or rep data
  const avgTalkRatio = data.summary.avgTalkRatio || 50
  const avgCustomerRatio = 100 - avgTalkRatio

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">אנליטיקס</h1>
          <p className="text-white/40">ניתוח מעמיק של ביצועי הצוות</p>
        </div>
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                period === p
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {p === 'daily' ? 'יומי' : p === 'weekly' ? 'שבועי' : 'חודשי'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-white/50">טוען נתונים...</div>
      )}

      <AdvancedStats
        totalCalls={data.summary.totalCalls}
        callsTrend={12}
        avgScore={data.summary.avgScore}
        scoreTrend={0.4}
        avgTalkRatio={avgTalkRatio}
        totalCoachingTips={data.summary.totalCoachingTips}
        callsBelowThreshold={callsBelowThreshold}
        repImprovementRate={repImprovementRate}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <CallVolumeChart data={data.callVolume} target={10} />
        <ScoreDistribution data={data.scoreDistribution} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TalkRatioGauge
          repRatio={avgTalkRatio}
          customerRatio={avgCustomerRatio}
        />
        <FillerWords
          data={data.repComparison.map((r) => ({
            id: r.id,
            name: r.name,
            avgFillerWords: r.avgFillerWords,
            totalCalls: r.totalCalls,
            trend: -r.trend, // Invert: positive score trend likely means less fillers
          }))}
        />
      </div>

      <TrendChart data={trendData} reps={repTrends} />
    </div>
  )
}
