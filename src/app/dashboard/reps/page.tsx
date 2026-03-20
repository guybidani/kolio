'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScoreBadge } from '@/components/dashboard/score-badge'
import { Trophy, Phone, TrendingUp } from 'lucide-react'

const MOCK_REPS = [
  {
    id: 'rep-1',
    name: 'יוסי אברהם',
    avatarUrl: null,
    phone: '050-1234567',
    totalCalls: 52,
    completedCalls: 48,
    avgScore: 8.1,
    avgDiscovery: 8.5,
    avgClosing: 7.8,
    avgObjectionHandling: 8.0,
    avgRapport: 8.4,
    avgValue: 7.9,
    trend: 1.2,
    topStrength: 'דיסקברי מעולה',
    topWeakness: 'סגירה',
    callsThisWeek: 12,
  },
  {
    id: 'rep-2',
    name: 'גיא בידני',
    avatarUrl: null,
    phone: '050-2345678',
    totalCalls: 45,
    completedCalls: 42,
    avgScore: 7.8,
    avgDiscovery: 7.5,
    avgClosing: 8.2,
    avgObjectionHandling: 7.6,
    avgRapport: 8.0,
    avgValue: 7.5,
    trend: 0.5,
    topStrength: 'סגירה חזקה',
    topWeakness: 'העברת ערך',
    callsThisWeek: 9,
  },
  {
    id: 'rep-3',
    name: 'מיכל דוד',
    avatarUrl: null,
    phone: '050-3456789',
    totalCalls: 38,
    completedCalls: 35,
    avgScore: 6.9,
    avgDiscovery: 7.2,
    avgClosing: 6.5,
    avgObjectionHandling: 6.8,
    avgRapport: 7.5,
    avgValue: 6.4,
    trend: -0.2,
    topStrength: 'ראפור טבעי',
    topWeakness: 'סגירה',
    callsThisWeek: 8,
  },
  {
    id: 'rep-4',
    name: 'נועה שמיר',
    avatarUrl: null,
    phone: '050-4567890',
    totalCalls: 29,
    completedCalls: 25,
    avgScore: 6.2,
    avgDiscovery: 6.0,
    avgClosing: 5.8,
    avgObjectionHandling: 6.5,
    avgRapport: 7.0,
    avgValue: 5.9,
    trend: 0.8,
    topStrength: 'טיפול בהתנגדויות',
    topWeakness: 'דיסקברי',
    callsThisWeek: 5,
  },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
}

export default function RepsPage() {
  const sorted = [...MOCK_REPS].sort((a, b) => b.avgScore - a.avgScore)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">נציגים</h1>
        <p className="text-muted-foreground">ביצועי הצוות ולידרבורד</p>
      </div>

      {/* Top 3 podium */}
      <div className="grid gap-4 sm:grid-cols-3">
        {sorted.slice(0, 3).map((rep, i) => (
          <Link key={rep.id} href={`/dashboard/reps/${rep.id}`}>
            <div
              className={`rounded-xl backdrop-blur-xl border p-4 text-center transition-all cursor-pointer hover:-translate-y-0.5 ${
                i === 0
                  ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 shadow-[0_4px_14px_rgba(245,158,11,0.1)]'
                  : 'bg-muted/50 border-border hover:border-border'
              }`}
            >
              <div className="flex justify-center mb-3">
                {i === 0 && <Trophy className="h-6 w-6 text-amber-400" />}
              </div>
              <Avatar className="h-16 w-16 mx-auto mb-3">
                <AvatarImage src={rep.avatarUrl || undefined} />
                <AvatarFallback className="text-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
                  {getInitials(rep.name)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-lg text-foreground">{rep.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {rep.totalCalls} שיחות
              </p>
              <ScoreBadge score={rep.avgScore} size="lg" showLabel />
              <div className="flex items-center justify-center gap-1 mt-2 text-xs">
                <TrendingUp
                  className={`h-3 w-3 ${rep.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                />
                <span className={rep.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {rep.trend >= 0 ? '+' : ''}{rep.trend.toFixed(1)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Full table */}
      <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-base font-semibold text-foreground">כל הנציגים</h3>
        </div>
        <div className="px-5 pb-5">
          <div className="space-y-2">
            {sorted.map((rep, i) => (
              <Link key={rep.id} href={`/dashboard/reps/${rep.id}`}>
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <span className="text-sm font-bold w-6 text-center text-muted-foreground">
                    {i + 1}
                  </span>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
                      {getInitials(rep.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{rep.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {rep.totalCalls} שיחות
                      </span>
                      <span>
                        חוזקה: <Badge variant="outline" className="text-xs bg-muted/50 border-border text-muted-foreground">{rep.topStrength}</Badge>
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:grid grid-cols-5 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">דיסקברי</p>
                      <p className="text-sm font-medium text-foreground">{rep.avgDiscovery.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">סגירה</p>
                      <p className="text-sm font-medium text-foreground">{rep.avgClosing.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">התנגדויות</p>
                      <p className="text-sm font-medium text-foreground">{rep.avgObjectionHandling.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ראפור</p>
                      <p className="text-sm font-medium text-foreground">{rep.avgRapport.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ערך</p>
                      <p className="text-sm font-medium text-foreground">{rep.avgValue.toFixed(1)}</p>
                    </div>
                  </div>
                  <ScoreBadge score={rep.avgScore} size="md" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
