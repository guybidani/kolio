'use client'

import { Phone, Target, Mic, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react'

interface AdvancedStatsProps {
  totalCalls: number
  callsTrend: number
  avgScore: number
  scoreTrend: number
  avgTalkRatio: number
  totalCoachingTips: number
  callsBelowThreshold: number
  repImprovementRate: number
}

export function AdvancedStats({
  totalCalls,
  callsTrend,
  avgScore,
  scoreTrend,
  avgTalkRatio,
  totalCoachingTips,
  callsBelowThreshold,
  repImprovementRate,
}: AdvancedStatsProps) {
  const talkRatioInZone = avgTalkRatio >= 40 && avgTalkRatio <= 60

  const stats = [
    {
      title: 'שיחות בתקופה',
      value: totalCalls.toLocaleString(),
      icon: Phone,
      description: `${callsTrend >= 0 ? '+' : ''}${callsTrend}% מהתקופה הקודמת`,
      trend: callsTrend >= 0 ? 'up' : 'down',
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10',
    },
    {
      title: 'ציון ממוצע',
      value: avgScore.toFixed(1),
      icon: Target,
      description: `${scoreTrend >= 0 ? '+' : ''}${scoreTrend.toFixed(1)} מהתקופה הקודמת`,
      trend: scoreTrend >= 0 ? 'up' : 'down',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
    },
    {
      title: 'יחס דיבור',
      value: `${avgTalkRatio.toFixed(0)}%`,
      icon: Mic,
      description: talkRatioInZone ? 'באזור האידיאלי (40-60%)' : 'מחוץ לאזור האידיאלי',
      trend: talkRatioInZone ? 'up' : 'down',
      iconColor: talkRatioInZone ? 'text-emerald-400' : 'text-red-400',
      iconBg: talkRatioInZone ? 'bg-emerald-500/10' : 'bg-red-500/10',
    },
    {
      title: 'טיפים שנוצרו',
      value: totalCoachingTips.toLocaleString(),
      icon: Sparkles,
      description: 'טיפים לשיפור',
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
    },
    {
      title: 'דורשות תשומת לב',
      value: callsBelowThreshold.toString(),
      icon: AlertTriangle,
      description: 'שיחות מתחת ל-5',
      trend: callsBelowThreshold > 0 ? 'down' : 'up',
      iconColor: callsBelowThreshold > 0 ? 'text-red-400' : 'text-emerald-400',
      iconBg: callsBelowThreshold > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10',
    },
    {
      title: 'שיעור שיפור',
      value: `${repImprovementRate.toFixed(0)}%`,
      icon: TrendingUp,
      description: 'נציגים שמשתפרים',
      trend: repImprovementRate >= 50 ? 'up' : 'down',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
