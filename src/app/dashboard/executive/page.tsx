'use client'

import { useEffect, useState } from 'react'
import { Phone, Target, Users, DollarSign } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/executive/kpi-card'
import { ScoreTrendChart } from '@/components/dashboard/executive/score-trend-chart'
import { CallVolumeChart } from '@/components/dashboard/executive/call-volume-chart'
import { RepRankingsTable } from '@/components/dashboard/executive/rep-rankings-table'
import { InsightsCard } from '@/components/dashboard/executive/insights-card'
import { ActionItemsCard } from '@/components/dashboard/executive/action-items-card'
import { RadarComparison } from '@/components/dashboard/executive/radar-comparison'

interface ExecutiveData {
  kpis: {
    totalCallsThisMonth: number
    totalCallsLastMonth: number
    callsChange: number
    avgTeamScore: number
    avgTeamScoreLastMonth: number
    scoreChange: number
    activeReps: number
    totalReps: number
    estimatedRevenueImpact: number
    avgDealSize: number
    improvementPercent: number
  }
  weeklyData: Array<{ week: string; score: number; calls: number }>
  reps: Array<{
    id: string
    name: string
    callsThisMonth: number
    avgScore: number
    trend: 'up' | 'down' | 'stable'
    trendValue: number
    topStrength: string
    biggestGap: string
  }>
  insights: string[]
  actionItems: Array<{ type: 'coach' | 'review' | 'update'; rep: string | null; action: string }>
  radarComparison: {
    categories: string[]
    thisMonth: number[]
    lastMonth: number[]
  }
}

export default function ExecutiveDashboardPage() {
  const [data, setData] = useState<ExecutiveData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/executive')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <ExecutiveSkeleton />
  }

  const { kpis, weeklyData, reps, insights, actionItems, radarComparison } = data

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">דשבורד מנהל</h1>
        <p className="text-muted-foreground text-sm mt-1">סקירה עסקית כללית</p>
      </div>

      {/* Row 1 - Hero KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="שיחות החודש"
          value={kpis.totalCallsThisMonth.toLocaleString()}
          subtitle={`${kpis.totalCallsLastMonth} בחודש שעבר`}
          change={kpis.callsChange}
          changeLabel="לעומת חודש שעבר"
          icon={Phone}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
        />
        <KpiCard
          title="ציון ממוצע צוות"
          value={kpis.avgTeamScore.toFixed(1)}
          subtitle={`${kpis.avgTeamScoreLastMonth.toFixed(1)} בחודש שעבר`}
          change={kpis.scoreChange}
          changeLabel="נקודות מחודש שעבר"
          icon={Target}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
        <KpiCard
          title="נציגים פעילים"
          value={`${kpis.activeReps}/${kpis.totalReps}`}
          subtitle="ביצעו שיחות השבוע"
          icon={Users}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <KpiCard
          title="השפעת הכנסה משוערת"
          value={`${(kpis.estimatedRevenueImpact / 1000).toFixed(0)}K`}
          subtitle={`עסקה ממוצעת: ${kpis.avgDealSize.toLocaleString()} | שיפור: ${kpis.improvementPercent}%`}
          icon={DollarSign}
          iconColor="text-teal-400"
          iconBg="bg-teal-500/10"
        />
      </div>

      {/* Row 2 - Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ScoreTrendChart data={weeklyData} targetScore={75} />
        <CallVolumeChart data={weeklyData} />
      </div>

      {/* Row 3 - Rep Rankings */}
      <RepRankingsTable reps={reps} />

      {/* Row 4 - Insights + Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <InsightsCard insights={insights} />
        <ActionItemsCard items={actionItems} />
      </div>

      {/* Row 5 - Radar Comparison */}
      <RadarComparison
        categories={radarComparison.categories}
        thisMonth={radarComparison.thisMonth}
        lastMonth={radarComparison.lastMonth}
      />
    </div>
  )
}

function ExecutiveSkeleton() {
  return (
    <div className="space-y-8" dir="rtl">
      <div className="space-y-2">
        <div className="skeleton h-7 w-36 rounded" />
        <div className="skeleton h-4 w-48 rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-muted/50 border border-border p-6 space-y-4">
            <div className="flex justify-between">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-10 w-10 rounded-xl" />
            </div>
            <div className="skeleton h-8 w-20 rounded" />
            <div className="skeleton h-3 w-32 rounded" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-muted/50 border border-border p-6">
            <div className="skeleton h-5 w-32 rounded mb-6" />
            <div className="skeleton h-[280px] w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-muted/50 border border-border p-6">
        <div className="skeleton h-5 w-28 rounded mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3">
            <div className="skeleton h-4 w-8 rounded" />
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-4 w-12 rounded" />
            <div className="skeleton h-4 w-12 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton h-4 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
