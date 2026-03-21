'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StatsOverview } from '@/components/dashboard/stats-overview'
import { RepLeaderboard } from '@/components/dashboard/rep-leaderboard'
import { CallCard } from '@/components/dashboard/call-card'
import { BadgesDisplay } from '@/components/dashboard/badges'
import { StreaksDisplay } from '@/components/dashboard/streaks'
import { Button } from '@/components/ui/button'
import { Phone, Upload, Users, Loader2 } from 'lucide-react'

interface CallData {
  id: string
  prospectName: string | null
  prospectBusiness: string | null
  rep?: { id: string; name: string } | null
  repName?: string | null
  overallScore: number | null
  status: string
  direction: string
  duration: number
  recordedAt: string
  summary: string | null
}

interface RepData {
  id: string
  name: string
  avatarUrl?: string | null
  totalCalls: number
  avgScore: number
  trend: number
}

interface BadgeData {
  type: string
  name: string
  description: string
  earnedAt: string
}

interface StreakData {
  type: string
  currentCount: number
  bestCount: number
  isAtRisk: boolean
}

export default function DashboardPage() {
  const [calls, setCalls] = useState<CallData[]>([])
  const [reps, setReps] = useState<RepData[]>([])
  const [badges, setBadges] = useState<BadgeData[]>([])
  const [streaks, setStreaks] = useState<StreakData[]>([])
  const [totalCalls, setTotalCalls] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const [callsRes, repsRes, badgesRes] = await Promise.all([
          fetch('/api/calls?limit=5'),
          fetch('/api/reps'),
          fetch('/api/badges'),
        ])

        if (callsRes.ok) {
          const callsData = await callsRes.json()
          setCalls(callsData.calls || [])
          setTotalCalls(callsData.pagination?.total || 0)
        }

        if (repsRes.ok) {
          const repsData = await repsRes.json()
          setReps(Array.isArray(repsData) ? repsData : [])
        }

        if (badgesRes.ok) {
          const badgesData = await badgesRes.json()
          setBadges(badgesData.badges || [])
        }

        // Streaks require a repId - skip for now on dashboard overview
        // They will show on individual rep pages
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('שגיאה בטעינת נתונים')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Compute stats from real data
  const avgScore = reps.length > 0
    ? Math.round((reps.reduce((sum, r) => sum + r.avgScore, 0) / reps.length) * 10) / 10
    : 0

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">סקירה כללית</h1>
        <p className="text-muted-foreground">ברוכים הבאים ל-Kolio</p>
      </div>

      <StatsOverview
        totalCalls={totalCalls}
        avgScore={avgScore}
        totalReps={reps.length}
        callsThisWeek={0}
        scoreChange={0}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-base font-semibold text-foreground">שיחות אחרונות</h3>
            </div>
            <div className="px-5 pb-5 space-y-3">
              {calls.length > 0 ? (
                calls.map((call) => (
                  <CallCard
                    key={call.id}
                    id={call.id}
                    prospectName={call.prospectName}
                    prospectBusiness={call.prospectBusiness}
                    repName={call.rep?.name || call.repName || null}
                    overallScore={call.overallScore}
                    status={call.status}
                    direction={call.direction}
                    duration={call.duration}
                    recordedAt={call.recordedAt}
                    summary={call.summary}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-muted/50 p-4 mb-4">
                    <Phone className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">עדיין אין שיחות</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                    העלו את השיחה הראשונה שלכם לניתוח AI
                  </p>
                  <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white">
                    <Link href="/dashboard/upload">
                      <Upload className="h-4 w-4 ml-2" />
                      העלה שיחה ראשונה
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {reps.length > 0 ? (
            <RepLeaderboard reps={reps} />
          ) : (
            <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
              <div className="p-5 pb-3">
                <h3 className="text-base font-semibold text-foreground">לידרבורד</h3>
              </div>
              <div className="flex flex-col items-center justify-center py-12 text-center px-5 pb-5">
                <div className="rounded-full bg-muted/50 p-4 mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">עדיין אין נציגים</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  הוסיפו נציגים כדי לעקוב אחר הביצועים שלהם
                </p>
                <Button asChild variant="outline" className="border-border text-muted-foreground hover:bg-muted/50">
                  <Link href="/dashboard/admin">הוסף נציג</Link>
                </Button>
              </div>
            </div>
          )}
          <StreaksDisplay streaks={streaks} />
        </div>
      </div>

      <BadgesDisplay earned={badges} />
    </div>
  )
}
