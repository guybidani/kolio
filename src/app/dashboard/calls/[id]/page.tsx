'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { CallPlayer } from '@/components/dashboard/call-player'
import { CoachingPanel } from '@/components/dashboard/coaching-panel'
import { CallComments } from '@/components/dashboard/call-comments'
import { PlaybookCoverage } from '@/components/dashboard/playbook-coverage'
import { AskCall } from '@/components/dashboard/ask-call'
import { ScoreBadge } from '@/components/dashboard/score-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  FileText,
  Mic,
  GraduationCap,
  BarChart3,
  TrendingUp,
  Zap,
  MessageSquareQuote,
  DollarSign,
  Users,
  HelpCircle,
  Target,
  CheckCircle2,
  XCircle,
  ChevronLeft,
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

// Get user role from the /api/auth/me endpoint
function useCurrentUserRole() {
  const [role, setRole] = useState<string>('VIEWER')
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.role) setRole(data.role)
      })
      .catch(() => {})
  }, [])
  return role
}

const SENTIMENT_LABELS: Record<string, { label: string; color: string }> = {
  positive: { label: 'חיובי', color: 'text-emerald-400' },
  negative: { label: 'שלילי', color: 'text-red-400' },
  neutral: { label: 'ניטרלי', color: 'text-muted-foreground' },
}

export default function CallDetailPage() {
  const params = useParams()
  const callId = params.id as string
  const [call, setCall] = useState<CallDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userRole = useCurrentUserRole()

  const handleSeekToTime = useCallback((time: number) => {
    // Find the audio element and seek to time
    const audio = document.querySelector('audio') as HTMLAudioElement | null
    if (audio) {
      audio.currentTime = time
      audio.play().catch(() => {})
    }
  }, [])

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
  const isTooShort = call.status === 'TOO_SHORT'
  const isComplete = call.status === 'COMPLETE'
  const DirectionIcon = call.direction === 'INBOUND' ? PhoneIncoming : PhoneOutgoing
  const analysis = call.analysis
  const metrics = analysis?.advanced_metrics

  return (
    <div className="space-y-6">
      {/* Header - always visible above tabs */}
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

      {/* Too short status */}
      {isTooShort && (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-6 text-center">
          <Clock className="h-8 w-8 text-amber-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-amber-400 mb-1">שיחה קצרה מדי</h3>
          <p className="text-sm text-muted-foreground">
            השיחה קצרה מ-2 דקות ולכן לא נותחה. ההקלטה נשמרה במערכת.
          </p>
        </div>
      )}

      {/* Tabbed content - only for complete calls with analysis */}
      {isComplete && analysis && (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-muted/50 border border-border h-10">
            <TabsTrigger value="summary" className="text-sm">
              <FileText className="h-4 w-4 ml-1" />
              סיכום
            </TabsTrigger>
            <TabsTrigger value="transcript" className="text-sm">
              <Mic className="h-4 w-4 ml-1" />
              תמלול
            </TabsTrigger>
            <TabsTrigger value="coaching" className="text-sm">
              <GraduationCap className="h-4 w-4 ml-1" />
              אימון
            </TabsTrigger>
            <TabsTrigger value="deep" className="text-sm">
              <BarChart3 className="h-4 w-4 ml-1" />
              ניתוח מעמיק
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Summary */}
          <TabsContent value="summary" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main summary content */}
              <div className="lg:col-span-2 space-y-4">
                {/* AI Brief */}
                <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
                  <div className="p-5 pb-3">
                    <h3 className="text-base font-semibold text-foreground">סיכום שיחה</h3>
                  </div>
                  <div className="px-5 pb-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1.5">צורך הליד</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {analysis.summary.prospect_needs}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1.5">מה הוצע</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {analysis.summary.what_was_offered}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1.5">מה סוכם</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {analysis.summary.what_was_agreed}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1.5">שיווק נוכחי</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {analysis.summary.current_marketing}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                {analysis.next_call_prep && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
                    <div className="p-5 pb-3">
                      <h3 className="text-base font-semibold text-foreground">צעדים הבאים</h3>
                    </div>
                    <div className="px-5 pb-5 space-y-3">
                      {analysis.next_call_prep.recommended_callback && (
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-sm font-medium text-foreground">מתי להתקשר: </span>
                            <span className="text-sm text-muted-foreground">{analysis.next_call_prep.recommended_callback}</span>
                          </div>
                        </div>
                      )}
                      {analysis.next_call_prep.key_points_to_address?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-1.5">נקודות לכיסוי</h4>
                          <ul className="space-y-1">
                            {analysis.next_call_prep.key_points_to_address.map((p, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-indigo-400 inline-block" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysis.next_call_prep.closing_strategy && (
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-sm font-medium text-foreground">אסטרטגיית סגירה: </span>
                            <span className="text-sm text-muted-foreground">{analysis.next_call_prep.closing_strategy}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Needs / Pain Points */}
                {analysis.pain_points && analysis.pain_points.length > 0 && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
                    <div className="p-5 pb-3">
                      <h3 className="text-base font-semibold text-foreground">צרכי לקוח שזוהו</h3>
                    </div>
                    <div className="px-5 pb-5 space-y-2">
                      {analysis.pain_points.map((pain, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className={`mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full inline-block ${pain.explicit ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <div className="flex-1">
                            <span className="text-foreground">{pain.pain}</span>
                            {!pain.was_deepened && pain.deepening_suggestion && (
                              <p className="text-xs text-muted-foreground mt-0.5">{pain.deepening_suggestion}</p>
                            )}
                          </div>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${pain.explicit ? 'border-emerald-500/20 text-emerald-400' : 'border-amber-500/20 text-amber-400'}`}>
                            {pain.explicit ? 'מפורש' : 'משתמע'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick stats sidebar */}
              <div className="space-y-4">
                {/* Score card */}
                <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-5">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">ציון כולל</h4>
                  <div className="text-center">
                    <ScoreBadge score={analysis.scores.overall} size="lg" showLabel />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="text-center">
                      <ScoreBadge score={analysis.scores.discovery} size="sm" />
                      <p className="text-xs text-muted-foreground mt-1">דיסקברי</p>
                    </div>
                    <div className="text-center">
                      <ScoreBadge score={analysis.scores.closing} size="sm" />
                      <p className="text-xs text-muted-foreground mt-1">סגירה</p>
                    </div>
                    <div className="text-center">
                      <ScoreBadge score={analysis.scores.objection_handling} size="sm" />
                      <p className="text-xs text-muted-foreground mt-1">התנגדויות</p>
                    </div>
                    <div className="text-center">
                      <ScoreBadge score={analysis.scores.rapport} size="sm" />
                      <p className="text-xs text-muted-foreground mt-1">ראפור</p>
                    </div>
                  </div>
                </div>

                {/* Quick metrics */}
                <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-5 space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">נתונים מהירים</h4>

                  {call.duration > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        משך
                      </span>
                      <span className="text-foreground font-medium">{formatDuration(call.duration)}</span>
                    </div>
                  )}

                  {metrics && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Mic className="h-3.5 w-3.5" />
                          יחס דיבור
                        </span>
                        <span className="text-foreground font-medium">
                          {metrics.talk_ratio_rep}% / {metrics.talk_ratio_customer}%
                        </span>
                      </div>

                      {metrics.energy_score != null && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5" />
                            אנרגיה
                          </span>
                          <span className="text-foreground font-medium">{metrics.energy_score.toFixed(1)}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Deal probability */}
                  {analysis._internal?.conversion_probability != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5" />
                        סיכוי סגירה
                      </span>
                      <span className={`font-medium ${
                        analysis._internal.conversion_probability >= 60 ? 'text-emerald-400' :
                        analysis._internal.conversion_probability >= 30 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {analysis._internal.conversion_probability}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Buying signals summary */}
                {analysis.buying_signals && analysis.buying_signals.length > 0 && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-5">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">סיגנלים לקנייה</h4>
                    <div className="space-y-1.5">
                      {analysis.buying_signals.slice(0, 3).map((sig, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs">
                          <span className={`mt-1 shrink-0 w-1.5 h-1.5 rounded-full inline-block ${sig.was_leveraged ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <span className="text-muted-foreground">{sig.signal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Transcript */}
          <TabsContent value="transcript" className="mt-6">
            <CallPlayer
              audioUrl={call.audioUrl || ''}
              utterances={call.utterances || []}
              keyMoments={[]}
            />
          </TabsContent>

          {/* Tab 3: Coaching */}
          <TabsContent value="coaching" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <CoachingPanel analysis={analysis} />
              <CallComments
                callId={call.id}
                userRole={userRole}
                onSeekToTime={handleSeekToTime}
              />
            </div>
            <div className="mt-6">
              <AskCall callId={call.id} />
            </div>
          </TabsContent>

          {/* Tab 4: Deep Analysis */}
          <TabsContent value="deep" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left column: Metrics + Benchmarks + Pricing + Competitors */}
              <div className="space-y-4">
                {/* Benchmark Comparison Bars */}
                {analysis.benchmark_comparison && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
                    <div className="p-5 pb-3">
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <Target className="h-4 w-4 text-indigo-400" />
                        השוואה לנתוני Gong
                      </h3>
                    </div>
                    <div className="px-5 pb-5 space-y-4">
                      {/* Talk Ratio */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-muted-foreground">יחס דיבור נציג</span>
                          <span className="text-xs text-muted-foreground">
                            {analysis.benchmark_comparison.talk_ratio.actual}% / {analysis.benchmark_comparison.talk_ratio.benchmark}% מומלץ
                          </span>
                        </div>
                        <div className="relative h-3 bg-background/50 rounded-full border border-border overflow-hidden">
                          <div
                            className={`absolute inset-y-0 right-0 rounded-full transition-all ${
                              Math.abs(analysis.benchmark_comparison.talk_ratio.actual - analysis.benchmark_comparison.talk_ratio.benchmark) <= 10
                                ? 'bg-emerald-500/70' : 'bg-amber-500/70'
                            }`}
                            style={{ width: `${Math.min(100, analysis.benchmark_comparison.talk_ratio.actual)}%` }}
                          />
                          <div
                            className="absolute inset-y-0 w-0.5 bg-indigo-400"
                            style={{ right: `${analysis.benchmark_comparison.talk_ratio.benchmark}%` }}
                            title={`בנצ'מרק: ${analysis.benchmark_comparison.talk_ratio.benchmark}%`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{analysis.benchmark_comparison.talk_ratio.verdict}</p>
                      </div>

                      {/* Questions Asked */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-muted-foreground">שאלות שנשאלו</span>
                          <span className="text-xs text-muted-foreground">
                            {analysis.benchmark_comparison.questions_asked.actual} / {analysis.benchmark_comparison.questions_asked.benchmark} מומלץ
                          </span>
                        </div>
                        <div className="relative h-3 bg-background/50 rounded-full border border-border overflow-hidden">
                          <div
                            className={`absolute inset-y-0 right-0 rounded-full transition-all ${
                              analysis.benchmark_comparison.questions_asked.actual >= analysis.benchmark_comparison.questions_asked.benchmark * 0.7
                                ? 'bg-emerald-500/70' : 'bg-amber-500/70'
                            }`}
                            style={{ width: `${Math.min(100, (analysis.benchmark_comparison.questions_asked.actual / (analysis.benchmark_comparison.questions_asked.benchmark * 1.5)) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{analysis.benchmark_comparison.questions_asked.verdict}</p>
                      </div>

                      {/* Longest Monologue */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-muted-foreground">מונולוג ארוך ביותר</span>
                          <span className="text-xs text-muted-foreground">
                            {analysis.benchmark_comparison.longest_monologue.actual} שנ׳ / {analysis.benchmark_comparison.longest_monologue.benchmark} שנ׳ מומלץ
                          </span>
                        </div>
                        <div className="relative h-3 bg-background/50 rounded-full border border-border overflow-hidden">
                          <div
                            className={`absolute inset-y-0 right-0 rounded-full transition-all ${
                              analysis.benchmark_comparison.longest_monologue.actual <= analysis.benchmark_comparison.longest_monologue.benchmark
                                ? 'bg-emerald-500/70' : 'bg-red-500/70'
                            }`}
                            style={{ width: `${Math.min(100, (analysis.benchmark_comparison.longest_monologue.actual / (analysis.benchmark_comparison.longest_monologue.benchmark * 2)) * 100)}%` }}
                          />
                          <div
                            className="absolute inset-y-0 w-0.5 bg-indigo-400"
                            style={{ right: `${(analysis.benchmark_comparison.longest_monologue.benchmark / (analysis.benchmark_comparison.longest_monologue.benchmark * 2)) * 100}%` }}
                            title={`בנצ'מרק: ${analysis.benchmark_comparison.longest_monologue.benchmark} שניות`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{analysis.benchmark_comparison.longest_monologue.verdict}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced metrics grid */}
                {metrics && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
                    <div className="p-5 pb-3">
                      <h3 className="text-base font-semibold text-foreground">מדדים מתקדמים</h3>
                    </div>
                    <div className="px-5 pb-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                          <p className="text-2xl font-bold text-foreground">{metrics.filler_word_count}</p>
                          <p className="text-xs text-muted-foreground mt-1">מילות מילוי</p>
                        </div>
                        <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                          <p className="text-2xl font-bold text-foreground">{metrics.question_count}</p>
                          <p className="text-xs text-muted-foreground mt-1">שאלות</p>
                        </div>
                        <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                          <p className="text-2xl font-bold text-foreground">{metrics.silence_gaps}</p>
                          <p className="text-xs text-muted-foreground mt-1">הפסקות שקט</p>
                        </div>
                        <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                          <p className="text-2xl font-bold text-foreground">
                            {metrics.longest_monologue_seconds > 60
                              ? `${Math.floor(metrics.longest_monologue_seconds / 60)}:${(metrics.longest_monologue_seconds % 60).toString().padStart(2, '0')}`
                              : `${metrics.longest_monologue_seconds} שנ׳`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">מונולוג ארוך ביותר</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing Tracker Card */}
                {analysis.pricing_discussion_details?.mentioned && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
                    <div className="p-5 pb-3">
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                        מעקב מחירים
                      </h3>
                    </div>
                    <div className="px-5 pb-5 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                          <p className="text-2xl font-bold text-emerald-400">{analysis.pricing_discussion_details.count}</p>
                          <p className="text-xs text-muted-foreground mt-1">פעמים שהוזכר</p>
                        </div>
                        <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                          <p className="text-2xl font-bold text-foreground">
                            {analysis.pricing_discussion_details.first_mention_minute > 0
                              ? `דקה ${analysis.pricing_discussion_details.first_mention_minute}`
                              : 'תחילת השיחה'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">אזכור ראשון</p>
                        </div>
                      </div>
                      {analysis.pricing_discussion_details.context && (
                        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                          <p className="text-xs text-muted-foreground mb-1">הקשר</p>
                          <p className="text-sm text-foreground">{analysis.pricing_discussion_details.context}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fallback: old pricing discussion */}
                {!analysis.pricing_discussion_details?.mentioned && metrics?.pricing_discussion?.mentioned && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
                    <div className="p-5 pb-3">
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                        דיון מחירים
                      </h3>
                    </div>
                    <div className="px-5 pb-5">
                      {metrics.pricing_discussion.timestamp && (
                        <p className="text-xs text-muted-foreground mb-1">
                          זמן: {metrics.pricing_discussion.timestamp}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">{metrics.pricing_discussion.handling}</p>
                    </div>
                  </div>
                )}

                {/* Competitor Mentions with Timeline */}
                {analysis.competitor_mentions_detailed && analysis.competitor_mentions_detailed.length > 0 && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
                    <div className="p-5 pb-3">
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-400" />
                        אזכורי מתחרים
                      </h3>
                    </div>
                    <div className="px-5 pb-5 space-y-2">
                      {analysis.competitor_mentions_detailed.map((mention, i) => {
                        const sentimentConfig = {
                          positive: { label: 'חיובי', color: 'border-emerald-500/20 bg-emerald-500/5', textColor: 'text-emerald-400' },
                          negative: { label: 'שלילי', color: 'border-red-500/20 bg-red-500/5', textColor: 'text-red-400' },
                          neutral: { label: 'ניטרלי', color: 'border-border bg-background/50', textColor: 'text-muted-foreground' },
                        }
                        const config = sentimentConfig[mention.sentiment] || sentimentConfig.neutral
                        return (
                          <div key={i} className={`rounded-lg border p-3 ${config.color}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">{mention.name}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-[10px] ${config.textColor}`}>
                                  {config.label}
                                </Badge>
                                {mention.minute_mark > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleSeekToTime(mention.minute_mark * 60)}
                                    className="text-xs text-indigo-400 hover:text-indigo-300"
                                  >
                                    דקה {mention.minute_mark}
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{mention.context}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Fallback: old competitor mentions */}
                {(!analysis.competitor_mentions_detailed || analysis.competitor_mentions_detailed.length === 0) &&
                  metrics?.competitor_mentions && metrics.competitor_mentions.length > 0 && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
                    <div className="p-5 pb-3">
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-400" />
                        אזכורי מתחרים
                      </h3>
                    </div>
                    <div className="px-5 pb-5 space-y-2">
                      {metrics.competitor_mentions.map((mention, i) => (
                        <div key={i} className="rounded-lg bg-orange-500/5 border border-orange-500/20 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{mention.name}</span>
                            {mention.timestamp && (
                              <button
                                type="button"
                                onClick={() => {
                                  const parts = mention.timestamp.split(':').map(Number)
                                  if (parts.length === 2) handleSeekToTime(parts[0] * 60 + parts[1])
                                }}
                                className="text-xs text-indigo-400 hover:text-indigo-300"
                              >
                                {mention.timestamp}
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{mention.context}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sentiment trajectory */}
                {metrics?.sentiment_trajectory && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
                    <div className="p-5 pb-3">
                      <h3 className="text-base font-semibold text-foreground">מסלול סנטימנט</h3>
                    </div>
                    <div className="px-5 pb-5">
                      <div className="flex items-center justify-between gap-4">
                        {(['start', 'middle', 'end'] as const).map((phase) => {
                          const val = metrics.sentiment_trajectory[phase]
                          const info = SENTIMENT_LABELS[val] || SENTIMENT_LABELS.neutral
                          const phaseLabels = { start: 'תחילה', middle: 'אמצע', end: 'סוף' }
                          return (
                            <div key={phase} className="flex-1 text-center">
                              <p className="text-xs text-muted-foreground mb-1">{phaseLabels[phase]}</p>
                              <div className="rounded-lg p-2 border border-border bg-background/50">
                                <p className={`text-sm font-medium ${info.color}`}>{info.label}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <div className="flex-1 h-0.5 bg-border rounded" />
                        <span className="text-xs text-muted-foreground"><ChevronLeft className="h-3 w-3 inline" /></span>
                        <div className="flex-1 h-0.5 bg-border rounded" />
                        <span className="text-xs text-muted-foreground"><ChevronLeft className="h-3 w-3 inline" /></span>
                        <div className="flex-1 h-0.5 bg-border rounded" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: Questions, Buying Signals, Next Steps, Playbook, Missed Opps */}
              <div className="space-y-4">
                {/* Question Analysis Breakdown */}
                {analysis.questions_analysis && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
                    <div className="p-5 pb-3">
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-blue-400" />
                        ניתוח שאלות
                      </h3>
                    </div>
                    <div className="px-5 pb-5 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                          <p className="text-2xl font-bold text-foreground">{analysis.questions_analysis.total_asked}</p>
                          <p className="text-xs text-muted-foreground mt-1">סה״כ</p>
                        </div>
                        <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                          <p className="text-2xl font-bold text-emerald-400">{analysis.questions_analysis.open_questions}</p>
                          <p className="text-xs text-muted-foreground mt-1">פתוחות</p>
                        </div>
                        <div className="rounded-lg bg-background/50 border border-border p-3 text-center">
                          <p className="text-2xl font-bold text-amber-400">{analysis.questions_analysis.closed_questions}</p>
                          <p className="text-xs text-muted-foreground mt-1">סגורות</p>
                        </div>
                      </div>
                      {/* Distribution */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">התפלגות:</span>
                        <Badge variant="outline" className="text-[10px]">
                          {analysis.questions_analysis.question_distribution === 'front-loaded' ? 'ריכוז בתחילה' :
                           analysis.questions_analysis.question_distribution === 'spread' ? 'מפוזר' : 'ריכוז בסוף'}
                        </Badge>
                      </div>
                      {/* Best question */}
                      {analysis.questions_analysis.best_question && (
                        <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                          <p className="text-xs text-blue-400 mb-1">השאלה הטובה ביותר</p>
                          <p className="text-sm text-foreground">&quot;{analysis.questions_analysis.best_question}&quot;</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Buying Signals Timeline */}
                {analysis.buying_signals_enhanced && analysis.buying_signals_enhanced.length > 0 && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
                    <div className="p-5 pb-3">
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-400" />
                        סיגנלי קנייה
                      </h3>
                    </div>
                    <div className="px-5 pb-5 space-y-2">
                      {analysis.buying_signals_enhanced.map((sig, i) => {
                        const strengthConfig = {
                          strong: { label: 'חזק', color: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
                          moderate: { label: 'בינוני', color: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
                          weak: { label: 'חלש', color: 'bg-muted border-border', dot: 'bg-muted-foreground' },
                        }
                        const config = strengthConfig[sig.strength] || strengthConfig.weak
                        return (
                          <div key={i} className={`flex items-start gap-3 rounded-lg border p-3 ${config.color}`}>
                            <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full inline-block ${config.dot}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">{sig.signal}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
                                {sig.minute_mark > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleSeekToTime(sig.minute_mark * 60)}
                                    className="text-xs text-indigo-400 hover:text-indigo-300"
                                  >
                                    דקה {sig.minute_mark}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Next Steps Clarity Indicator */}
                {analysis.next_steps_clarity && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
                    <div className="p-5 pb-3">
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-indigo-400" />
                        בהירות צעדים הבאים
                      </h3>
                    </div>
                    <div className="px-5 pb-5 space-y-3">
                      <div className="flex items-center gap-3">
                        {analysis.next_steps_clarity.has_next_steps ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                        )}
                        <span className="text-sm text-foreground">
                          {analysis.next_steps_clarity.has_next_steps ? 'יש צעדים הבאים' : 'אין צעדים הבאים'}
                        </span>
                      </div>
                      {analysis.next_steps_clarity.has_next_steps && (
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant={analysis.next_steps_clarity.is_specific ? 'default' : 'outline'} className="text-xs">
                            {analysis.next_steps_clarity.is_specific ? 'ספציפי' : 'לא ספציפי'}
                          </Badge>
                          <Badge variant={analysis.next_steps_clarity.is_scheduled ? 'default' : 'outline'} className="text-xs">
                            {analysis.next_steps_clarity.is_scheduled ? 'מתוזמן' : 'לא מתוזמן'}
                          </Badge>
                        </div>
                      )}
                      {analysis.next_steps_clarity.description && (
                        <p className="text-sm text-muted-foreground">{analysis.next_steps_clarity.description}</p>
                      )}
                    </div>
                  </div>
                )}

                <PlaybookCoverage analysis={analysis} />

                {/* Missed opportunities */}
                {analysis.missed_opportunities && analysis.missed_opportunities.length > 0 && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
                    <div className="p-5 pb-3">
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <MessageSquareQuote className="h-4 w-4 text-amber-400" />
                        הזדמנויות שהוחמצו
                      </h3>
                    </div>
                    <div className="px-5 pb-5 space-y-2">
                      {analysis.missed_opportunities.map((opp, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                          <span className="text-muted-foreground">{opp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No advanced metrics fallback */}
                {!metrics && !analysis.benchmark_comparison && !analysis.questions_analysis && (
                  <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-8 text-center">
                    <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-foreground mb-1">אין נתונים מתקדמים</h3>
                    <p className="text-xs text-muted-foreground">
                      ניתוח מתקדם לא זמין לשיחה זו
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* If complete but no analysis yet (edge case) */}
      {isComplete && !analysis && call.summary && (
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
