'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  Link2,
  Shield,
  Copy,
} from 'lucide-react'

export default function SettingsPage() {
  const webhookUrl = 'https://app.kolio.co.il/api/webhooks/pbx?org=demo-org&secret=abc123'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">הגדרות</h1>
        <p className="text-white/40">ניהול ארגון ואינטגרציות</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="general" className="data-[state=active]:bg-white/10">
            <Settings className="h-4 w-4 ml-1" />
            כללי
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-white/10">
            <Link2 className="h-4 w-4 ml-1" />
            אינטגרציות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-4">
          <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-base font-semibold text-white">פרטי ארגון</h3>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-1 block">שם הארגון</label>
                <Input defaultValue="סוכנות Project Adam" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-sm font-medium text-white mb-1 block">Slug</label>
                <Input defaultValue="project-adam" disabled className="bg-white/[0.03] border-white/10 text-white/40" />
                <p className="text-xs text-white/50 mt-1">
                  לא ניתן לשנות את ה-slug
                </p>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">שמור שינויים</Button>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-400" />
                אבטחה
              </h3>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-1 block">Webhook Secret</label>
                <div className="flex gap-2">
                  <Input defaultValue="whsec_abc123..." type="password" readOnly className="bg-white/[0.03] border-white/10 text-white/40" />
                  <Button variant="outline" size="icon" className="border-white/10 text-white/60 hover:bg-white/5">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  משמש לאימות webhook-ים נכנסים מהמרכזיה
                </p>
              </div>
              <Button variant="outline" className="border-white/10 text-white/60 hover:bg-white/5">חידוש Secret</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-4">
          <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-base font-semibold text-white">חיבור מרכזיה (PBX)</h3>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <p className="text-sm text-white/50">
                העתיקו את כתובת ה-Webhook למרכזיה שלכם. תומכים ב-Voicenter, 3CX, Yeastar,
                Grandstream, Twilio, Vonage, CloudTalk ועוד.
              </p>
              <div>
                <label className="text-sm font-medium text-white mb-1 block">Webhook URL</label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-xs bg-white/[0.03] border-white/10 text-white/60" />
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-white/10 text-white/60 hover:bg-white/5"
                    onClick={() => navigator.clipboard.writeText(webhookUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-white mb-1 block">מיפוי שלוחות</label>
                <p className="text-xs text-white/50 mb-2">
                  מפו שלוחות לנציגים כדי לזהות אוטומטית מי דיבר
                </p>
                <div className="space-y-2">
                  {[
                    { ext: '101', name: 'יוסי אברהם' },
                    { ext: '102', name: 'גיא בידני' },
                    { ext: '103', name: 'מיכל דוד' },
                  ].map((mapping) => (
                    <div key={mapping.ext} className="flex gap-2">
                      <Input
                        defaultValue={mapping.ext}
                        className="w-24 bg-white/5 border-white/10 text-white"
                        placeholder="שלוחה"
                      />
                      <Input
                        defaultValue={mapping.name}
                        className="flex-1 bg-white/5 border-white/10 text-white"
                        placeholder="שם נציג"
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="border-white/10 text-white/60 hover:bg-white/5">
                    + הוסף שלוחה
                  </Button>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-sm font-medium text-white mb-2">מרכזיות מחוברות</h4>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/[0.03]">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">פעיל</Badge>
                  <div>
                    <p className="text-sm font-medium text-white">Voicenter</p>
                    <p className="text-xs text-white/50">
                      חובר ב-15/03/2026 | 23 שיחות הועברו
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-base font-semibold text-white">אינטגרציות נוספות</h3>
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
                    className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.03]"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{integration.name}</p>
                      <p className="text-xs text-white/50">
                        {integration.description}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="border-white/10 text-white/60 hover:bg-white/5">
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
