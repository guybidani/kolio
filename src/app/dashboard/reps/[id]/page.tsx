'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScoreBadge } from '@/components/dashboard/score-badge'
import { CallCard } from '@/components/dashboard/call-card'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRight,
  Phone,
  TrendingUp,
  Target,
  Award,
  AlertCircle,
} from 'lucide-react'

const MOCK_REP = {
  id: 'rep-1',
  name: 'יוסי אברהם',
  phone: '050-1234567',
  extension: '101',
  totalCalls: 52,
  avgScore: 8.1,
  scores: {
    discovery: 8.5,
    closing: 7.8,
    objection_handling: 8.0,
    rapport: 8.4,
    value_communication: 7.9,
  },
  trend: 1.2,
  strengths: ['דיסקברי מעולה - שואל שאלות עומק', 'בניית ראפור טבעית', 'שימוש ב-social proof'],
  weaknesses: ['לפעמים מדלג על שאלות השלכה', 'סגירה יכולה להיות אסרטיבית יותר'],
  recentCalls: [
    {
      id: 'call-1',
      prospectName: 'דני כהן',
      prospectBusiness: 'קוסמטיקאית',
      repName: 'יוסי אברהם',
      overallScore: 8.5,
      status: 'COMPLETE',
      direction: 'OUTBOUND',
      duration: 480,
      recordedAt: new Date().toISOString(),
      summary: 'שיחת מכירה מצוינת - נסגר על חבילת Classic.',
    },
    {
      id: 'call-2',
      prospectName: 'אבי גולן',
      prospectBusiness: 'עורך דין',
      repName: 'יוסי אברהם',
      overallScore: 8.7,
      status: 'COMPLETE',
      direction: 'OUTBOUND',
      duration: 720,
      recordedAt: new Date(Date.now() - 86400000).toISOString(),
      summary: 'שיחת סגירה - הלקוח חתם על Premium.',
    },
    {
      id: 'call-3',
      prospectName: 'רותי מזרחי',
      prospectBusiness: 'מאמנת כושר',
      repName: 'יוסי אברהם',
      overallScore: 7.2,
      status: 'COMPLETE',
      direction: 'INBOUND',
      duration: 300,
      recordedAt: new Date(Date.now() - 172800000).toISOString(),
      summary: 'ליד נכנס - נקבעה פגישת המשך.',
    },
  ],
  weeklyScores: [7.5, 7.8, 8.0, 7.9, 8.1, 8.3, 8.1],
}

const scoreCategories = [
  { key: 'discovery', label: 'דיסקברי', score: MOCK_REP.scores.discovery },
  { key: 'closing', label: 'סגירה', score: MOCK_REP.scores.closing },
  { key: 'objection_handling', label: 'התנגדויות', score: MOCK_REP.scores.objection_handling },
  { key: 'rapport', label: 'ראפור', score: MOCK_REP.scores.rapport },
  { key: 'value_communication', label: 'העברת ערך', score: MOCK_REP.scores.value_communication },
]

export default function RepDetailPage() {
  const params = useParams()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reps">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Avatar className="h-12 w-12">
          <AvatarFallback className="text-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
            {MOCK_REP.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{MOCK_REP.name}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>שלוחה {MOCK_REP.extension}</span>
            <Separator orientation="vertical" className="h-4 bg-muted" />
            <span>{MOCK_REP.phone}</span>
            <Separator orientation="vertical" className="h-4 bg-muted" />
            <span>{MOCK_REP.totalCalls} שיחות</span>
          </div>
        </div>
        <ScoreBadge score={MOCK_REP.avgScore} size="lg" showLabel />
      </div>

      {/* Score breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-5 sm:col-span-2 lg:col-span-1 text-center">
          <h3 className="text-base font-semibold text-foreground flex items-center justify-center gap-2 mb-4">
            <Target className="h-4 w-4 text-indigo-400" />
            ציון כולל
          </h3>
          <div className="text-5xl font-bold text-foreground mb-2">{MOCK_REP.avgScore.toFixed(1)}</div>
          <div className="flex items-center justify-center gap-1 text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-400">+{MOCK_REP.trend.toFixed(1)} מהשבוע שעבר</span>
          </div>
        </div>

        <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-5 sm:col-span-2">
          <h3 className="text-base font-semibold text-foreground mb-4">פירוט ציונים</h3>
          <div className="space-y-4">
            {scoreCategories.map((cat) => (
              <div key={cat.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{cat.label}</span>
                  <span className="font-medium text-foreground">{cat.score.toFixed(1)}</span>
                </div>
                <Progress value={cat.score * 10} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 overflow-hidden">
          <div className="p-5 pb-3">
            <h3 className="text-base font-semibold text-emerald-400 flex items-center gap-2">
              <Award className="h-4 w-4" />
              חוזקות
            </h3>
          </div>
          <div className="px-5 pb-5">
            <ul className="space-y-2">
              {MOCK_REP.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mt-0.5">
                    +
                  </Badge>
                  <span className="text-foreground/70">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl bg-orange-500/5 border border-orange-500/20 overflow-hidden">
          <div className="p-5 pb-3">
            <h3 className="text-base font-semibold text-orange-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              נקודות לשיפור
            </h3>
          </div>
          <div className="px-5 pb-5">
            <ul className="space-y-2">
              {MOCK_REP.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 mt-0.5">
                    !
                  </Badge>
                  <span className="text-foreground/70">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Calls */}
      <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Phone className="h-4 w-4 text-indigo-400" />
            שיחות אחרונות
          </h3>
        </div>
        <div className="px-5 pb-5 space-y-3">
          {MOCK_REP.recentCalls.map((call) => (
            <CallCard key={call.id} {...call} />
          ))}
        </div>
      </div>
    </div>
  )
}
