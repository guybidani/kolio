'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ScoreBadge } from '@/components/dashboard/score-badge'
import { Trophy, Phone, TrendingUp, Users, Loader2, UserPlus } from 'lucide-react'

interface RepData {
  id: string
  name: string
  avatarUrl?: string | null
  phone?: string | null
  totalCalls: number
  avgScore: number
  trend: number
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
}

export default function RepsPage() {
  const [reps, setReps] = useState<RepData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReps() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/reps')
        if (!res.ok) throw new Error('Failed to fetch reps')
        const data = await res.json()
        setReps(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error fetching reps:', err)
        setError('שגיאה בטעינת נציגים')
      } finally {
        setLoading(false)
      }
    }
    fetchReps()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-red-400 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          נסה שוב
        </Button>
      </div>
    )
  }

  if (reps.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">נציגים</h1>
          <p className="text-muted-foreground">ביצועי הצוות ולידרבורד</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted/50 p-4 mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">עדיין אין נציגים</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            הוסיפו את נציגי המכירות שלכם כדי לעקוב אחר ביצועים ולקבל תובנות
          </p>
          <Link href="/dashboard/admin" className={cn(buttonVariants(), "bg-indigo-600 hover:bg-indigo-500 text-white")}>
            <UserPlus className="h-4 w-4 ml-2" />
            הוסף נציג ראשון
          </Link>
        </div>
      </div>
    )
  }

  const sorted = [...reps].sort((a, b) => b.avgScore - a.avgScore)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">נציגים</h1>
        <p className="text-muted-foreground">ביצועי הצוות ולידרבורד</p>
      </div>

      {/* Top 3 podium */}
      {sorted.length >= 1 && (
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
      )}

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
