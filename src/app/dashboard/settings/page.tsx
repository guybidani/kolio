'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  Link2,
  Shield,
  Loader2,
  Download,
  Bell,
} from 'lucide-react'
import PbxIntegrations from '@/components/dashboard/pbx-integrations'
import AutoImportSettings from '@/components/dashboard/auto-import-settings'

interface OrgInfo {
  id: string
  name: string
  slug: string
}

interface EmailPreferences {
  emailNotifications: boolean
  emailDigest: boolean
}

export default function SettingsPage() {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [org, setOrg] = useState<OrgInfo | null>(null)
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Email notification preferences
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences>({
    emailNotifications: true,
    emailDigest: true,
  })
  const [prefsLoading, setPrefsLoading] = useState(false)
  const [prefsSaving, setPrefsSaving] = useState(false)

  useEffect(() => {
    async function loadSession() {
      setLoading(true)
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          const orgData = data.org || null
          setOrgId(orgData?.id || null)
          setOrg(orgData)
          setOrgName(orgData?.name || '')
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    loadSession()
  }, [])

  const loadEmailPreferences = useCallback(async () => {
    setPrefsLoading(true)
    try {
      const res = await fetch('/api/notifications/preferences')
      if (res.ok) {
        const data = await res.json()
        setEmailPrefs({
          emailNotifications: data.emailNotifications,
          emailDigest: data.emailDigest,
        })
      }
    } catch {
      // silently fail
    } finally {
      setPrefsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEmailPreferences()
  }, [loadEmailPreferences])

  async function updateEmailPref(field: keyof EmailPreferences, value: boolean) {
    setPrefsSaving(true)
    const prev = { ...emailPrefs }
    setEmailPrefs((p) => ({ ...p, [field]: value }))

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) {
        // Revert on failure
        setEmailPrefs(prev)
      }
    } catch {
      setEmailPrefs(prev)
    } finally {
      setPrefsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">הגדרות</h1>
        <p className="text-muted-foreground">ניהול ארגון ואינטגרציות</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="general" className="data-[state=active]:bg-muted">
            <Settings className="h-4 w-4 ml-1" />
            כללי
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-muted">
            <Link2 className="h-4 w-4 ml-1" />
            אינטגרציות
          </TabsTrigger>
          <TabsTrigger value="auto-import" className="data-[state=active]:bg-muted">
            <Download className="h-4 w-4 ml-1" />
            יבוא אוטומטי
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-muted">
            <Bell className="h-4 w-4 ml-1" />
            התראות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-4">
          <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-base font-semibold text-foreground">פרטי ארגון</h3>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">שם הארגון</label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="bg-muted/50 border-border text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Slug</label>
                <Input
                  value={org?.slug || ''}
                  disabled
                  className="bg-muted/30 border-border text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  לא ניתן לשנות את ה-slug
                </p>
              </div>
              <Button
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : null}
                שמור שינויים
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-400" />
                אבטחה
              </h3>
            </div>
            <div className="px-5 pb-5 space-y-3">
              <p className="text-sm text-muted-foreground">
                כל אינטגרציית מרכזיה מקבלת Secret ייחודי. ניהול ה-Secrets מתבצע בלשונית אינטגרציות.
              </p>
              <Button
                variant="outline"
                className="border-border text-muted-foreground hover:bg-muted/50"
                onClick={() => {
                  const tab = document.querySelector('[data-slot="tabs-trigger"][value="integrations"]') as HTMLElement
                  tab?.click()
                }}
              >
                <Link2 className="h-4 w-4 ml-1" />
                עבור לאינטגרציות
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-4">
          {orgId ? (
            <PbxIntegrations orgId={orgId} />
          ) : (
            <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">טוען...</p>
            </div>
          )}

          <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-base font-semibold text-foreground">אינטגרציות נוספות</h3>
            </div>
            <div className="px-5 pb-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { name: 'Google Drive', description: 'סנכרון הקלטות מ-Google Drive' },
                  { name: 'Slack', description: 'התראות על שיחות חדשות' },
                  { name: 'HubSpot', description: 'סנכרון עם CRM' },
                  { name: 'Monday.com', description: 'יצירת פריטים אוטומטית' },
                ].map((integration) => (
                  <div
                    key={integration.name}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{integration.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {integration.description}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted/50">
                      חבר
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="auto-import" className="mt-6 space-y-4">
          <AutoImportSettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-4">
          <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-400" />
                התראות מייל
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                בחר אילו התראות תרצה לקבל במייל
              </p>
            </div>
            <div className="px-5 pb-5 space-y-5">
              {prefsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">קבל דוחות שבועיים במייל</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        סיכום שבועי של ביצועי הצוות, כולל ציונים, נציג השבוע ושיחות שדורשות תשומת לב
                      </p>
                    </div>
                    <Switch
                      checked={emailPrefs.emailDigest}
                      onCheckedChange={(checked) => updateEmailPref('emailDigest', checked)}
                      disabled={prefsSaving}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">קבל התראות על ציונים נמוכים</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        קבל מייל כשנציג מקבל ציון נמוך בשיחה ונדרשת תשומת לב
                      </p>
                    </div>
                    <Switch
                      checked={emailPrefs.emailNotifications}
                      onCheckedChange={(checked) => updateEmailPref('emailNotifications', checked)}
                      disabled={prefsSaving}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">קבל התראות על תגים חדשים</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        קבל מייל כשנציג מרוויח תג חדש כמו &quot;נציג השבוע&quot; או &quot;ציון מושלם&quot;
                      </p>
                    </div>
                    <Switch
                      checked={emailPrefs.emailNotifications}
                      onCheckedChange={(checked) => updateEmailPref('emailNotifications', checked)}
                      disabled={prefsSaving}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
