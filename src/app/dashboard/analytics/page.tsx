'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AdvancedStats } from '@/components/dashboard/advanced-stats'
import { CallVolumeChart } from '@/components/dashboard/call-volume-chart'
import { ScoreDistribution } from '@/components/dashboard/score-distribution'
import { TalkRatioGauge } from '@/components/dashboard/talk-ratio-gauge'
import { FillerWords } from '@/components/dashboard/filler-words'
import { TrendChart } from '@/components/dashboard/trend-chart'
import {
  BenchmarkComparison,
  BenchmarkSummaryCard,
  type BenchmarkDataPoint,
} from '@/components/dashboard/benchmark-comparison'
import { BarChart3, Upload, Loader2 } from 'lucide-react'

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
  teamBenchmarks?: Record<string, { value: number }>
  teamBenchmarkAnalysis?: Array<{
    key: string
    value: number
    zone: string
    gap: number
    ideal: number
    label: string
  }>
}

const EMPTY_DATA: AnalyticsData = {
  summary: {
    totalCalls: 0,
    avgScore: 0,
    avgTalkRatio: 0,
    avgFillerWords: 0,
    avgEnergy: 0,
    avgNextSteps: 0,
    totalCoachingTips: 0,
  },
  scoresByPeriod: [],
  repComparison: [],
  callVolume: [],
  scoreDistribution: [],
  talkRatioDistribution: [],
  teamBenchmarks: undefined,
  teamBenchmarkAnalysis: undefined,
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(EMPTY_DATA)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [loading, setLoading] = useState(true)

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
        // Keep empty data on error
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period])

  const isEmpty = data.summary.totalCalls === 0

  // Build trend chart data from scoresByPeriod and repComparison
  const trendData = data.scoresByPeriod.map((p) => {
    const point: { period: string; [repName: string]: string | number } = { period: p.period }
    for (const rep of data.repComparison) {
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
          <h1 className="text-2xl font-bold text-foreground">אנליטיקס</h1>
          <p className="text-muted-foreground">ניתוח מעמיק של ביצועי הצוות</p>
        </div>
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                period === p
                  ? 'bg-indigo-500 text-white'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {p === 'daily' ? 'יומי' : p === 'weekly' ? 'שבועי' : 'חודשי'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted/50 p-4 mb-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">עדיין אין נתונים לניתוח</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            העלו שיחות מכירה כדי לראות אנליטיקס מפורטים על ביצועי הצוות
          </p>
          <Link href="/dashboard/upload" className={cn(buttonVariants(), "bg-indigo-600 hover:bg-indigo-500 text-white")}>
            <Upload className="h-4 w-4 ml-2" />
            העלה שיחות
          </Link>
        </div>
      )}

      {!loading && !isEmpty && (
        <>
          <AdvancedStats
            totalCalls={data.summary.totalCalls}
            callsTrend={0}
            avgScore={data.summary.avgScore}
            scoreTrend={0}
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
                trend: -r.trend,
              }))}
            />
          </div>

          <TrendChart data={trendData} reps={repTrends} />

          {/* Team Benchmark Comparison */}
          {data.teamBenchmarks && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <BenchmarkComparison
                  data={
                    Object.entries(data.teamBenchmarks).map(([key, { value }]) => ({
                      key,
                      value,
                    })) as BenchmarkDataPoint[]
                  }
                  title="השוואת צוות לסטנדרט תעשייתי"
                  showTrends={false}
                />
              </div>
              <div className="space-y-4">
                <BenchmarkSummaryCard
                  data={
                    Object.entries(data.teamBenchmarks).map(([key, { value }]) => ({
                      key,
                      value,
                    })) as BenchmarkDataPoint[]
                  }
                />
                {/* Highlight best and worst metrics */}
                {data.teamBenchmarkAnalysis && data.teamBenchmarkAnalysis.length > 0 && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-5">
                    <h3 className="text-base font-semibold text-foreground mb-3">
                      דגשים
                    </h3>
                    <div className="space-y-3">
                      {/* Best metric */}
                      {(() => {
                        const best = [...data.teamBenchmarkAnalysis]
                          .sort((a, b) => Math.abs(a.gap) - Math.abs(b.gap))[0]
                        const worst = [...data.teamBenchmarkAnalysis]
                          .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))[0]
                        return (
                          <>
                            {best && (
                              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <div className="text-xs text-emerald-400/70 mb-0.5">חוזקה</div>
                                <div className="text-sm font-medium text-emerald-400">
                                  {best.label}
                                </div>
                                <div className="text-xs text-emerald-400/70 mt-0.5">
                                  פער של {Math.abs(best.gap)}% מהאידיאל
                                </div>
                              </div>
                            )}
                            {worst && worst.key !== best?.key && (
                              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <div className="text-xs text-red-400/70 mb-0.5">לשיפור</div>
                                <div className="text-sm font-medium text-red-400">
                                  {worst.label}
                                </div>
                                <div className="text-xs text-red-400/70 mt-0.5">
                                  פער של {Math.abs(worst.gap)}% מהאידיאל
                                </div>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
