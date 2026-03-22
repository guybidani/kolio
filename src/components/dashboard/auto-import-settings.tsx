'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  Server,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Trash2,
  PlugZap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// --- Copy Button ---

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
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

// --- Types ---

interface ImportConfig {
  email?: {
    enabled: boolean
  }
  ftp?: {
    enabled: boolean
    host: string
    port: number
    username: string
    password: string
    path: string
    secure: boolean
    filePattern: string
    lastPollAt?: string
  }
}

// ============================================
// Email Import Section
// ============================================

function EmailImportSection({
  config,
  apiKey,
  orgSlug,
  onSave,
}: {
  config: ImportConfig['email']
  apiKey: string | null
  orgSlug: string
  onSave: (config: ImportConfig['email']) => Promise<void>
}) {
  const [enabled, setEnabled] = useState(config?.enabled ?? true)
  const [saving, setSaving] = useState(false)

  const handleToggle = async () => {
    setSaving(true)
    try {
      await onSave({ enabled: !enabled })
      setEnabled(!enabled)
    } finally {
      setSaving(false)
    }
  }

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/import/email${apiKey ? `?key=${apiKey}` : ''}`
    : ''

  return (
    <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
      <div className="p-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 shrink-0">
            <Mail className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">יבוא ממייל</h3>
            <p className="text-xs text-muted-foreground">קבלת הקלטות ישירות ממייל המרכזיה</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className={`border-border text-xs h-7 ${
            enabled
              ? 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
              : 'text-muted-foreground hover:bg-muted/50'
          }`}
          onClick={handleToggle}
          disabled={saving}
        >
          {saving && <Loader2 className="h-3 w-3 ml-1 animate-spin" />}
          {enabled ? 'פעיל' : 'כבוי'}
        </Button>
      </div>

      <div className="px-5 pb-5 space-y-4">
        <div className="rounded-lg bg-muted/30 border border-border p-4 space-y-3">
          <h4 className="text-sm font-medium text-foreground">הוראות הגדרה</h4>
          <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
            <p>
              מערכות PBX רבות (FreePBX, 3CX, ועוד) מאפשרות לשלוח הקלטות למייל אחרי כל שיחה.
            </p>
            <p className="font-medium text-foreground">שלב 1: הגדירו את המרכזיה לשלוח הקלטות למייל</p>
            <p>
              בהגדרות המרכזיה, מצאו את אפשרות "שליחת הקלטה למייל" או "Email Recording".
              הגדירו שכל הקלטה תישלח כקובץ מצורף (MP3/WAV).
            </p>
            <p className="font-medium text-foreground">שלב 2: הגדירו העברה לכתובת ה-Webhook</p>
            <p>
              השתמשו בשירות כמו Cloudflare Email Workers, Mailgun, או Zapier להעביר את המייל ל-Webhook שלנו.
              המייל מנותח אוטומטית - מספרי טלפון, משך שיחה וכיוון מזוהים מהנושא/גוף המייל.
            </p>
          </div>
        </div>

        {apiKey && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Webhook URL (לשליחת מיילים)
            </label>
            <div className="flex gap-2">
              <Input
                value={webhookUrl}
                readOnly
                className="font-mono text-xs bg-muted/30 border-border text-muted-foreground"
                dir="ltr"
              />
              <CopyButton text={webhookUrl} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              שלחו POST request עם JSON: {`{ from, subject, body, attachments: [{ filename, contentType, content (base64) }] }`}
            </p>
          </div>
        )}

        {!apiKey && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <p className="text-xs text-amber-400">
              צרו מפתח API בלשונית "מפתח API" כדי לקבל את כתובת ה-Webhook לייבוא מייל.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// FTP Import Section
// ============================================

function FtpImportSection({
  config,
  onSave,
}: {
  config: ImportConfig['ftp']
  onSave: (config: ImportConfig['ftp']) => Promise<void>
}) {
  const [enabled, setEnabled] = useState(config?.enabled ?? false)
  const [host, setHost] = useState(config?.host || '')
  const [port, setPort] = useState(config?.port?.toString() || '21')
  const [username, setUsername] = useState(config?.username || '')
  const [password, setPassword] = useState(config?.password || '')
  const [path, setPath] = useState(config?.path || '/')
  const [secure, setSecure] = useState(config?.secure ?? false)
  const [filePattern, setFilePattern] = useState(config?.filePattern || '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [polling, setPolling] = useState(false)
  const [pollResult, setPollResult] = useState<{ imported: number; errors?: string[] } | null>(null)
  const [expanded, setExpanded] = useState(!!config?.host)

  const handleSave = async () => {
    setSaving(true)
    try {
      const ftpConfig = {
        enabled,
        host: host.trim(),
        port: parseInt(port) || 21,
        username: username.trim(),
        password,
        path: path.trim() || '/',
        secure,
        filePattern: filePattern.trim(),
        lastPollAt: config?.lastPollAt,
      }
      await onSave(ftpConfig)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/import/ftp-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: host.trim(),
          port: parseInt(port) || 21,
          username: username.trim(),
          password,
          path: path.trim() || '/',
          secure,
        }),
      })
      const data = await res.json()
      setTestResult({ success: data.success, message: data.message })
    } catch {
      setTestResult({ success: false, message: 'שגיאה בבדיקת חיבור' })
    } finally {
      setTesting(false)
    }
  }

  const handlePoll = async () => {
    setPolling(true)
    setPollResult(null)
    try {
      const res = await fetch('/api/import/ftp-poll', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setPollResult({ imported: data.imported, errors: data.errors })
      } else {
        setPollResult({ imported: 0, errors: [data.error] })
      }
    } catch {
      setPollResult({ imported: 0, errors: ['שגיאה בסריקה'] })
    } finally {
      setPolling(false)
    }
  }

  return (
    <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
      <div className="p-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            <Server className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">FTP / SFTP</h3>
            <p className="text-xs text-muted-foreground">סריקת תיקיית הקלטות בשרת FTP</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`border-border text-xs h-7 ${
              enabled
                ? 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
            onClick={() => setEnabled(!enabled)}
          >
            {enabled ? 'פעיל' : 'כבוי'}
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
        <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">שרת (Host)</label>
              <Input
                value={host}
                onChange={e => setHost(e.target.value)}
                placeholder="ftp.example.com"
                className="bg-muted/50 border-border text-foreground text-sm"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">פורט</label>
              <Input
                value={port}
                onChange={e => setPort(e.target.value)}
                placeholder="21"
                className="bg-muted/50 border-border text-foreground text-sm"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">שם משתמש</label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="user"
                className="bg-muted/50 border-border text-foreground text-sm"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">סיסמה</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-muted/50 border-border text-foreground text-sm"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">נתיב תיקייה</label>
              <Input
                value={path}
                onChange={e => setPath(e.target.value)}
                placeholder="/recordings"
                className="bg-muted/50 border-border text-foreground text-sm"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">תבנית קבצים (Regex, אופציונלי)</label>
              <Input
                value={filePattern}
                onChange={e => setFilePattern(e.target.value)}
                placeholder=".*\.mp3$"
                className="bg-muted/50 border-border text-foreground text-sm"
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={secure}
                onChange={e => setSecure(e.target.checked)}
                className="rounded border-border bg-muted/50"
              />
              <span className="text-xs text-muted-foreground">חיבור מאובטח (FTPS)</span>
            </label>
          </div>

          {config?.lastPollAt && (
            <p className="text-xs text-muted-foreground">
              סריקה אחרונה: {new Date(config.lastPollAt).toLocaleDateString('he-IL')}{' '}
              {new Date(config.lastPollAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}

          {testResult && (
            <div className={`rounded-lg border p-3 ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success
                  ? <CheckCircle className="h-4 w-4 text-emerald-400" />
                  : <AlertCircle className="h-4 w-4 text-red-400" />
                }
                <span className={`text-xs ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {testResult.message}
                </span>
              </div>
            </div>
          )}

          {pollResult && (
            <div className={`rounded-lg border p-3 ${
              pollResult.imported > 0
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : pollResult.errors?.length
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-muted/30 border-border'
            }`}>
              <p className={`text-xs ${
                pollResult.imported > 0 ? 'text-emerald-400' : pollResult.errors?.length ? 'text-red-400' : 'text-muted-foreground'
              }`}>
                {pollResult.imported > 0
                  ? `יובאו ${pollResult.imported} שיחות בהצלחה`
                  : pollResult.errors?.length
                    ? pollResult.errors[0]
                    : 'לא נמצאו קבצים חדשים'
                }
              </p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="border-border text-muted-foreground hover:bg-muted/50 text-xs"
              onClick={handleTest}
              disabled={testing || !host || !username}
            >
              {testing ? <Loader2 className="h-3 w-3 ml-1 animate-spin" /> : <PlugZap className="h-3 w-3 ml-1" />}
              בדוק חיבור
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-border text-muted-foreground hover:bg-muted/50 text-xs"
              onClick={handlePoll}
              disabled={polling || !enabled || !host}
            >
              {polling ? <Loader2 className="h-3 w-3 ml-1 animate-spin" /> : <RefreshCw className="h-3 w-3 ml-1" />}
              סרוק עכשיו
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="h-3 w-3 ml-1 animate-spin" />}
              שמור הגדרות
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// API Key Section
// ============================================

function ApiKeySection({
  apiKey,
  orgSlug,
  onGenerate,
  onRevoke,
}: {
  apiKey: string | null
  orgSlug: string
  onGenerate: () => Promise<void>
  onRevoke: () => Promise<void>
}) {
  const [showKey, setShowKey] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [revoking, setRevoking] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const curlExample = apiKey
    ? `curl -X POST "${baseUrl}/api/import/simple" \\
  -H "x-api-key: ${apiKey}" \\
  -F "file=@recording.mp3" \\
  -F "phone=0501234567" \\
  -F "direction=INBOUND" \\
  -F "duration=120" \\
  -F "repName=ישראל" \\
  -F "extension=101"`
    : ''

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await onGenerate()
      setShowKey(true)
    } finally {
      setGenerating(false)
    }
  }

  const handleRevoke = async () => {
    if (!confirm('האם למחוק את מפתח ה-API? כל הסקריפטים שמשתמשים בו יפסיקו לעבוד.')) return
    setRevoking(true)
    try {
      await onRevoke()
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
      <div className="p-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
            <Key className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">מפתח API</h3>
            <p className="text-xs text-muted-foreground">העלאת שיחות מכל מערכת באמצעות HTTP</p>
          </div>
        </div>
        {apiKey ? (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">מוגדר</Badge>
        ) : (
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border">לא מוגדר</Badge>
        )}
      </div>

      <div className="px-5 pb-5 space-y-4">
        {apiKey ? (
          <>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">מפתח API</label>
              <div className="flex gap-2 items-center">
                <Input
                  value={showKey ? apiKey : '\u2022'.repeat(20)}
                  readOnly
                  className="font-mono text-xs bg-muted/30 border-border text-muted-foreground"
                  dir="ltr"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="border-border text-muted-foreground hover:bg-muted/50 shrink-0"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <CopyButton text={apiKey} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">דוגמת curl</label>
              <div className="relative">
                <pre
                  className="text-xs bg-muted/30 border border-border rounded-lg p-3 text-muted-foreground overflow-x-auto whitespace-pre-wrap"
                  dir="ltr"
                >
                  {curlExample}
                </pre>
                <div className="absolute top-2 left-2">
                  <CopyButton text={curlExample} />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/30 border border-border p-3">
              <h4 className="text-xs font-medium text-foreground mb-2">פרמטרים אופציונליים</h4>
              <div className="text-xs text-muted-foreground space-y-1" dir="ltr">
                <p><code className="text-foreground">file</code> - קובץ אודיו (חובה) - MP3, WAV, M4A, OGG, WebM</p>
                <p><code className="text-foreground">phone</code> - מספר מתקשר</p>
                <p><code className="text-foreground">calledNumber</code> - מספר נמען</p>
                <p><code className="text-foreground">direction</code> - INBOUND / OUTBOUND / UNKNOWN</p>
                <p><code className="text-foreground">duration</code> - משך בשניות</p>
                <p><code className="text-foreground">repName</code> - שם הנציג</p>
                <p><code className="text-foreground">extension</code> - שלוחה</p>
                <p><code className="text-foreground">externalId</code> - מזהה חיצוני (למניעת כפילויות)</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border text-muted-foreground hover:bg-muted/50 text-xs"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? <Loader2 className="h-3 w-3 ml-1 animate-spin" /> : <RefreshCw className="h-3 w-3 ml-1" />}
                חדש מפתח
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs"
                onClick={handleRevoke}
                disabled={revoking}
              >
                {revoking ? <Loader2 className="h-3 w-3 ml-1 animate-spin" /> : <Trash2 className="h-3 w-3 ml-1" />}
                מחק מפתח
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              צרו מפתח API כדי לאפשר העלאת הקלטות אוטומטית מכל סקריפט או מערכת.
              המפתח מאפשר גישה ללא התחברות - שמרו אותו במקום בטוח.
            </p>
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Key className="h-4 w-4 ml-2" />}
              צור מפתח API
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export default function AutoImportSettings() {
  const [loading, setLoading] = useState(true)
  const [importConfig, setImportConfig] = useState<ImportConfig>({})
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [orgSlug, setOrgSlug] = useState('')

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/import/config')
      if (res.ok) {
        const data = await res.json()
        setImportConfig(data.importConfig || {})
        setApiKey(data.apiKey)
        setOrgSlug(data.orgSlug || '')
      }
    } catch (err) {
      console.error('Failed to fetch import config:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const saveSection = async (section: string, config: Record<string, unknown>) => {
    const res = await fetch('/api/import/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, config }),
    })
    if (res.ok) {
      setImportConfig(prev => ({ ...prev, [section]: config }))
    }
  }

  const handleGenerateApiKey = async () => {
    const res = await fetch('/api/import/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate-api-key' }),
    })
    if (res.ok) {
      const data = await res.json()
      setApiKey(data.apiKey)
    }
  }

  const handleRevokeApiKey = async () => {
    const res = await fetch('/api/import/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'revoke-api-key' }),
    })
    if (res.ok) {
      setApiKey(null)
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
    <div className="space-y-4">
      <EmailImportSection
        config={importConfig.email}
        apiKey={apiKey}
        orgSlug={orgSlug}
        onSave={async (config) => {
          await saveSection('email', config as unknown as Record<string, unknown>)
        }}
      />

      <FtpImportSection
        config={importConfig.ftp}
        onSave={async (config) => {
          await saveSection('ftp', config as unknown as Record<string, unknown>)
        }}
      />

      <ApiKeySection
        apiKey={apiKey}
        orgSlug={orgSlug}
        onGenerate={handleGenerateApiKey}
        onRevoke={handleRevokeApiKey}
      />
    </div>
  )
}
