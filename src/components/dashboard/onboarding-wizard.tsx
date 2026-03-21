'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  BookOpen,
  Phone,
  Upload,
  Check,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingState {
  hasReps: boolean
  hasCalls: boolean
  hasPlaybook: boolean
  hasIntegration: boolean
}

interface OnboardingWizardProps {
  initialState: OnboardingState
  onDismiss: () => void
}

interface Step {
  key: keyof OnboardingState
  title: string
  description: string
  icon: typeof Users
}

const STEPS: Step[] = [
  {
    key: 'hasReps',
    title: 'הוסף נציג ראשון',
    description: 'הוסף את הנציג הראשון שלך כדי לעקוב אחר הביצועים שלו',
    icon: Users,
  },
  {
    key: 'hasPlaybook',
    title: 'הגדר תסריט מכירה',
    description: 'תסריט המכירה מגדיר את הקריטריונים לניתוח השיחות',
    icon: BookOpen,
  },
  {
    key: 'hasIntegration',
    title: 'חבר מרכזיה',
    description: 'חבר את המרכזיה שלך כדי שהשיחות ייקלטו אוטומטית',
    icon: Phone,
  },
  {
    key: 'hasCalls',
    title: 'העלה שיחה ראשונה',
    description: 'העלה את השיחה הראשונה שלך לניתוח AI',
    icon: Upload,
  },
]

export function OnboardingWizard({ initialState, onDismiss }: OnboardingWizardProps) {
  const [state, setState] = useState<OnboardingState>(initialState)
  const [activeStep, setActiveStep] = useState(() => {
    const firstIncomplete = STEPS.findIndex((s) => !initialState[s.key])
    return firstIncomplete === -1 ? 0 : firstIncomplete
  })
  const [dismissing, setDismissing] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const completedCount = STEPS.filter((s) => state[s.key]).length
  const allComplete = completedCount === STEPS.length

  const handleDismiss = useCallback(async () => {
    setDismissing(true)
    try {
      await fetch('/api/onboarding', { method: 'POST' })
      onDismiss()
    } catch {
      setDismissing(false)
    }
  }, [onDismiss])

  const handleStepComplete = useCallback(
    (key: keyof OnboardingState) => {
      setState((prev) => ({ ...prev, [key]: true }))
      // Move to next incomplete step
      const nextIncomplete = STEPS.findIndex(
        (s, i) => i > activeStep && !state[s.key] && s.key !== key
      )
      if (nextIncomplete !== -1) {
        setActiveStep(nextIncomplete)
      } else {
        // Check if all complete
        const newState = { ...state, [key]: true }
        if (STEPS.every((s) => newState[s.key])) {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3000)
        }
      }
    },
    [activeStep, state]
  )

  return (
    <div className="relative rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 overflow-hidden">
      {/* Confetti overlay */}
      {showConfetti && <ConfettiEffect />}

      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/10 p-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {allComplete ? 'ההגדרה הושלמה!' : 'בואו נתחיל'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {allComplete
                ? 'הכל מוכן - אפשר להתחיל לנתח שיחות'
                : `${completedCount} מתוך ${STEPS.length} שלבים הושלמו`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
          disabled={dismissing}
          title="סגור"
        >
          {dismissing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-4">
        <div className="flex gap-1.5">
          {STEPS.map((step, i) => (
            <div
              key={step.key}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-300',
                state[step.key]
                  ? 'bg-indigo-500'
                  : i === activeStep
                    ? 'bg-indigo-500/30'
                    : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2 px-5 pb-4">
        {STEPS.map((step, i) => (
          <button
            key={step.key}
            onClick={() => setActiveStep(i)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
              i === activeStep
                ? 'bg-muted/80 text-foreground border border-border'
                : state[step.key]
                  ? 'text-indigo-400 hover:bg-muted/50'
                  : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            {state[step.key] ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <step.icon className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{step.title}</span>
          </button>
        ))}
      </div>

      {/* Active step content */}
      <div className="px-5 pb-5">
        <StepContent
          step={STEPS[activeStep]}
          isComplete={state[STEPS[activeStep].key]}
          onComplete={() => handleStepComplete(STEPS[activeStep].key)}
          onNext={() => setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1))}
          onPrev={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
          isFirst={activeStep === 0}
          isLast={activeStep === STEPS.length - 1}
        />
      </div>

      {/* Footer */}
      {allComplete && (
        <div className="border-t border-border bg-muted/30 px-5 py-3 flex justify-end">
          <Button
            onClick={handleDismiss}
            disabled={dismissing}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {dismissing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
            סיים הגדרה
          </Button>
        </div>
      )}
    </div>
  )
}

// --- Step Content Components ---

interface StepContentProps {
  step: Step
  isComplete: boolean
  onComplete: () => void
  onNext: () => void
  onPrev: () => void
  isFirst: boolean
  isLast: boolean
}

function StepContent({ step, isComplete, onComplete, onNext, onPrev, isFirst, isLast }: StepContentProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'rounded-lg p-2.5 shrink-0',
            isComplete ? 'bg-emerald-500/10' : 'bg-indigo-500/10'
          )}
        >
          {isComplete ? (
            <Check className="h-5 w-5 text-emerald-400" />
          ) : (
            <step.icon className="h-5 w-5 text-indigo-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground mb-1">{step.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

          {isComplete ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <Check className="h-4 w-4" />
              <span>הושלם</span>
            </div>
          ) : (
            <StepAction stepKey={step.key} onComplete={onComplete} />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={isFirst}
          className="text-muted-foreground"
        >
          <ChevronRight className="h-4 w-4 ml-1" />
          הקודם
        </Button>

        <div className="flex items-center gap-2">
          {!isComplete && (
            <Button variant="ghost" size="sm" onClick={onNext} className="text-muted-foreground">
              דלג
            </Button>
          )}
          {!isLast && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              className="text-muted-foreground"
            >
              הבא
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepAction({
  stepKey,
  onComplete,
}: {
  stepKey: keyof OnboardingState
  onComplete: () => void
}) {
  switch (stepKey) {
    case 'hasReps':
      return <AddRepInline onComplete={onComplete} />
    case 'hasPlaybook':
      return <PlaybookAction onComplete={onComplete} />
    case 'hasIntegration':
      return <IntegrationAction />
    case 'hasCalls':
      return <UploadCallInline onComplete={onComplete} />
    default:
      return null
  }
}

// --- Step 1: Add Rep Inline ---

function AddRepInline({ onComplete }: { onComplete: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [extension, setExtension] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/reps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          extension: extension.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create rep')
      }

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת נציג')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          placeholder="שם הנציג *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="bg-background"
        />
        <Input
          placeholder="טלפון"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          dir="ltr"
          className="bg-background"
        />
        <Input
          placeholder="שלוחה"
          value={extension}
          onChange={(e) => setExtension(e.target.value)}
          dir="ltr"
          className="bg-background"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button
        type="submit"
        disabled={loading || !name.trim()}
        className="bg-indigo-600 hover:bg-indigo-500 text-white"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
        הוסף נציג
      </Button>
    </form>
  )
}

// --- Step 2: Playbook ---

function PlaybookAction({ onComplete }: { onComplete: () => void }) {
  const [loading, setLoading] = useState(false)

  const handleUseDefault = async () => {
    setLoading(true)
    try {
      // Fetch the default playbook structure and save it
      const getRes = await fetch('/api/playbook')
      if (!getRes.ok) throw new Error('Failed to fetch playbook')
      const playbook = await getRes.json()

      const res = await fetch('/api/playbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playbook.name || 'תסריט מכירה ברירת מחדל',
          stages: playbook.stages,
          objectionBank: playbook.objectionBank,
          keywords: playbook.keywords,
          techniques: playbook.techniques,
          scripts: playbook.scripts,
        }),
      })

      if (!res.ok) throw new Error('Failed to save playbook')
      onComplete()
    } catch {
      // Silently fail - user can try again
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={handleUseDefault}
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-500 text-white"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
        השתמש בתסריט ברירת מחדל
      </Button>
      <Link href="/dashboard/playbook">
        <Button variant="outline" className="border-border">
          צור תסריט מותאם
        </Button>
      </Link>
    </div>
  )
}

// --- Step 3: Integration ---

function IntegrationAction() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        חבר את המרכזיה שלך כדי שהשיחות ייקלטו אוטומטית, או העלה שיחות ידנית.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/settings">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
            <Phone className="h-4 w-4 ml-2" />
            חבר מרכזיה
          </Button>
        </Link>
        <Link href="/dashboard/upload">
          <Button variant="outline" className="border-border">
            <Upload className="h-4 w-4 ml-2" />
            העלה שיחות ידנית
          </Button>
        </Link>
      </div>
    </div>
  )
}

// --- Step 4: Upload Call Inline ---

function UploadCallInline({ onComplete }: { onComplete: () => void }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|ogg|webm|mp4)$/i)) {
      setError('נא להעלות קובץ אודיו (MP3, WAV, M4A, OGG, WebM)')
      return
    }

    if (file.size > 200 * 1024 * 1024) {
      setError('הקובץ גדול מדי (מקסימום 200MB)')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/calls', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to upload')
      }

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהעלאת הקובץ')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
          dragging
            ? 'border-indigo-500 bg-indigo-500/5'
            : 'border-border hover:border-indigo-500/50 hover:bg-muted/30'
        )}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-2" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
        )}
        <p className="text-sm text-foreground font-medium">
          {uploading ? 'מעלה...' : 'גרור קובץ אודיו לכאן'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          MP3, WAV, M4A, OGG, WebM - עד 200MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.mp4"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Link href="/dashboard/upload" className="text-sm text-indigo-400 hover:underline">
        או עבור לדף ההעלאה המלא
      </Link>
    </div>
  )
}

// --- Confetti Effect ---

function ConfettiEffect() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        >
          <div
            className="h-2 w-2 rounded-sm"
            style={{
              backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'][
                Math.floor(Math.random() * 6)
              ],
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        </div>
      ))}
    </div>
  )
}
