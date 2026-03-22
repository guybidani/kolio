'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Loader2, Check, ExternalLink } from 'lucide-react'

interface VixyCrmConfig {
  enabled: boolean
  webhookUrl: string
  workspaceId: string
  hasSecret: boolean
}

export default function VixyCrmIntegration() {
  const [config, setConfig] = useState<VixyCrmConfig>({
    enabled: false,
    webhookUrl: '',
    workspaceId: '',
    hasSecret: false,
  })
  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings/vixy-crm')
        if (res.ok) {
          const data = await res.json()
          setConfig(data)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const body: Record<string, unknown> = {
        enabled: config.enabled,
        webhookUrl: config.webhookUrl,
        workspaceId: config.workspaceId,
      }
      if (secret) {
        body.webhookSecret = secret
      }

      const res = await fetch('/api/settings/vixy-crm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const data = await res.json()
        setConfig(data)
        setSecret('')
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(enabled: boolean) {
    setConfig((c) => ({ ...c, enabled }))
    try {
      await fetch('/api/settings/vixy-crm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
    } catch {
      setConfig((c) => ({ ...c, enabled: !enabled }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
      <div className="p-5 pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-indigo-400" />
            Vixy CRM
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            שלח ניתוח שיחות אוטומטית ל-Vixy CRM כפעילות CALL
          </p>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {config.enabled && (
        <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Webhook URL
            </label>
            <Input
              value={config.webhookUrl}
              onChange={(e) => setConfig((c) => ({ ...c, webhookUrl: e.target.value }))}
              placeholder="https://crm.projectadam.co.il/api/v1/kolio/webhook"
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
              dir="ltr"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Webhook Secret
            </label>
            <Input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={config.hasSecret ? '••••••••  (כבר מוגדר, הזן כדי לעדכן)' : 'הזן secret משותף'}
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground mt-1">
              חייב להיות זהה ל-KOLIO_WEBHOOK_SECRET שמוגדר ב-Vixy CRM
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Workspace ID
            </label>
            <Input
              value={config.workspaceId}
              onChange={(e) => setConfig((c) => ({ ...c, workspaceId: e.target.value }))}
              placeholder="UUID של ה-Workspace ב-Vixy CRM"
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
              dir="ltr"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4 ml-2" />
            ) : null}
            {saved ? 'נשמר!' : 'שמור'}
          </Button>
        </div>
      )}
    </div>
  )
}
