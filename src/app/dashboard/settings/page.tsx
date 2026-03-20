'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  CreditCard,
  Link2,
  Shield,
  Copy,
  ExternalLink,
} from 'lucide-react'

export default function SettingsPage() {
  const webhookUrl = 'https://app.kolio.co.il/api/webhooks/pbx?org=demo-org&secret=abc123'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">הגדרות</h1>
        <p className="text-muted-foreground">ניהול ארגון, חיוב ואינטגרציות</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 ml-1" />
            כללי
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 ml-1" />
            חיוב
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Link2 className="h-4 w-4 ml-1" />
            אינטגרציות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">פרטי ארגון</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">שם הארגון</label>
                <Input defaultValue="סוכנות Project Adam" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Slug</label>
                <Input defaultValue="project-adam" disabled />
                <p className="text-xs text-muted-foreground mt-1">
                  לא ניתן לשנות את ה-slug
                </p>
              </div>
              <Button>שמור שינויים</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                אבטחה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Webhook Secret</label>
                <div className="flex gap-2">
                  <Input defaultValue="whsec_abc123..." type="password" readOnly />
                  <Button variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  משמש לאימות webhook-ים נכנסים מהמרכזיה
                </p>
              </div>
              <Button variant="outline">חידוש Secret</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">התוכנית הנוכחית</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">Trial</h3>
                    <Badge>14 ימים נותרו</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    3 נציגים, 50 שיחות בחודש
                  </p>
                </div>
                <Button>שדרוג תוכנית</Button>
              </div>

              <Separator className="my-4" />

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center p-4 rounded-lg border">
                  <p className="text-2xl font-bold">23</p>
                  <p className="text-sm text-muted-foreground">שיחות החודש</p>
                  <p className="text-xs text-muted-foreground">מתוך 50</p>
                </div>
                <div className="text-center p-4 rounded-lg border">
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-sm text-muted-foreground">נציגים פעילים</p>
                  <p className="text-xs text-muted-foreground">מתוך 3 (חריגה!)</p>
                </div>
                <div className="text-center p-4 rounded-lg border">
                  <p className="text-2xl font-bold">14</p>
                  <p className="text-sm text-muted-foreground">ימים נותרו</p>
                  <p className="text-xs text-muted-foreground">בניסיון חינם</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">היסטוריית חיובים</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-4">
                אין חיובים עדיין - אתם בתקופת ניסיון
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">חיבור מרכזיה (PBX)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                העתיקו את כתובת ה-Webhook למרכזיה שלכם. תומכים ב-Voicenter, 3CX, Yeastar,
                Grandstream, Twilio, Vonage, CloudTalk ועוד.
              </p>
              <div>
                <label className="text-sm font-medium mb-1 block">Webhook URL</label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigator.clipboard.writeText(webhookUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">מיפוי שלוחות</label>
                <p className="text-xs text-muted-foreground mb-2">
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
                        className="w-24"
                        placeholder="שלוחה"
                      />
                      <Input
                        defaultValue={mapping.name}
                        className="flex-1"
                        placeholder="שם נציג"
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm">
                    + הוסף שלוחה
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">מרכזיות מחוברות</h4>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Badge className="bg-green-100 text-green-800">פעיל</Badge>
                  <div>
                    <p className="text-sm font-medium">Voicenter</p>
                    <p className="text-xs text-muted-foreground">
                      חובר ב-15/03/2026 | 23 שיחות הועברו
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">אינטגרציות נוספות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { name: 'Google Drive', description: 'סנכרון הקלטות מ-Google Drive', active: false },
                  { name: 'Slack', description: 'התראות על שיחות חדשות', active: false },
                  { name: 'HubSpot', description: 'סנכרון עם CRM', active: false },
                  { name: 'Monday.com', description: 'יצירת פריטים אוטומטית', active: false },
                ].map((integration) => (
                  <div
                    key={integration.name}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="text-sm font-medium">{integration.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {integration.description}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      חבר
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
