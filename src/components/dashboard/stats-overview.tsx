'use client'

import { Phone, TrendingUp, Users, Target } from 'lucide-react'

interface StatsOverviewProps {
  totalCalls: number
  avgScore: number
  totalReps: number
  callsThisWeek: number
  scoreChange: number
}

export function StatsOverview({
  totalCalls,
  avgScore,
  totalReps,
  callsThisWeek,
  scoreChange,
}: StatsOverviewProps) {
  const stats = [
    {
      title: 'סך שיחות',
      value: totalCalls.toLocaleString(),
      icon: Phone,
      description: `${callsThisWeek} השבוע`,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10',
    },
    {
      title: 'ציון ממוצע',
      value: avgScore.toFixed(1),
      icon: Target,
      description: `${scoreChange >= 0 ? '+' : ''}${scoreChange.toFixed(1)} מהשבוע שעבר`,
      trend: scoreChange >= 0 ? 'up' : 'down',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
    },
    {
      title: 'נציגים פעילים',
      value: totalReps.toString(),
      icon: Users,
      description: 'בצוות',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
    },
    {
      title: 'מגמה',
      value: scoreChange >= 0 ? 'עולה' : 'יורדת',
      icon: TrendingUp,
      description: 'בהשוואה לתקופה הקודמת',
      trend: scoreChange >= 0 ? 'up' : 'down',
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </span>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconBg}`}>
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{stat.value}</div>
          <p
            className={`text-xs mt-1 ${
              stat.trend === 'up'
                ? 'text-emerald-400'
                : stat.trend === 'down'
                ? 'text-red-400'
                : 'text-muted-foreground'
            }`}
          >
            {stat.description}
          </p>
        </div>
      ))}
    </div>
  )
}

/** Loading skeleton for StatsOverview */
export function StatsOverviewSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-muted/50 border border-border p-5 space-y-3">
          <div className="flex justify-between">
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton h-8 w-8 rounded-lg" />
          </div>
          <div className="skeleton h-7 w-16 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      ))}
    </div>
  )
}
