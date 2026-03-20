'use client'

import { Flame, TrendingUp, AlertTriangle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreakData {
  type: string
  currentCount: number
  bestCount: number
  isAtRisk: boolean
}

interface StreaksDisplayProps {
  streaks: StreakData[]
  className?: string
}

const STREAK_CONFIG: Record<string, {
  label: string
  description: string
  icon: typeof Flame
  color: string
  bgColor: string
  nextBadge: number
  badgeName: string
}> = {
  DAILY_CALLS: {
    label: 'שיחות יומיות',
    description: 'ימים רצופים עם שיחה',
    icon: Flame,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/15',
    nextBadge: 7,
    badgeName: 'רצף שבועי',
  },
  HIGH_SCORE: {
    label: 'ציון גבוה ברצף',
    description: 'שיחות רצופות עם ציון 70+',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    nextBadge: 10,
    badgeName: 'מקצוען',
  },
  IMPROVEMENT: {
    label: 'שיפור מתמשך',
    description: 'שבועות רצופים של שיפור',
    icon: Zap,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/15',
    nextBadge: 4,
    badgeName: 'משתפר',
  },
}

export function StreaksDisplay({ streaks, className }: StreaksDisplayProps) {
  // Show all streak types, even if not started yet
  const allTypes = ['DAILY_CALLS', 'HIGH_SCORE', 'IMPROVEMENT'] as const
  const streakMap = new Map(streaks.map((s) => [s.type, s]))

  return (
    <div className={cn('rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden', className)}>
      <div className="p-5 pb-3">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-400" />
          רצפים
        </h3>
      </div>
      <div className="px-5 pb-5 space-y-3">
        {allTypes.map((type) => {
          const config = STREAK_CONFIG[type]
          const streak = streakMap.get(type)
          const count = streak?.currentCount ?? 0
          const best = streak?.bestCount ?? 0
          const isAtRisk = streak?.isAtRisk ?? false
          const Icon = config.icon

          // Calculate progress to next badge milestone
          const nextMilestone = count < 7 ? 7 : count < 30 ? 30 : 100
          const progress = Math.min((count / nextMilestone) * 100, 100)

          return (
            <div
              key={type}
              className={cn(
                'rounded-lg border p-3 transition-all',
                isAtRisk
                  ? 'border-orange-500/30 bg-orange-500/5'
                  : count > 0
                  ? 'border-white/10 bg-white/[0.03]'
                  : 'border-white/5 bg-white/[0.01]'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', config.bgColor)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{config.label}</p>
                    {isAtRisk && (
                      <span className="flex items-center gap-1 text-[10px] text-orange-400 bg-orange-500/10 rounded-full px-1.5 py-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        בסיכון
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/30">{config.description}</p>
                </div>

                <div className="text-left shrink-0">
                  <p className={cn('text-xl font-bold tabular-nums', count > 0 ? config.color : 'text-white/20')}>
                    {count}
                  </p>
                  {best > 0 && best > count && (
                    <p className="text-[10px] text-white/20">
                      שיא: {best}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {count > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-white/20">
                      {count}/{nextMilestone} לתג הבא
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', {
                        'bg-orange-400': type === 'DAILY_CALLS',
                        'bg-emerald-400': type === 'HIGH_SCORE',
                        'bg-indigo-400': type === 'IMPROVEMENT',
                      })}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
