'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Phone,
  Plus,
  Copy,
  Check,
  Trash2,
  Eye,
  EyeOff,
  Zap,
  ChevronRight,
  ChevronLeft,
  Globe,
  Loader2,
} from 'lucide-react'

// --- Types ---

interface PbxIntegration {
  id: string
  name: string
  pbxType: string
  isActive: boolean
  webhookUrl: string | null
  webhookSecret: string
  extensionMap: Record<string, string>
  lastWebhookAt: string | null
  createdAt: string
}

interface Rep {
  id: string
  name: string
  extension: string | null
}

// --- PBX Type definitions ---

interface PbxTypeInfo {
  id: string
  name: string
  icon: React.ReactNode
  instructions: string
}

const pbxTypes: PbxTypeInfo[] = [
  {
    id: 'voicenter',
    name: 'Voicenter',
    icon: <span className="text-lg">&#127470;&#127473;</span>,
    instructions: `1. היכנס לפאנל הניהול של Voicenter
2. לך ל-Settings \u2192 Webhooks \u2192 CDR Notifications
3. הוסף URL חדש והדבק את כתובת ה-Webhook שלמטה
4. סמן: Call End Notification
5. שמור`,
  },
  {
    id: '3cx',
    name: '3CX',
    icon: <Phone className="h-5 w-5 text-blue-400" />,
    instructions: `1. היכנס לממשק הניהול של 3CX
2. לך ל-Settings \u2192 Integrations \u2192 Webhook
3. הדבק את כתובת ה-Webhook שלמטה
4. סמן את האירועים: Call Completed, Recording Available
5. שמור והפעל`,
  },
  {
    id: 'freepbx',
    name: 'FreePBX / Asterisk',
    icon: <Phone className="h-5 w-5 text-orange-400" />,
    instructions: `1. היכנס לשרת FreePBX
2. לך ל-Admin \u2192 System Admin \u2192 Notification Settings
3. הוסף HTTP Notification עם כתובת ה-Webhook שלמטה
4. או: התקן את מודול CDR webhook
5. הגדר לשלוח notification בסיום שיחה`,
  },
  {
    id: 'twilio',
    name: 'Twilio',
    icon: <span className="text-lg text-red-400 font-bold">T</span>,
    instructions: `1. היכנס ל-Twilio Console
2. לך ל-Voice \u2192 Settings \u2192 General
3. הגדר Status Callback URL לכתובת ה-Webhook שלמטה
4. סמן את האירועים: completed
5. הפעל Recording ב-TwiML או Studio`,
  },
  {
    id: 'vonage',
    name: 'Vonage',
    icon: <span className="text-lg text-purple-400 font-bold">V</span>,
    instructions: `1. היכנס ל-Vonage Dashboard
2. לך ל-Applications \u2192 Your App \u2192 Voice
3. הגדר Event URL לכתובת ה-Webhook שלמטה
4. סמן: completed events
5. הפעל Recording`,
  },
  {
    id: 'aircall',
    name: 'Aircall',
    icon: <Phone className="h-5 w-5 text-green-400" />,
    instructions: `1. היכנס ל-Aircall Dashboard
2. לך ל-Integrations \u2192 Webhooks
3. הוסף Webhook חדש עם כתובת ה-URL שלמטה
4. סמן את האירוע: call.ended
5. שמור`,
  },
  {
    id: 'zoom',
    name: 'Zoom Phone',
    icon: <span className="text-lg text-blue-500 font-bold">Z</span>,
    instructions: `1. היכנס ל-Zoom Marketplace
2. צור אפליקציית Webhook Only
3. הגדר Event Subscription URL לכתובת שלמטה
4. הוסף את האירוע: phone.callee_call_log_completed
5. הפעל את האפליקציה`,
  },
  {
    id: 'cloudtalk',
    name: 'CloudTalk',
    icon: <span className="text-lg text-cyan-400 font-bold">C</span>,
    instructions: `1. היכנס ל-CloudTalk Dashboard
2. לך ל-Account \u2192 Integrations \u2192 Webhooks
3. הוסף Webhook חדש עם כתובת ה-URL שלמטה
4. סמן את האירוע: Call Ended
5. שמור`,
  },
  {
    id: 'generic',
    name: 'Generic Webhook',
    icon: <Globe className="h-5 w-5 text-gray-400" />,
    instructions: `שלח POST request לכתובת ה-Webhook עם הפרמטרים הבאים:
- recordingUrl: קישור להקלטה (חובה)
- callerNumber: מספר המתקשר
- calledNumber: מספר הנמען
- duration: משך השיחה בשניות
- direction: inbound / outbound
- callId: מזהה שיחה ייחודי
- timestamp: זמן השיחה

Header חובה: X-Webhook-Secret: {your-secret}`,
  },
]

// --- Clipboard helper ---

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [text])

  return (
    <Button
      variant="outline"
      size="icon"
      className="border-border text-muted-foreground hover:bg-muted/50 shrink-0"
      onClick={handleCopy}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
    </Button>
  )
}

// --- Secret field ---

function SecretField({ secret }: { secret: string }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex gap-2 items-center">
      <Input
        value={visible ? secret : '\u2022'.repeat(16)}
        readOnly
        className="font-mono text-xs bg-muted/30 border-border text-muted-foreground"
      />
      <Button
        variant="outline"
        size="icon"
        className="border-border text-muted-foreground hover:bg-muted/50 shrink-0"
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
      <CopyButton text={secret} />
    </div>
  )
}

// --- Extension Mapping ---

function ExtensionMapping({
  integrationId,
  extensionMap,
  reps,
  onSave,
}: {
  integrationId: string
  extensionMap: Record<string, string>
  reps: Rep[]
  onSave: (id: string, map: Record<string, string>) => void
}) {
  const [entries, setEntries] = useState<Array<{ ext: string; repId: string }>>(
    Object.entries(extensionMap).map(([ext, repId]) => ({ ext, repId: repId as string }))
  )

  const addRow = () => {
    setEntries([...entries, { ext: '', repId: '' }])
  }

  const removeRow = (idx: number) => {
    setEntries(entries.filter((_, i) => i !== idx))
  }

  const updateRow = (idx: number, field: 'ext' | 'repId', value: string) => {
    const updated = [...entries]
    updated[idx] = { ...updated[idx], [field]: value }
    setEntries(updated)
  }

  const handleSave = () => {
    const map: Record<string, string> = {}
    for (const entry of entries) {
      if (entry.ext && entry.repId) {
        map[entry.ext] = entry.repId
      }
    }
    onSave(integrationId, map)
  }

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">מיפוי שלוחות</label>
        <Button
          variant="outline"
          size="sm"
          className="border-border text-muted-foreground hover:bg-muted/50 text-xs h-7"
          onClick={addRow}
        >
          <Plus className="h-3 w-3 ml-1" />
          הוסף שלוחה
        </Button>
      </div>
      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground/60">
          אין מיפויי שלוחות. הוסף כדי לזהות נציגים אוטומטית.
        </p>
      )}
      {entries.map((entry, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <Input
            value={entry.ext}
            onChange={(e) => updateRow(idx, 'ext', e.target.value)}
            className="w-24 bg-muted/50 border-border text-foreground text-xs"
            placeholder="שלוחה"
          />
          <select
            value={entry.repId}
            onChange={(e) => updateRow(idx, 'repId', e.target.value)}
            className="flex-1 h-9 rounded-md border border-border bg-muted/50 px-3 text-xs text-foreground"
          >
            <option value="">-- בחר נציג --</option>
            {reps.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.name}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-red-400 shrink-0 h-8 w-8"
            onClick={() => removeRow(idx)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      {entries.length > 0 && (
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-7"
          onClick={handleSave}
        >
          שמור מיפוי
        </Button>
      )}
    </div>
  )
}

// --- Integration Card ---

function IntegrationCard({
  integration,
  reps,
  onToggle,
  onDelete,
  onSaveExtensions,
}: {
  integration: PbxIntegration
  reps: Rep[]
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  onSaveExtensions: (id: string, map: Record<string, string>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const pbxInfo = pbxTypes.find((t) => t.id === integration.pbxType)

  return (
    <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted/50 border border-border shrink-0">
          {pbxInfo?.icon || <Phone className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {integration.name || pbxInfo?.name || integration.pbxType}
            </p>
            <Badge
              className={
                integration.isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-muted text-muted-foreground border border-border'
              }
            >
              {integration.isActive ? 'פעיל' : 'כבוי'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {integration.lastWebhookAt
              ? `Webhook אחרון: ${new Date(integration.lastWebhookAt).toLocaleDateString('he-IL')} ${new Date(integration.lastWebhookAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`
              : 'טרם התקבל webhook'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className={`border-border text-xs h-7 ${
              integration.isActive
                ? 'text-muted-foreground hover:bg-muted/50'
                : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
            onClick={() => onToggle(integration.id, !integration.isActive)}
          >
            {integration.isActive ? 'השבת' : 'הפעל'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-red-400 h-8 w-8"
            onClick={() => onDelete(integration.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground h-8 w-8"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Webhook URL
            </label>
            <div className="flex gap-2">
              <Input
                value={integration.webhookUrl || ''}
                readOnly
                className="font-mono text-xs bg-muted/30 border-border text-muted-foreground"
                dir="ltr"
              />
              <CopyButton text={integration.webhookUrl || ''} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Webhook Secret
            </label>
            <SecretField secret={integration.webhookSecret} />
          </div>

          <ExtensionMapping
            integrationId={integration.id}
            extensionMap={integration.extensionMap}
            reps={reps}
            onSave={onSaveExtensions}
          />
        </div>
      )}
    </div>
  )
}

// --- Add Integration Dialog ---

function AddIntegrationDialog({
  open,
  onOpenChange,
  orgId,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  onCreated: () => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<{ webhookUrl: string; webhookSecret: string } | null>(null)

  const selectedPbx = pbxTypes.find((t) => t.id === selectedType)

  const reset = () => {
    setStep(1)
    setSelectedType(null)
    setName('')
    setCreating(false)
    setResult(null)
  }

  const handleClose = (open: boolean) => {
    if (!open) reset()
    onOpenChange(open)
  }

  const handleCreate = async () => {
    if (!selectedType) return
    setCreating(true)
    try {
      const res = await fetch(`/api/orgs/${orgId}/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || undefined, pbxType: selectedType }),
      })
      if (res.ok) {
        const data = await res.json()
        setResult({
          webhookUrl: data.integration.webhookUrl,
          webhookSecret: data.integration.webhookSecret,
        })
        setStep(3)
        onCreated()
      }
    } catch (err) {
      console.error('Failed to create integration:', err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && 'בחר סוג מרכזיה'}
            {step === 2 && `הגדרת ${selectedPbx?.name}`}
            {step === 3 && 'האינטגרציה מוכנה'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'בחר את סוג המרכזיה שברצונך לחבר'}
            {step === 2 && 'עקוב אחר ההוראות כדי לחבר את המרכזיה'}
            {step === 3 && 'העתק את פרטי ה-Webhook למרכזיה שלך'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select PBX type */}
        {step === 1 && (
          <div className="grid grid-cols-3 gap-2">
            {pbxTypes.map((pbx) => (
              <button
                key={pbx.id}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-colors ${
                  selectedType === pbx.id
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-border bg-muted/30 hover:bg-muted/50'
                }`}
                onClick={() => setSelectedType(pbx.id)}
              >
                <div className="flex items-center justify-center h-8 w-8">
                  {pbx.icon}
                </div>
                <span className="text-xs font-medium text-foreground">{pbx.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Instructions + name */}
        {step === 2 && selectedPbx && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                שם האינטגרציה (אופציונלי)
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={selectedPbx.name}
                className="bg-muted/50 border-border text-foreground"
              />
            </div>
            <div className="rounded-lg bg-muted/30 border border-border p-4">
              <h4 className="text-sm font-medium text-foreground mb-2">הוראות הגדרה</h4>
              <pre
                className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed"
                dir="rtl"
              >
                {selectedPbx.instructions}
              </pre>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && (
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">האינטגרציה נוצרה בהצלחה</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Webhook URL
              </label>
              <div className="flex gap-2">
                <Input
                  value={result.webhookUrl}
                  readOnly
                  className="font-mono text-xs bg-muted/30 border-border text-muted-foreground"
                  dir="ltr"
                />
                <CopyButton text={result.webhookUrl} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Webhook Secret
              </label>
              <SecretField secret={result.webhookSecret} />
              <p className="text-xs text-muted-foreground mt-1">
                שמרו את ה-Secret במקום בטוח. לא ניתן לצפות בו שוב.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
              disabled={!selectedType}
              onClick={() => setStep(2)}
            >
              המשך
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
          )}
          {step === 2 && (
            <div className="flex gap-2 w-full justify-between">
              <Button
                variant="outline"
                className="border-border text-muted-foreground"
                onClick={() => setStep(1)}
              >
                <ChevronRight className="h-4 w-4 ml-1" />
                חזור
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                    יוצר...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 ml-1" />
                    צור אינטגרציה
                  </>
                )}
              </Button>
            </div>
          )}
          {step === 3 && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
              onClick={() => handleClose(false)}
            >
              סיום
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Main Component ---

export default function PbxIntegrations({ orgId }: { orgId: string }) {
  const [integrations, setIntegrations] = useState<PbxIntegration[]>([])
  const [reps, setReps] = useState<Rep[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await fetch(`/api/orgs/${orgId}/integrations`)
      if (res.ok) {
        const data = await res.json()
        setIntegrations(data.integrations)
      }
    } catch (err) {
      console.error('Failed to fetch integrations:', err)
    } finally {
      setLoading(false)
    }
  }, [orgId])

  const fetchReps = useCallback(async () => {
    try {
      const res = await fetch(`/api/orgs/${orgId}/reps`)
      if (res.ok) {
        const data = await res.json()
        setReps(data.reps || [])
      }
    } catch (err) {
      console.error('Failed to fetch reps:', err)
    }
  }, [orgId])

  useEffect(() => {
    fetchIntegrations()
    fetchReps()
  }, [fetchIntegrations, fetchReps])

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/orgs/${orgId}/integrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (res.ok) {
        setIntegrations((prev) =>
          prev.map((i) => (i.id === id ? { ...i, isActive } : i))
        )
      }
    } catch (err) {
      console.error('Failed to toggle integration:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק את האינטגרציה?')) return
    try {
      const res = await fetch(`/api/orgs/${orgId}/integrations/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setIntegrations((prev) => prev.filter((i) => i.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete integration:', err)
    }
  }

  const handleSaveExtensions = async (id: string, extensionMap: Record<string, string>) => {
    try {
      const res = await fetch(`/api/orgs/${orgId}/integrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionMap }),
      })
      if (res.ok) {
        setIntegrations((prev) =>
          prev.map((i) => (i.id === id ? { ...i, extensionMap } : i))
        )
      }
    } catch (err) {
      console.error('Failed to save extensions:', err)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
        <div className="p-5 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">חיבורי מרכזיה (PBX)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              חברו את המרכזיה שלכם כדי לקבל שיחות אוטומטית
            </p>
          </div>
          <Button
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
            size="sm"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4 ml-1" />
            הוסף מרכזיה
          </Button>
        </div>

        <div className="px-5 pb-5">
          {integrations.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                אין מרכזיות מחוברות
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                הוסיפו מרכזיה כדי להתחיל לקבל שיחות אוטומטית
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  reps={reps}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onSaveExtensions={handleSaveExtensions}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddIntegrationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        orgId={orgId}
        onCreated={fetchIntegrations}
      />
    </>
  )
}
