'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RepRanking {
  id: string
  name: string
  callsThisMonth: number
  avgScore: number
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  topStrength: string
  biggestGap: string
}

interface RepRankingsTableProps {
  reps: RepRanking[]
}

function TrendBadge({ trend, value }: { trend: string; value: number }) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md',
        trend === 'up' && 'text-emerald-400 bg-emerald-500/10',
        trend === 'down' && 'text-red-400 bg-red-500/10',
        trend === 'stable' && 'text-muted-foreground bg-muted/50'
      )}
    >
      <Icon className="h-3 w-3" />
      {value > 0 ? '+' : ''}{value}
    </span>
  )
}

function getRowColor(score: number) {
  if (score >= 75) return 'border-r-emerald-500/50 bg-emerald-500/[0.03]'
  if (score >= 50) return 'border-r-amber-500/50 bg-amber-500/[0.03]'
  return 'border-r-red-500/50 bg-red-500/[0.03]'
}

export function RepRankingsTable({ reps }: RepRankingsTableProps) {
  const sorted = [...reps].sort((a, b) => b.avgScore - a.avgScore)

  return (
    <div className="rounded-2xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
      <div className="p-6 pb-4">
        <h3 className="text-base font-semibold text-foreground">דירוג נציגים</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">#</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">נציג</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">שיחות</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">ציון ממוצע</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">מגמה</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">חוזקה עיקרית</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">פער לשיפור</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((rep, i) => (
              <tr
                key={rep.id}
                className={cn(
                  'border-b border-border/50 border-r-2 hover:bg-muted/50 transition-colors',
                  getRowColor(rep.avgScore)
                )}
              >
                <td className="px-6 py-3">
                  <span className={cn(
                    'text-sm font-bold',
                    i === 0 ? 'text-amber-400' : 'text-muted-foreground'
                  )}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-foreground">{rep.name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground tabular-nums">{rep.callsThisMonth}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      rep.avgScore >= 75 ? 'text-emerald-400' :
                      rep.avgScore >= 50 ? 'text-amber-400' :
                      'text-red-400'
                    )}
                  >
                    {rep.avgScore}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <TrendBadge trend={rep.trend} value={rep.trendValue} />
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-emerald-400/80 bg-emerald-500/10 px-2 py-1 rounded">
                    {rep.topStrength}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-red-400/80 bg-red-500/10 px-2 py-1 rounded">
                    {rep.biggestGap}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/reps/${rep.id}`}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
