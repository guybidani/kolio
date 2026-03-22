'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Search,
  Presentation,
  Handshake,
  ShieldAlert,
  Send,
  Loader2,
  ArrowRight,
  Trophy,
  Clock,
  RotateCcw,
  ChevronDown,
  Target,
  Swords,
  Star,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────
type Scenario = 'discovery' | 'demo' | 'closing' | 'objection-handling'
type Difficulty = 'easy' | 'medium' | 'hard'
type Screen = 'start' | 'chat' | 'results'

interface PracticeMessage {
  role: 'user' | 'buyer'
  content: string
  timestamp: string
}

interface PastSession {
  id: string
  scenario: string
  difficulty: string
  isComplete: boolean
  overallScore: number | null
  createdAt: string
}

interface Evaluation {
  scores: {
    overall: number
    discovery: number
    objection_handling: number
    closing: number
    rapport: number
    value_communication: number
  }
  strengths: string[]
  improvements: string[]
  summary: string
  bestMoment: string
  worstMoment: string
}

// ─── Constants ───────────────────────────────────────────────────
const SCENARIO_CONFIG: Record<
  Scenario,
  { label: string; description: string; icon: typeof Search; color: string }
> = {
  discovery: {
    label: 'שיחת גילוי',
    description: 'תרגל זיהוי צרכים ושאילת שאלות פתוחות',
    icon: Search,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  demo: {
    label: 'הדגמת מוצר',
    description: 'תרגל הצגת פתרון ותקשורת ערך',
    icon: Presentation,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  closing: {
    label: 'שיחת סגירה',
    description: 'תרגל סגירת עסקה והתמודדות עם התלבטויות',
    icon: Handshake,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  'objection-handling': {
    label: 'טיפול בהתנגדויות',
    description: 'תרגל מענה להתנגדויות מגוונות של לקוח',
    icon: ShieldAlert,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
}

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; description: string; color: string }
> = {
  easy: {
    label: 'קל',
    description: 'לקוח שיתופי',
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  medium: {
    label: 'בינוני',
    description: 'לקוח סקפטי',
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  hard: {
    label: 'קשה',
    description: 'לקוח קשוח',
    color: 'text-red-400 border-red-500/30 bg-red-500/10',
  },
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-400'
  if (score >= 6) return 'text-blue-400'
  if (score >= 4) return 'text-amber-400'
  return 'text-red-400'
}

function getScoreBg(score: number): string {
  if (score >= 8) return 'bg-emerald-500/10 border-emerald-500/20'
  if (score >= 6) return 'bg-blue-500/10 border-blue-500/20'
  if (score >= 4) return 'bg-amber-500/10 border-amber-500/20'
  return 'bg-red-500/10 border-red-500/20'
}

function getScoreLabel(score: number): string {
  if (score >= 9) return 'מצוין!'
  if (score >= 7) return 'טוב מאוד'
  if (score >= 5) return 'סביר'
  if (score >= 3) return 'צריך שיפור'
  return 'חלש'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Main Component ──────────────────────────────────────────────
export default function PracticePage() {
  const [screen, setScreen] = useState<Screen>('start')
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<PracticeMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [pastSessions, setPastSessions] = useState<PastSession[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load past sessions
  useEffect(() => {
    fetch('/api/practice')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.sessions) setPastSessions(data.sessions)
      })
      .catch(() => {})
  }, [screen])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat loads
  useEffect(() => {
    if (screen === 'chat' && !isSending) {
      inputRef.current?.focus()
    }
  }, [screen, isSending])

  const startSession = useCallback(async () => {
    if (!selectedScenario) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: selectedScenario,
          difficulty: selectedDifficulty,
        }),
      })

      if (!res.ok) throw new Error('Failed to start session')

      const data = await res.json()
      setSessionId(data.id)
      setMessages(data.messages)
      setIsComplete(false)
      setEvaluation(null)
      setScreen('chat')
    } catch (error) {
      console.error('Error starting session:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedScenario, selectedDifficulty])

  const sendMessage = useCallback(async () => {
    if (!sessionId || !inputValue.trim() || isSending) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setIsSending(true)

    // Optimistically add user message
    const newUserMsg: PracticeMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, newUserMsg])

    try {
      const res = await fetch(`/api/practice/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!res.ok) throw new Error('Failed to send message')

      const data = await res.json()
      const buyerMsg: PracticeMessage = {
        role: 'buyer',
        content: data.reply,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, buyerMsg])

      if (data.isComplete) {
        setIsComplete(true)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }, [sessionId, inputValue, isSending])

  const endAndEvaluate = useCallback(async () => {
    if (!sessionId) return

    setIsEvaluating(true)
    try {
      const res = await fetch(`/api/practice/${sessionId}/evaluate`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Failed to evaluate')

      const data = await res.json()
      setEvaluation(data.evaluation)
      setScreen('results')
    } catch (error) {
      console.error('Error evaluating:', error)
    } finally {
      setIsEvaluating(false)
    }
  }, [sessionId])

  const resetToStart = useCallback(() => {
    setScreen('start')
    setSelectedScenario(null)
    setSessionId(null)
    setMessages([])
    setInputValue('')
    setIsComplete(false)
    setEvaluation(null)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [sendMessage]
  )

  // ─── Start Screen ──────────────────────────────────────────
  if (screen === 'start') {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Swords className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-semibold text-foreground">תרגול AI</h1>
            <p className="text-sm text-muted-foreground">
              תתרגל שיחות מכירה מול קונה AI שמדמה לקוחות אמיתיים
            </p>
          </div>
        </div>

        {/* Scenario Selection */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">בחר תרחיש</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.entries(SCENARIO_CONFIG) as [Scenario, (typeof SCENARIO_CONFIG)[Scenario]][]).map(
              ([key, config]) => {
                const Icon = config.icon
                const isSelected = selectedScenario === key
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedScenario(key)}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-4 text-start transition-all',
                      isSelected
                        ? 'border-indigo-500/40 bg-indigo-500/5 ring-1 ring-indigo-500/20'
                        : 'border-border bg-card hover:bg-muted/50 hover:border-border/80'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                        config.color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{config.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                    </div>
                  </button>
                )
              }
            )}
          </div>
        </div>

        {/* Difficulty Selection */}
        {selectedScenario && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">רמת קושי</h2>
            <div className="flex gap-2">
              {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, (typeof DIFFICULTY_CONFIG)[Difficulty]][]).map(
                ([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDifficulty(key)}
                    className={cn(
                      'flex-1 rounded-lg border px-4 py-3 text-center transition-all',
                      selectedDifficulty === key
                        ? cn(config.color, 'ring-1 ring-current/20')
                        : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                    )}
                  >
                    <p className="font-medium text-sm">{config.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{config.description}</p>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Start Button */}
        {selectedScenario && (
          <Button
            onClick={startSession}
            disabled={isLoading}
            className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Swords className="h-5 w-5 me-2" />
                התחל תרגול
              </>
            )}
          </Button>
        )}

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              <Clock className="h-4 w-4" />
              <span>היסטוריית תרגולים ({pastSessions.length})</span>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', showHistory && 'rotate-180')}
              />
            </button>

            {showHistory && (
              <div className="space-y-2">
                {pastSessions.map((s) => {
                  const scenarioConfig = SCENARIO_CONFIG[s.scenario as Scenario]
                  const difficultyConfig = DIFFICULTY_CONFIG[s.difficulty as Difficulty]
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {scenarioConfig?.label || s.scenario}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px]', difficultyConfig?.color)}
                          >
                            {difficultyConfig?.label || s.difficulty}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(s.createdAt)}
                        </p>
                      </div>
                      {s.overallScore !== null ? (
                        <div
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg border font-bold text-sm',
                            getScoreBg(s.overallScore),
                            getScoreColor(s.overallScore)
                          )}
                        >
                          {s.overallScore}
                        </div>
                      ) : s.isComplete ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          לא הוערך
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                          בתהליך
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ─── Chat Screen ───────────────────────────────────────────
  if (screen === 'chat') {
    const scenarioConfig = selectedScenario ? SCENARIO_CONFIG[selectedScenario] : null
    const difficultyConfig = DIFFICULTY_CONFIG[selectedDifficulty]

    return (
      <div className="mx-auto max-w-2xl flex flex-col h-[calc(100vh-8rem)]">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border',
                scenarioConfig?.color
              )}
            >
              {scenarioConfig && <scenarioConfig.icon className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{scenarioConfig?.label}</p>
              <p className="text-xs text-muted-foreground">
                {difficultyConfig.label} | {messages.filter((m) => m.role === 'user').length} הודעות
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={endAndEvaluate}
            disabled={isEvaluating || messages.filter((m) => m.role === 'user').length < 2}
            className="text-xs"
          >
            {isEvaluating ? (
              <Loader2 className="h-3 w-3 animate-spin me-1" />
            ) : (
              <Target className="h-3 w-3 me-1" />
            )}
            {isEvaluating ? 'מעריך...' : 'סיים תרגול'}
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-4 min-h-0">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex', msg.role === 'user' ? 'justify-start' : 'justify-end')}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-bl-md'
                    : 'bg-muted text-foreground rounded-br-md'
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-end">
              <div className="bg-muted rounded-2xl rounded-br-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" />
                </div>
              </div>
            </div>
          )}

          {isComplete && !isEvaluating && (
            <div className="flex justify-center">
              <div className="rounded-lg bg-muted/50 border border-border px-4 py-2 text-center">
                <p className="text-sm text-muted-foreground">
                  הלקוח סיים את השיחה.{' '}
                  <button
                    onClick={endAndEvaluate}
                    className="text-indigo-400 hover:underline font-medium"
                  >
                    לחץ כאן להערכה
                  </button>
                </p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border pt-3 shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isComplete ? 'השיחה הסתיימה' : 'הקלד את התגובה שלך...'}
              disabled={isSending || isComplete || isEvaluating}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 disabled:opacity-50"
              dir="rtl"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isSending || isComplete || isEvaluating}
              size="icon"
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white h-[42px] w-[42px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Results Screen ────────────────────────────────────────
  if (screen === 'results' && evaluation) {
    const scores = evaluation.scores
    const dimensions = [
      { key: 'discovery', label: 'גילוי צרכים', icon: Search },
      { key: 'objection_handling', label: 'טיפול בהתנגדויות', icon: ShieldAlert },
      { key: 'closing', label: 'סגירה', icon: Handshake },
      { key: 'rapport', label: 'ראפור', icon: Star },
      { key: 'value_communication', label: 'תקשורת ערך', icon: Presentation },
    ]

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header with overall score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Trophy className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-semibold text-foreground">תוצאות התרגול</h1>
              <p className="text-sm text-muted-foreground">
                {selectedScenario && SCENARIO_CONFIG[selectedScenario]?.label} |{' '}
                {DIFFICULTY_CONFIG[selectedDifficulty].label}
              </p>
            </div>
          </div>
          <div
            className={cn(
              'flex flex-col items-center rounded-xl border px-5 py-3',
              getScoreBg(scores.overall)
            )}
          >
            <span className={cn('text-3xl font-bold', getScoreColor(scores.overall))}>
              {scores.overall}
            </span>
            <span className={cn('text-xs', getScoreColor(scores.overall))}>
              {getScoreLabel(scores.overall)}
            </span>
          </div>
        </div>

        {/* Summary */}
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-foreground leading-relaxed">{evaluation.summary}</p>
          </CardContent>
        </Card>

        {/* Dimension Scores */}
        <Card>
          <CardHeader>
            <CardTitle>ציונים לפי מדד</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dimensions.map((dim) => {
                const score = scores[dim.key as keyof typeof scores] || 0
                const Icon = dim.icon
                return (
                  <div key={dim.key} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground w-32 shrink-0">{dim.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          score >= 8
                            ? 'bg-emerald-500'
                            : score >= 6
                              ? 'bg-blue-500'
                              : score >= 4
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                        )}
                        style={{ width: `${score * 10}%` }}
                      />
                    </div>
                    <span className={cn('text-sm font-bold w-6 text-end', getScoreColor(score))}>
                      {score}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <CardTitle>נקודות חוזק</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5 shrink-0">+</span>
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-amber-400" />
                <CardTitle>נקודות לשיפור</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.improvements.map((s, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5 shrink-0">-</span>
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Best & Worst Moments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-emerald-400 text-sm">הרגע הכי טוב</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{evaluation.bestMoment}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-400 text-sm">הרגע שצריך הכי הרבה שיפור</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">{evaluation.worstMoment}</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={resetToStart}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <RotateCcw className="h-4 w-4 me-2" />
            תרגל שוב
          </Button>
          <Button variant="outline" onClick={resetToStart} className="flex-1">
            <ArrowRight className="h-4 w-4 me-2" />
            חזרה לתרחישים
          </Button>
        </div>
      </div>
    )
  }

  return null
}
