'use client'

import { Award, Star, Flame, Target, Search, Handshake, TrendingUp, Phone, Trophy, Zap, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EarnedBadge {
  type: string
  name: string
  description: string
  earnedAt: string
}

interface BadgesDisplayProps {
  earned: EarnedBadge[]
  className?: string
}

const BADGE_CONFIG: Record<string, {
  icon: typeof Award
  color: string
  bgColor: string
  borderColor: string
}> = {
  FIRST_CALL: {
    icon: Phone,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/30',
  },
  PERFECT_SCORE: {
    icon: Star,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
  },
  STREAK_7: {
    icon: Flame,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/30',
  },
  STREAK_30: {
    icon: Zap,
    color: 'text-red-400',
    bgColor: 'bg-red-500/15',
    borderColor: 'border-red-500/30',
  },
  OBJECTION_MASTER: {
    icon: Target,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/30',
  },
  DISCOVERY_PRO: {
    icon: Search,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30',
  },
  CLOSER: {
    icon: Handshake,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30',
  },
  MOST_IMPROVED: {
    icon: TrendingUp,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/30',
  },
  REP_OF_THE_WEEK: {
    icon: Trophy,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
  },
  HUNDRED_CALLS: {
    icon: Award,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/15',
    borderColor: 'border-pink-500/30',
  },
}

// All possible badges with Hebrew names for unearned display
const ALL_BADGES: Array<{ type: string; name: string; description: string }> = [
  { type: 'FIRST_CALL', name: 'שיחה ראשונה', description: 'העלאת שיחה ראשונה' },
  { type: 'PERFECT_SCORE', name: 'ציון מושלם', description: 'ציון 90+ בשיחה' },
  { type: 'STREAK_7', name: 'רצף שבועי', description: '7 ימים רצופים של שיחות' },
  { type: 'STREAK_30', name: 'רצף חודשי', description: '30 ימים רצופים' },
  { type: 'OBJECTION_MASTER', name: 'מאסטר התנגדויות', description: '10+ התנגדויות בהצלחה' },
  { type: 'DISCOVERY_PRO', name: 'מומחה גילוי צרכים', description: 'ציון 90+ בגילוי 3 פעמים' },
  { type: 'CLOSER', name: 'סוגר עסקאות', description: 'ציון 90+ בסגירה 3 פעמים' },
  { type: 'MOST_IMPROVED', name: 'השיפור הגדול', description: 'שיפור הגדול ביותר השבוע' },
  { type: 'REP_OF_THE_WEEK', name: 'נציג השבוע', description: 'ביצועים מובילים השבוע' },
  { type: 'HUNDRED_CALLS', name: '100 שיחות', description: '100 שיחות נותחו' },
]

export function BadgesDisplay({ earned, className }: BadgesDisplayProps) {
  const earnedTypes = new Set(earned.map((b) => b.type))

  return (
    <div className={cn('rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden', className)}>
      <div className="p-5 pb-3">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-400" />
          תגים
          <span className="text-xs text-white/50 font-normal">
            {earned.length}/{ALL_BADGES.length}
          </span>
        </h3>
      </div>
      <div className="px-5 pb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ALL_BADGES.map((badge) => {
            const isEarned = earnedTypes.has(badge.type)
            const config = BADGE_CONFIG[badge.type] || BADGE_CONFIG.FIRST_CALL
            const earnedBadge = earned.find((b) => b.type === badge.type)
            const Icon = isEarned ? config.icon : Lock

            return (
              <div
                key={badge.type}
                className={cn(
                  'group relative flex flex-col items-center gap-2 rounded-lg p-3 border transition-all duration-200',
                  isEarned
                    ? `${config.bgColor} ${config.borderColor} hover:scale-105`
                    : 'bg-white/[0.02] border-white/5 opacity-40'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    isEarned ? config.bgColor : 'bg-white/5'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      isEarned ? config.color : 'text-white/40'
                    )}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      'text-xs font-medium leading-tight',
                      isEarned ? 'text-white' : 'text-white/50'
                    )}
                  >
                    {badge.name}
                  </p>
                  {isEarned && earnedBadge && (
                    <p className="text-[10px] text-white/50 mt-0.5">
                      {new Date(earnedBadge.earnedAt).toLocaleDateString('he-IL')}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
