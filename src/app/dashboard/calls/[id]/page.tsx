'use client'

import { CallPlayer } from '@/components/dashboard/call-player'
import { CoachingPanel } from '@/components/dashboard/coaching-panel'
import { ScoreBadge } from '@/components/dashboard/score-badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRight,
  PhoneOutgoing,
  Clock,
  User,
  Building2,
} from 'lucide-react'
import Link from 'next/link'
import type { CallAnalysis } from '@/types'

// Mock data for development
const MOCK_ANALYSIS: CallAnalysis = {
  call_metadata: {
    prospect_name: 'דני כהן',
    prospect_business: 'קוסמטיקאית - Beauty by Dani',
    prospect_tier: 'classic',
    estimated_media_budget: '2,000-2,500 שח',
    call_duration_estimate: 'medium',
    decision_maker: true,
    other_stakeholders: null,
  },
  summary: {
    prospect_needs: 'צריכה יותר לקוחות חדשים, כרגע מקבלת לידים רק מהמלצות',
    what_was_offered: 'ניהול קמפיינים בפייסבוק ואינסטגרם + בוט ווטסאפ בסיסי',
    what_was_agreed: 'נקבעה פגישת המשך ליום רביעי עם הצעת מחיר',
    current_marketing: 'פרסום אורגני באינסטגרם בלבד, ללא מודעות ממומנות',
  },
  scores: {
    overall: 7.5,
    discovery: 8,
    objection_handling: 6,
    closing: 7,
    rapport: 9,
    value_communication: 7,
  },
  scores_reasoning:
    'הנציג בנה ראפור מצוין והשקיע בדיסקברי. טיפול בהתנגדות המחיר היה חלקי - היה אפשר להעמיק יותר.',
  buying_signals: [
    {
      signal: 'שאלה על לוחות זמנים - "כמה זמן לוקח להתחיל לראות תוצאות?"',
      interpretation: 'מעוניינת להתקדם, חושבת על תוצאות',
      was_leveraged: true,
      how_to_leverage: 'נוצל טוב - ניתנה תשובה עם ציפיות ריאליסטיות',
    },
  ],
  objections_detected: [
    {
      objection: 'אני צריכה לחשוב על זה',
      type: 'timing',
      how_handled: 'הנציג אמר בסדר ונקבעה פגישת המשך',
      effectiveness: 'partially_effective',
      suggested_response:
        'מה בדיוק את צריכה לחשוב עליו? אם זה נושא התקציב, בואי נסתכל ביחד על המספרים ונראה מה הגיוני בשבילך',
    },
  ],
  pain_points: [
    {
      pain: 'תלויה רק בהמלצות, אין שליטה על כמות הלקוחות',
      explicit: true,
      was_deepened: true,
      deepening_suggestion:
        'מה קורה בחודשים שאין המלצות? כמה הכנסה את מפסידה בממוצע?',
    },
  ],
  retention_points: [
    {
      what: 'פתיחה אישית מצוינת - התחבר לעולם שלה',
      when_in_call: 'פתיחת השיחה',
      why_effective:
        'יצר חיבור אישי שגרם ללקוחה להרגיש שהנציג מבין את העולם שלה',
      quote: 'אני רואה שיש לך עבודות מהממות באינסטגרם, את יודעת שיש דרך להפוך את זה ללקוחות?',
      playbook_worthy: true,
    },
    {
      what: 'שימוש ב-social proof רלוונטי',
      when_in_call: 'הצגת הפתרון',
      why_effective: 'הביא דוגמה של קוסמטיקאית אחרת שהצליחה - רלוונטי מאוד',
      quote: null,
      playbook_worthy: false,
    },
  ],
  improvement_points: [
    {
      what: 'טיפול בהתנגדות "צריכה לחשוב" היה חלש',
      when_in_call: 'סגירה',
      current_behavior: 'הסכים מיד ונקבעה פגישה',
      suggested_behavior: 'לשאול מה בדיוק צריכה לחשוב עליו ולטפל בחסם',
      quote_current: 'בסדר, תחשבי ונתקשר ביום רביעי',
      quote_suggested:
        'מה בדיוק את צריכה לחשוב עליו? אם זה נושא התקציב, בואי נסתכל ביחד על המספרים',
      impact: 'high',
    },
    {
      what: 'לא נשאלו שאלות השלכה',
      when_in_call: 'דיסקברי',
      current_behavior: 'עבר ישר מבעיה לפתרון',
      suggested_behavior: 'להעמיק את הכאב לפני שמציגים פתרון',
      quote_current: null,
      quote_suggested:
        'מה קורה בחודש שאין המלצות? כמה לקוחות את מפסידה? מה זה עושה להכנסה החודשית?',
      impact: 'medium',
    },
  ],
  next_call_prep: {
    recommended_callback: 'יום רביעי, 10:00 בבוקר',
    opening_line:
      'היי דני, זה גיא. דיברנו ביום ראשון על הקמפיינים. הכנתי לך הצעה מותאמת בדיוק למה שדיברנו עליו.',
    key_points_to_address: [
      'להביא מקרה מבחן של קוסמטיקאית עם מספרים',
      'לטפל מראש בנושא התקציב',
      'להציג את הבוט כבונוס',
    ],
    materials_to_prepare: [
      'הצעת מחיר מותאמת',
      'מקרה מבחן עם תוצאות',
      'דוגמאות מודעות',
    ],
    objections_to_preempt: [
      'מחיר - להכין השוואה לעלות לקוח חדש',
      'זמן - להסביר שהניהול הוא מלא, לא דורש ממנה זמן',
    ],
    closing_strategy:
      'לסגור על תקופת ניסיון של חודש עם KPIs ברורים. להציע ויתור על דמי הקמה.',
  },
  missed_opportunities: [
    'לא שאל על תקציב שיווק נוכחי',
    'לא הזכיר שבוט ווטסאפ יכול לסנן לידים',
  ],
  spin_analysis: {
    situation_questions_asked: 'כמה לקוחות בשבוע, איך מקבלת לקוחות היום',
    situation_questions_missing: 'הכנסה חודשית, כמה זמן בתחום',
    problem_questions_asked: 'מה לא עובד בשיווק הנוכחי',
    problem_questions_missing: 'מה קורה כשאין מספיק לקוחות',
    implication_questions_asked: '',
    implication_questions_missing:
      'כמה הכנסה מפסידה, מה קורה אם המצב נמשך עוד שנה',
    need_payoff_questions_asked: 'מה היית עושה עם 5 לקוחות חדשים בשבוע',
    need_payoff_questions_missing: '',
  },
}

const MOCK_UTTERANCES = [
  { speaker: 0, text: 'היי דני, מה שלומך? זה גיא מ-Kolio.', start: 0, end: 3 },
  { speaker: 1, text: 'היי גיא, מה קורה?', start: 3, end: 5 },
  {
    speaker: 0,
    text: 'אני רואה שיש לך עבודות מהממות באינסטגרם, את יודעת שיש דרך להפוך את זה ללקוחות?',
    start: 5,
    end: 12,
  },
  {
    speaker: 1,
    text: 'כן, אני כבר מנסה לפרסם שם אבל בינתיים רוב הלקוחות מגיעים מהמלצות.',
    start: 12,
    end: 18,
  },
  {
    speaker: 0,
    text: 'כמה לקוחות חדשים את מקבלת בשבוע בערך?',
    start: 18,
    end: 22,
  },
  { speaker: 1, text: 'זה משתנה, לפעמים 3-4 לפעמים בקושי אחד.', start: 22, end: 27 },
  {
    speaker: 0,
    text: 'יש לנו קוסמטיקאית שהתחילה איתנו לפני 3 חודשים ועברה מ-3 לקוחות בשבוע ל-12. בדיוק בגלל מודעות ממוקדות.',
    start: 27,
    end: 38,
  },
  { speaker: 1, text: 'וואו, באמת? כמה זמן לוקח להתחיל לראות תוצאות?', start: 38, end: 43 },
  {
    speaker: 0,
    text: 'בדרך כלל תוך שבועיים-שלושה כבר רואים את הלידים הראשונים. אחרי חודש זה כבר יציב.',
    start: 43,
    end: 52,
  },
  { speaker: 1, text: 'אוקיי, נשמע מעניין. כמה זה עולה?', start: 52, end: 56 },
  {
    speaker: 0,
    text: 'לעסק כמו שלך אנחנו ממליצים על חבילה שכוללת ניהול קמפיינים בפייסבוק ואינסטגרם, פלוס בוט ווטסאפ שסוגר לך פגישות אוטומטית.',
    start: 56,
    end: 68,
  },
  { speaker: 1, text: 'אני צריכה לחשוב על זה.', start: 68, end: 71 },
  { speaker: 0, text: 'בסדר, תחשבי ונתקשר ביום רביעי, מתאים?', start: 71, end: 75 },
  { speaker: 1, text: 'כן, בסדר. תודה גיא.', start: 75, end: 78 },
]

export default function CallDetailPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/calls">
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">
            {MOCK_ANALYSIS.call_metadata.prospect_name}
          </h1>
          <div className="flex items-center gap-3 text-sm text-white/40 mt-1">
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {MOCK_ANALYSIS.call_metadata.prospect_business}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              גיא בידני
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-1">
              <PhoneOutgoing className="h-3.5 w-3.5" />
              יוצאת
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              8:00 דק׳
            </span>
          </div>
        </div>
        <ScoreBadge score={MOCK_ANALYSIS.scores.overall} size="lg" showLabel />
      </div>

      {/* Summary Card */}
      <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-base font-semibold text-white">סיכום שיחה</h3>
        </div>
        <div className="px-5 pb-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-white mb-1">צורך הליד</h4>
              <p className="text-sm text-white/50">
                {MOCK_ANALYSIS.summary.prospect_needs}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-1">מה הוצע</h4>
              <p className="text-sm text-white/50">
                {MOCK_ANALYSIS.summary.what_was_offered}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-1">מה סוכם</h4>
              <p className="text-sm text-white/50">
                {MOCK_ANALYSIS.summary.what_was_agreed}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-1">שיווק נוכחי</h4>
              <p className="text-sm text-white/50">
                {MOCK_ANALYSIS.summary.current_marketing}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content: Player + Coaching */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CallPlayer
          audioUrl="/sample.mp3"
          utterances={MOCK_UTTERANCES}
          keyMoments={[
            { time: 5, label: 'פתיחה אישית' },
            { time: 27, label: 'Social Proof' },
            { time: 52, label: 'שאלת מחיר' },
            { time: 68, label: 'התנגדות' },
          ]}
        />
        <CoachingPanel analysis={MOCK_ANALYSIS} />
      </div>
    </div>
  )
}
