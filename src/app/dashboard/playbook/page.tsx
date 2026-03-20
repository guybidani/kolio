'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Search,
  MessageSquare,
  Lightbulb,
  Target,
  Star,
} from 'lucide-react'

const MOCK_PLAYBOOK = {
  name: 'Playbook ראשי - סוכנות דיגיטל',
  stages: [
    { name: 'פתיחה וראפור', tips: ['לפתוח עם משהו אישי', 'להתייחס לעסק שלהם', 'לא לקפוץ ישר למכירה'] },
    { name: 'דיסקברי', tips: ['שאלות מצב: איך מקבלים לקוחות היום?', 'שאלות בעיה: מה לא עובד?', 'שאלות השלכה: מה קורה אם זה נמשך?'] },
    { name: 'הצגת פתרון', tips: ['להתאים את ההצעה לכאב הספציפי', 'להביא case study רלוונטי', 'להדגיש ROI'] },
    { name: 'טיפול בהתנגדויות', tips: ['לא להילחם - להקשיב', 'לחזור על ההתנגדות', 'לתת תשובה ספציפית'] },
    { name: 'סגירה', tips: ['לסכם את הערך', 'להציע שני אופציות', 'ליצור urgency אמיתי'] },
  ],
  objectionBank: [
    {
      objection: 'יקר לי',
      type: 'price',
      bestResponse: 'בוא נחשב ביחד - כמה שווה לקוח חדש בשבילך? אם מדברים על 5 לקוחות חדשים בחודש לפי X שקל כל אחד, ההשקעה חוזרת תוך שבועיים.',
      effectiveness: 92,
      usedCount: 34,
    },
    {
      objection: 'אני צריך לחשוב על זה',
      type: 'timing',
      bestResponse: 'מה בדיוק אתה צריך לחשוב עליו? אם זה נושא של תקציב, בוא נסתכל ביחד מה הגיוני. אם זה עניין של אמון - אני יכול לחבר אותך עם לקוח שלנו שהתחיל בדיוק מאותה נקודה.',
      effectiveness: 78,
      usedCount: 56,
    },
    {
      objection: 'עבדתי עם סוכנות קודמת ולא היה טוב',
      type: 'past_experience',
      bestResponse: 'אני מבין למה אתה מהסס. מה בדיוק לא עבד? כי אצלנו זה שונה ב-3 דברים ספציפיים...',
      effectiveness: 85,
      usedCount: 21,
    },
    {
      objection: 'אני צריך להתייעץ עם השותף/אשתי',
      type: 'authority',
      bestResponse: 'בהחלט, זו החלטה חשובה. מה אם נקבע שיחה קצרה יחד איתו/איתה? ככה אני יכול לענות גם על השאלות שלו/שלה.',
      effectiveness: 71,
      usedCount: 18,
    },
  ],
  topTechniques: [
    {
      technique: 'פתיחה עם התייחסות לאינסטגרם של הלקוח',
      repName: 'יוסי אברהם',
      successRate: 89,
      quote: 'אני רואה שיש לך עבודות מהממות באינסטגרם, את יודעת שיש דרך להפוך את זה ללקוחות?',
    },
    {
      technique: 'שימוש במספרים ספציפיים של לקוחות דומים',
      repName: 'גיא בידני',
      successRate: 84,
      quote: 'יש לנו קוסמטיקאית שעברה מ-3 ל-12 לקוחות בשבוע תוך 3 חודשים',
    },
    {
      technique: 'הפיכת מחיר לעלות ללקוח',
      repName: 'מיכל דוד',
      successRate: 76,
      quote: 'בוא נחלק את ה-2000 שקל ב-15 לקוחות חדשים - זה 133 שקל ללקוח. כמה שווה לך לקוח?',
    },
  ],
}

export default function PlaybookPage() {
  const [search, setSearch] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Playbook</h1>
          <p className="text-white/40">
            {MOCK_PLAYBOOK.name} - טכניקות ותגובות שנלמדו מהשיחות
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
          <Plus className="h-4 w-4 ml-2" />
          הוסף טכניקה
        </Button>
      </div>

      <Tabs defaultValue="stages">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="stages" className="data-[state=active]:bg-white/10">
            <Target className="h-4 w-4 ml-1" />
            שלבי מכירה
          </TabsTrigger>
          <TabsTrigger value="objections" className="data-[state=active]:bg-white/10">
            <MessageSquare className="h-4 w-4 ml-1" />
            בנק התנגדויות
          </TabsTrigger>
          <TabsTrigger value="techniques" className="data-[state=active]:bg-white/10">
            <Star className="h-4 w-4 ml-1" />
            טכניקות מנצחות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="mt-6">
          <div className="space-y-4">
            {MOCK_PLAYBOOK.stages.map((stage, i) => (
              <div key={i} className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
                <div className="p-5 pb-3">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full w-6 h-6 p-0 flex items-center justify-center bg-indigo-500/15 text-indigo-400 border-indigo-500/20">
                      {i + 1}
                    </Badge>
                    {stage.name}
                  </h3>
                </div>
                <div className="px-5 pb-5">
                  <ul className="space-y-2">
                    {stage.tips.map((tip, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span className="text-white/60">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="objections" className="mt-6 space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              placeholder="חיפוש התנגדות..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          {MOCK_PLAYBOOK.objectionBank
            .filter((o) => !search || o.objection.includes(search) || o.bestResponse.includes(search))
            .map((obj, i) => (
              <div key={i} className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-white">
                        &ldquo;{obj.objection}&rdquo;
                      </h3>
                      <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-white/50">
                        {obj.type}
                      </Badge>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-emerald-400 mb-1">
                        תגובה מומלצת:
                      </p>
                      <p className="text-sm text-emerald-300/80">{obj.bestResponse}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/30">
                      <span>שימושים: {obj.usedCount}</span>
                      <span>הצלחה: {obj.effectiveness}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </TabsContent>

        <TabsContent value="techniques" className="mt-6 space-y-4">
          {MOCK_PLAYBOOK.topTechniques.map((tech, i) => (
            <div key={i} className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm text-white">{tech.technique}</h3>
                  <p className="text-xs text-white/40 mt-1">
                    נציג: {tech.repName} | הצלחה: {tech.successRate}%
                  </p>
                  {tech.quote && (
                    <blockquote className="mt-2 border-r-2 border-amber-500/40 pr-3 text-sm italic text-white/50">
                      &ldquo;{tech.quote}&rdquo;
                    </blockquote>
                  )}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
