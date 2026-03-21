'use client'

import { useState, useEffect, useCallback, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Target,
  MessageSquare,
  Star,
  Tag,
  FileText,
  Loader2,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────

interface Stage {
  name: string
  criteria: string
  weight: number
}

interface Objection {
  objection: string
  category: 'price' | 'timing' | 'authority' | 'competition' | 'other'
  idealResponse: string
}

interface Technique {
  name: string
  description: string
  example: string
}

interface Keywords {
  positive: string[]
  negative: string[]
}

interface Script {
  name: string
  content: string
}

interface PlaybookData {
  id: string | null
  name: string
  stages: Stage[]
  objectionBank: Objection[]
  techniques: Technique[]
  keywords: Keywords
  scripts: Script[]
  isNew: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  price: 'מחיר',
  timing: 'תזמון',
  authority: 'סמכות',
  competition: 'תחרות',
  other: 'אחר',
}

// ─── Collapsible Section ─────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  count,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  defaultOpen?: boolean
  count?: number
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-indigo-400" />
          <span className="font-semibold text-foreground">{title}</span>
          {count !== undefined && (
            <Badge variant="outline" className="text-xs bg-muted/50 border-border text-muted-foreground">
              {count}
            </Badge>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border">{children}</div>}
    </div>
  )
}

// ─── Tag Input ───────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
  placeholder,
  tagColor = 'default',
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder: string
  tagColor?: 'positive' | 'negative' | 'default'
}) {
  const [input, setInput] = useState('')

  const colorClasses = {
    positive: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    negative: 'bg-red-500/15 text-red-400 border-red-500/20',
    default: 'bg-muted/50 text-muted-foreground border-border',
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      if (!tags.includes(input.trim())) {
        onChange([...tags, input.trim()])
      }
      setInput('')
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-2 items-center p-2 rounded-lg border border-border bg-muted/30 min-h-[40px]">
      {tags.map((tag, i) => (
        <Badge
          key={i}
          variant="outline"
          className={`text-xs cursor-pointer ${colorClasses[tagColor]}`}
          onClick={() => onChange(tags.filter((_, j) => j !== i))}
        >
          {tag}
          <Trash2 className="h-3 w-3 mr-1 opacity-60" />
        </Badge>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
      />
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function PlaybookPage() {
  const [playbook, setPlaybook] = useState<PlaybookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const fetchPlaybook = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/playbook')
      if (res.ok) {
        const data = await res.json()
        setPlaybook({
          id: data.id,
          name: data.name || '',
          stages: data.stages || [],
          objectionBank: data.objectionBank || [],
          techniques: data.techniques || [],
          keywords: data.keywords || { positive: [], negative: [] },
          scripts: data.scripts || [],
          isNew: data.isNew ?? false,
        })
      }
    } catch {
      toast.error('שגיאה בטעינת התסריט')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlaybook()
  }, [fetchPlaybook])

  function update<K extends keyof PlaybookData>(key: K, value: PlaybookData[K]) {
    setPlaybook((prev) => (prev ? { ...prev, [key]: value } : prev))
    setDirty(true)
  }

  async function save() {
    if (!playbook) return
    setSaving(true)
    try {
      const res = await fetch('/api/playbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playbook.name,
          stages: playbook.stages,
          objectionBank: playbook.objectionBank,
          techniques: playbook.techniques,
          keywords: playbook.keywords,
          scripts: playbook.scripts,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPlaybook((prev) => (prev ? { ...prev, id: data.id, isNew: false } : prev))
        setDirty(false)
        toast.success('התסריט נשמר בהצלחה')
      } else {
        const err = await res.json()
        toast.error(err.error || 'שגיאה בשמירה')
      }
    } catch {
      toast.error('שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  // ─── Stages Helpers ──────────────────────────────────────────────

  function updateStage(index: number, field: keyof Stage, value: string | number) {
    const stages = [...(playbook?.stages || [])]
    stages[index] = { ...stages[index], [field]: value }
    update('stages', stages)
  }

  function addStage() {
    update('stages', [...(playbook?.stages || []), { name: '', criteria: '', weight: 5 }])
  }

  function removeStage(index: number) {
    update('stages', (playbook?.stages || []).filter((_, i) => i !== index))
  }

  function moveStage(index: number, direction: -1 | 1) {
    const stages = [...(playbook?.stages || [])]
    const target = index + direction
    if (target < 0 || target >= stages.length) return
    ;[stages[index], stages[target]] = [stages[target], stages[index]]
    update('stages', stages)
  }

  // ─── Objections Helpers ──────────────────────────────────────────

  function updateObjection(index: number, field: keyof Objection, value: string) {
    const bank = [...(playbook?.objectionBank || [])]
    bank[index] = { ...bank[index], [field]: value }
    update('objectionBank', bank)
  }

  function addObjection() {
    update('objectionBank', [
      ...(playbook?.objectionBank || []),
      { objection: '', category: 'other' as const, idealResponse: '' },
    ])
  }

  function removeObjection(index: number) {
    update('objectionBank', (playbook?.objectionBank || []).filter((_, i) => i !== index))
  }

  // ─── Techniques Helpers ──────────────────────────────────────────

  function updateTechnique(index: number, field: keyof Technique, value: string) {
    const techniques = [...(playbook?.techniques || [])]
    techniques[index] = { ...techniques[index], [field]: value }
    update('techniques', techniques)
  }

  function addTechnique() {
    update('techniques', [...(playbook?.techniques || []), { name: '', description: '', example: '' }])
  }

  function removeTechnique(index: number) {
    update('techniques', (playbook?.techniques || []).filter((_, i) => i !== index))
  }

  // ─── Scripts Helpers ─────────────────────────────────────────────

  function updateScript(index: number, field: keyof Script, value: string) {
    const scripts = [...(playbook?.scripts || [])]
    scripts[index] = { ...scripts[index], [field]: value }
    update('scripts', scripts)
  }

  function addScript() {
    update('scripts', [...(playbook?.scripts || []), { name: 'תסריט חדש', content: '' }])
  }

  function removeScript(index: number) {
    update('scripts', (playbook?.scripts || []).filter((_, i) => i !== index))
  }

  // ─── Render ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!playbook) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">תסריט מכירה</h1>
          <p className="text-muted-foreground">לא ניתן לטעון את התסריט</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">תסריט מכירה</h1>
          <p className="text-muted-foreground">
            הגדירו את שלבי המכירה, התנגדויות, טכניקות ומילות מפתח - ה-AI ישתמש בהם לניתוח
          </p>
        </div>
        <Button
          onClick={save}
          disabled={saving || !dirty}
          className="bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 ml-2" />
          )}
          {saving ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </div>

      {/* Playbook Name */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-5">
        <label className="block text-sm font-medium text-foreground mb-2">שם התסריט</label>
        <Input
          value={playbook.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="למשל: תסריט מכירות ראשי"
          className="bg-muted/30 border-border text-foreground"
        />
      </div>

      {/* Section 1: Call Stages */}
      <Section title="שלבי השיחה" icon={Target} count={playbook.stages.length}>
        <div className="mt-4 space-y-3">
          {playbook.stages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">עדיין לא הוגדרו שלבים. הוסיפו את שלבי שיחת המכירה שלכם.</p>
            </div>
          )}
          {playbook.stages.map((stage, i) => (
            <div key={i} className="rounded-lg bg-muted/30 border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveStage(i, -1)}
                    disabled={i === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStage(i, 1)}
                    disabled={i === playbook.stages.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <Badge
                  variant="outline"
                  className="rounded-full w-6 h-6 p-0 flex items-center justify-center bg-indigo-500/15 text-indigo-400 border-indigo-500/20 text-xs"
                >
                  {i + 1}
                </Badge>
                <Input
                  value={stage.name}
                  onChange={(e) => updateStage(i, 'name', e.target.value)}
                  placeholder="שם השלב"
                  className="flex-1 bg-transparent border-border text-foreground font-medium"
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">משקל:</label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={stage.weight}
                    onChange={(e) => updateStage(i, 'weight', Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-16 bg-transparent border-border text-foreground text-center"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeStage(i)}
                  className="text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={stage.criteria}
                onChange={(e) => updateStage(i, 'criteria', e.target.value)}
                placeholder="מה הנציג צריך לעשות בשלב הזה?"
                rows={2}
                className="w-full bg-muted/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 resize-none"
              />
            </div>
          ))}
          <Button
            variant="outline"
            onClick={addStage}
            className="w-full border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          >
            <Plus className="h-4 w-4 ml-2" />
            הוסף שלב
          </Button>
        </div>
      </Section>

      {/* Section 2: Objection Bank */}
      <Section title="בנק התנגדויות" icon={MessageSquare} count={playbook.objectionBank.length}>
        <div className="mt-4 space-y-3">
          {playbook.objectionBank.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">עדיין אין התנגדויות. הוסיפו התנגדויות נפוצות ותגובות מומלצות.</p>
            </div>
          )}
          {playbook.objectionBank.map((obj, i) => (
            <div key={i} className="rounded-lg bg-muted/30 border border-border p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    value={obj.objection}
                    onChange={(e) => updateObjection(i, 'objection', e.target.value)}
                    placeholder="ההתנגדות (למשל: יקר לי)"
                    className="bg-transparent border-border text-foreground font-medium"
                  />
                  <div className="flex gap-2">
                    <select
                      value={obj.category}
                      onChange={(e) => updateObjection(i, 'category', e.target.value)}
                      className="h-8 rounded-lg border border-border bg-muted/50 px-2 text-sm text-foreground outline-none"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeObjection(i)}
                  className="text-muted-foreground hover:text-red-400 transition-colors mt-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                <label className="text-xs font-medium text-emerald-400 mb-1 block">תגובה מומלצת:</label>
                <textarea
                  value={obj.idealResponse}
                  onChange={(e) => updateObjection(i, 'idealResponse', e.target.value)}
                  placeholder="התגובה האידיאלית להתנגדות הזו..."
                  rows={2}
                  className="w-full bg-transparent text-sm text-emerald-300/80 placeholder:text-emerald-400/30 outline-none resize-none"
                />
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={addObjection}
            className="w-full border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          >
            <Plus className="h-4 w-4 ml-2" />
            הוסף התנגדות
          </Button>
        </div>
      </Section>

      {/* Section 3: Sales Techniques */}
      <Section title="טכניקות מכירה" icon={Star} count={playbook.techniques.length}>
        <div className="mt-4 space-y-3">
          {playbook.techniques.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">הוסיפו טכניקות מכירה שה-AI צריך לחפש ולתגמל.</p>
            </div>
          )}
          {playbook.techniques.map((tech, i) => (
            <div key={i} className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Star className="h-5 w-5 text-amber-400 mt-1 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Input
                    value={tech.name}
                    onChange={(e) => updateTechnique(i, 'name', e.target.value)}
                    placeholder="שם הטכניקה"
                    className="bg-transparent border-amber-500/20 text-foreground font-medium"
                  />
                  <textarea
                    value={tech.description}
                    onChange={(e) => updateTechnique(i, 'description', e.target.value)}
                    placeholder="תיאור הטכניקה - מתי ואיך להשתמש"
                    rows={2}
                    className="w-full bg-transparent border border-amber-500/20 rounded-lg p-2 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
                  />
                  <Input
                    value={tech.example}
                    onChange={(e) => updateTechnique(i, 'example', e.target.value)}
                    placeholder="דוגמה למשפט (למשל: ספר לי איך אתה מקבל לקוחות היום?)"
                    className="bg-transparent border-amber-500/20 text-foreground text-sm italic"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeTechnique(i)}
                  className="text-muted-foreground hover:text-red-400 transition-colors mt-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={addTechnique}
            className="w-full border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          >
            <Plus className="h-4 w-4 ml-2" />
            הוסף טכניקה
          </Button>
        </div>
      </Section>

      {/* Section 4: Keywords */}
      <Section title="מילות מפתח" icon={Tag}>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-emerald-400 mb-2">
              מילים חיוביות (מעידות על מכירה טובה)
            </label>
            <TagInput
              tags={playbook.keywords.positive || []}
              onChange={(positive) => update('keywords', { ...playbook.keywords, positive })}
              placeholder="הקלידו מילה ולחצו Enter..."
              tagColor="positive"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-red-400 mb-2">
              מילים שליליות (להימנע מהן)
            </label>
            <TagInput
              tags={playbook.keywords.negative || []}
              onChange={(negative) => update('keywords', { ...playbook.keywords, negative })}
              placeholder="הקלידו מילה ולחצו Enter..."
              tagColor="negative"
            />
          </div>
          {(playbook.keywords.positive || []).length === 0 && (playbook.keywords.negative || []).length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Tag className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">הוסיפו מילות מפתח חיוביות ושליליות. ה-AI ישתמש בהן לניקוד.</p>
            </div>
          )}
        </div>
      </Section>

      {/* Section 5: Call Scripts */}
      <Section title="תסריט שיחה" icon={FileText} count={playbook.scripts.length}>
        <div className="mt-4 space-y-3">
          {playbook.scripts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">הדביקו את תסריט השיחה המלא. ה-AI ישווה את ביצועי הנציג לתסריט.</p>
            </div>
          )}
          {playbook.scripts.map((script, i) => (
            <div key={i} className="rounded-lg bg-muted/30 border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={script.name}
                  onChange={(e) => updateScript(i, 'name', e.target.value)}
                  placeholder="שם התסריט"
                  className="bg-transparent border-border text-foreground font-medium"
                />
                <button
                  type="button"
                  onClick={() => removeScript(i)}
                  className="text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={script.content}
                onChange={(e) => updateScript(i, 'content', e.target.value)}
                placeholder="הדביקו כאן את תסריט השיחה המלא..."
                rows={10}
                className="w-full bg-muted/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 resize-y font-mono leading-relaxed"
                dir="rtl"
              />
            </div>
          ))}
          <Button
            variant="outline"
            onClick={addScript}
            className="w-full border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          >
            <Plus className="h-4 w-4 ml-2" />
            הוסף תסריט
          </Button>
        </div>
      </Section>

      {/* Floating save bar */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border py-3 px-6 flex items-center justify-between">
          <p className="text-sm text-amber-400">יש שינויים שלא נשמרו</p>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 ml-2" />
            )}
            {saving ? 'שומר...' : 'שמור שינויים'}
          </Button>
        </div>
      )}
    </div>
  )
}
