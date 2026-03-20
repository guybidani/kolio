'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  Link2,
  Shield,
} from 'lucide-react'
import PbxIntegrations from '@/components/dashboard/pbx-integrations'

export default function SettingsPage() {
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setOrgId(data.org?.id || null)
        }
      } catch {
        // silently fail
      }
    }
    loadSession()
  }, [])

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
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-4">
          <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-base font-semibold text-foreground">פרטי ארגון</h3>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">שם הארגון</label>
                <Input defaultValue="סוכנות Project Adam" className="bg-muted/50 border-border text-foreground" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Slug</label>
                <Input defaultValue="project-adam" disabled className="bg-muted/30 border-border text-muted-foreground" />
                <p className="text-xs text-muted-foreground mt-1">
                  לא ניתן לשנות את ה-slug
                </p>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">שמור שינויים</Button>
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
      </Tabs>
    </div>
  )
}
