'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScoreBadge } from '@/components/dashboard/score-badge'
import { CallCard } from '@/components/dashboard/call-card'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRight,
  Phone,
  TrendingUp,
  Target,
  Award,
  AlertCircle,
  Loader2,
  Upload,
} from 'lucide-react'

interface RepDetail {
  id: string
  name: string
  phone: string | null
  extension: string | null
  avatarUrl: string | null
  totalCalls: number
  scoresOverTime: Array<{ score: number | null; date: string }>
  calls: Array<{
    id: string
    prospectName: string | null
    overallScore: number | null
    status: string
    direction: string
    duration: number
    recordedAt: string
    summary: string | null
  }>
  badges: Array<{ type: string; name: string; description: string; earnedAt: string }>
  streaks: Array<{ type: string; currentCount: number; bestCount: number; isAtRisk: boolean }>
}

export default function RepDetailPage() {
  const params = useParams()
  const repId = params.id as string
  const [rep, setRep] = useState<RepDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    async function loadOrgAndRep() {
      setLoading(true)
      setError(null)
      try {
        // First get orgId from auth
        const meRes = await fetch('/api/auth/me')
        if (!meRes.ok) throw new Error('לא מאומת')
        const meData = await meRes.json()
        const currentOrgId = meData.org?.id
        if (!currentOrgId) throw new Error('לא נמצא ארגון')
        setOrgId(currentOrgId)

        // Fetch rep detail
        const repRes = await fetch(`/api/orgs/${currentOrgId}/reps/${repId}`)
        if (!repRes.ok) {
          if (repRes.status === 404) throw new Error('נציג לא נמצא')
          throw new Error('שגיאה בטעינת נציג')
        }
        const repData = await repRes.json()
        setRep(repData)
      } catch (err) {
        console.error('Error fetching rep:', err)
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת נציג')
      } finally {
        setLoading(false)
      }
    }
    if (repId) loadOrgAndRep()
  }, [repId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !rep) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted/50 p-4 mb-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{error || 'נציג לא נמצא'}</h3>
        <Link href="/dashboard/reps" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
          חזרה לנציגים
        </Link>
      </div>
    )
  }

  // Calculate avg score and trend from scoresOverTime
  const scores = rep.scoresOverTime.map(s => s.score).filter((s): s is number => s != null)
  const avgScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0
  const recentScores = scores.slice(-10)
  const olderScores = scores.slice(-20, -10)
  const recentAvg = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0
  const olderAvg = olderScores.length > 0 ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length : 0
  const trend = olderScores.length > 0 ? Math.round((recentAvg - olderAvg) * 10) / 10 : 0

  const initials = rep.name.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reps">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Avatar className="h-12 w-12">
          <AvatarFallback className="text-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{rep.name}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {rep.extension && (
              <>
                <span>שלוחה {rep.extension}</span>
                <Separator orientation="vertical" className="h-4 bg-muted" />
              </>
            )}
            {rep.phone && (
              <>
                <span>{rep.phone}</span>
                <Separator orientation="vertical" className="h-4 bg-muted" />
              </>
            )}
            <span>{rep.totalCalls} שיחות</span>
          </div>
        </div>
        {avgScore > 0 && <ScoreBadge score={avgScore} size="lg" showLabel />}
      </div>

      {/* Score breakdown */}
      {scores.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-5 text-center">
            <h3 className="text-base font-semibold text-foreground flex items-center justify-center gap-2 mb-4">
              <Target className="h-4 w-4 text-indigo-400" />
              ציון כולל
            </h3>
            <div className="text-5xl font-bold text-foreground mb-2">{avgScore.toFixed(1)}</div>
            {trend !== 0 && (
              <div className="flex items-center justify-center gap-1 text-sm">
                <TrendingUp className={`h-4 w-4 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                <span className={trend >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {trend >= 0 ? '+' : ''}{trend.toFixed(1)} מהתקופה הקודמת
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-5 sm:col-span-2">
            <h3 className="text-base font-semibold text-foreground mb-4">היסטוריית ציונים</h3>
            <div className="flex items-end gap-1 h-24">
              {rep.scoresOverTime.slice(-20).map((s, i) => (
                <div
                  key={i}
                  className="flex-1 bg-indigo-500/30 rounded-t hover:bg-indigo-500/50 transition-colors"
                  style={{ height: `${((s.score || 0) / 10) * 100}%` }}
                  title={`${s.score?.toFixed(1) || '-'} - ${new Date(s.date).toLocaleDateString('he-IL')}`}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">אין עדיין ציונים - העלו שיחות כדי לראות ביצועים</p>
        </div>
      )}

      {/* Recent Calls */}
      <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Phone className="h-4 w-4 text-indigo-400" />
            שיחות אחרונות
          </h3>
        </div>
        <div className="px-5 pb-5 space-y-3">
          {rep.calls.length > 0 ? (
            rep.calls.map((call) => (
              <CallCard
                key={call.id}
                id={call.id}
                prospectName={call.prospectName}
                prospectBusiness={null}
                repName={rep.name}
                overallScore={call.overallScore}
                status={call.status}
                direction={call.direction}
                duration={call.duration}
                recordedAt={call.recordedAt}
                summary={call.summary}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted/50 p-4 mb-4">
                <Phone className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">עדיין אין שיחות</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                העלו שיחה של הנציג כדי לקבל ניתוח וקואצ׳ינג
              </p>
              <Link href="/dashboard/upload" className={cn(buttonVariants(), "bg-indigo-600 hover:bg-indigo-500 text-white")}>
                <Upload className="h-4 w-4 ml-2" />
                העלה שיחה
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
