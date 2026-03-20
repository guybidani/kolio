'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScoreBadge } from './score-badge'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RepData {
  id: string
  name: string
  avatarUrl?: string | null
  totalCalls: number
  avgScore: number
  trend: number
}

interface RepLeaderboardProps {
  reps: RepData[]
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
}

function TrendIcon({ trend }: { trend: number }) {
  if (trend > 0.3) return <TrendingUp className="h-3 w-3 text-emerald-400" />
  if (trend < -0.3) return <TrendingDown className="h-3 w-3 text-red-400" />
  return <Minus className="h-3 w-3 text-muted-foreground" />
}

export function RepLeaderboard({ reps }: RepLeaderboardProps) {
  const sorted = [...reps].sort((a, b) => b.avgScore - a.avgScore)

  return (
    <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
      <div className="p-5 pb-3">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          לידרבורד נציגים
        </h3>
      </div>
      <div className="px-5 pb-5">
        <div className="space-y-2">
          {sorted.map((rep, i) => (
            <div
              key={rep.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <span
                className={`text-sm font-bold w-6 text-center ${
                  i === 0
                    ? 'text-amber-400'
                    : i === 1
                    ? 'text-muted-foreground'
                    : i === 2
                    ? 'text-amber-600'
                    : 'text-muted-foreground'
                }`}
              >
                {i + 1}
              </span>

              <Avatar className="h-8 w-8">
                <AvatarImage src={rep.avatarUrl || undefined} />
                <AvatarFallback className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
                  {getInitials(rep.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{rep.name}</p>
                <p className="text-xs text-muted-foreground">
                  {rep.totalCalls} שיחות
                </p>
              </div>

              <div className="flex items-center gap-2">
                <TrendIcon trend={rep.trend} />
                <ScoreBadge score={rep.avgScore} size="sm" />
              </div>
            </div>
          ))}

          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              אין נתונים עדיין
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
