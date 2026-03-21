'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CallPlayer } from '@/components/dashboard/call-player'
import { CoachingPanel } from '@/components/dashboard/coaching-panel'
import { ScoreBadge } from '@/components/dashboard/score-badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRight,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  User,
  Building2,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import type { CallAnalysis } from '@/types'

interface CallDetail {
  id: string
  prospectName: string | null
  prospectBusiness: string | null
  rep?: { id: string; name: string } | null
  overallScore: number | null
  status: string
  direction: string
  duration: number
  recordedAt: string
  summary: string | null
  audioUrl: string | null
  analysis: CallAnalysis | null
  utterances: Array<{ speaker: number; text: string; start: number; end: number }> | null
  callerNumber: string | null
  calledNumber: string | null
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')} דק׳`
}

export default function CallDetailPage() {
  const params = useParams()
  const callId = params.id as string
  const [call, setCall] = useState<CallDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCall() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/calls/${callId}`)
        if (!res.ok) {
          if (res.status === 404) throw new Error('שיחה לא נמצאה')
          throw new Error('שגיאה בטעינת השיחה')
        }
        const data = await res.json()
        setCall(data)
      } catch (err) {
        console.error('Error fetching call:', err)
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת השיחה')
      } finally {
        setLoading(false)
      }
    }
    if (callId) fetchCall()
  }, [callId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !call) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted/50 p-4 mb-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{error || 'שיחה לא נמצאה'}</h3>
        <Link href="/dashboard/calls" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
          חזרה לשיחות
        </Link>
      </div>
    )
  }

  const isProcessing = ['UPLOADED', 'TRANSCRIBING', 'TRANSCRIBED', 'ANALYZING'].includes(call.status)
  const isFailed = call.status === 'FAILED'
  const isComplete = call.status === 'COMPLETE'
  const DirectionIcon = call.direction === 'INBOUND' ? PhoneIncoming : PhoneOutgoing

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/calls">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {call.prospectName || 'שיחה ללא שם'}
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            {call.prospectBusiness && (
              <>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {call.prospectBusiness}
                </span>
                <Separator orientation="vertical" className="h-4" />
              </>
            )}
            {call.rep?.name && (
              <>
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {call.rep.name}
                </span>
                <Separator orientation="vertical" className="h-4" />
              </>
            )}
            <span className="flex items-center gap-1">
              <DirectionIcon className="h-3.5 w-3.5" />
              {call.direction === 'INBOUND' ? 'נכנסת' : call.direction === 'OUTBOUND' ? 'יוצאת' : 'לא ידוע'}
            </span>
            {call.duration > 0 && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(call.duration)}
                </span>
              </>
            )}
          </div>
        </div>
        {call.overallScore != null && (
          <ScoreBadge score={call.overallScore} size="lg" showLabel />
        )}
      </div>

      {/* Processing status */}
      {isProcessing && (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-amber-400 mb-1">
            {call.status === 'UPLOADED' && 'ממתינה לעיבוד'}
            {call.status === 'TRANSCRIBING' && 'מתמללת...'}
            {call.status === 'TRANSCRIBED' && 'ממתינה לניתוח'}
            {call.status === 'ANALYZING' && 'מנתחת...'}
          </h3>
          <p className="text-sm text-muted-foreground">
            השיחה בתהליך עיבוד. הדף יתעדכן כשהניתוח יושלם.
          </p>
        </div>
      )}

      {/* Failed status */}
      {isFailed && (
        <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-red-400 mb-1">הניתוח נכשל</h3>
          <p className="text-sm text-muted-foreground">
            אירעה שגיאה בעיבוד השיחה. נסו להעלות שוב.
          </p>
        </div>
      )}

      {/* Summary Card - only for complete calls */}
      {isComplete && call.analysis && (
        <>
          <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-base font-semibold text-foreground">סיכום שיחה</h3>
            </div>
            <div className="px-5 pb-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">צורך הליד</h4>
                  <p className="text-sm text-muted-foreground">
                    {call.analysis.summary.prospect_needs}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">מה הוצע</h4>
                  <p className="text-sm text-muted-foreground">
                    {call.analysis.summary.what_was_offered}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">מה סוכם</h4>
                  <p className="text-sm text-muted-foreground">
                    {call.analysis.summary.what_was_agreed}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">שיווק נוכחי</h4>
                  <p className="text-sm text-muted-foreground">
                    {call.analysis.summary.current_marketing}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main content: Player + Coaching */}
          <div className="grid gap-6 lg:grid-cols-2">
            <CallPlayer
              audioUrl={call.audioUrl || ''}
              utterances={call.utterances || []}
              keyMoments={[]}
            />
            <CoachingPanel analysis={call.analysis} />
          </div>
        </>
      )}

      {/* If complete but no analysis yet (edge case) */}
      {isComplete && !call.analysis && call.summary && (
        <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
          <div className="p-5 pb-3">
            <h3 className="text-base font-semibold text-foreground">סיכום</h3>
          </div>
          <div className="px-5 pb-5">
            <p className="text-sm text-muted-foreground">{call.summary}</p>
          </div>
        </div>
      )}
    </div>
  )
}
