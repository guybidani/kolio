'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Avatar className="h-12 w-12">
          <AvatarFallback className="text-lg">
            {MOCK_REP.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{MOCK_REP.name}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>שלוחה {MOCK_REP.extension}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>{MOCK_REP.phone}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>{MOCK_REP.totalCalls} שיחות</span>
          </div>
        </div>
        <ScoreBadge score={MOCK_REP.avgScore} size="lg" showLabel />
      </div>

      {/* Score breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              ציון כולל
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-5xl font-bold mb-2">{MOCK_REP.avgScore.toFixed(1)}</div>
            <div className="flex items-center justify-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-600">+{MOCK_REP.trend.toFixed(1)} מהשבוע שעבר</span>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">פירוט ציונים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scoreCategories.map((cat) => (
              <div key={cat.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{cat.label}</span>
                  <span className="font-medium">{cat.score.toFixed(1)}</span>
                </div>
                <Progress value={cat.score * 10} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-green-700">
              <Award className="h-4 w-4" />
              חוזקות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {MOCK_REP.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mt-0.5">
                    +
                  </Badge>
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-4 w-4" />
              נקודות לשיפור
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {MOCK_REP.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 mt-0.5">
                    !
                  </Badge>
                  {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recent Calls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4" />
            שיחות אחרונות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MOCK_REP.recentCalls.map((call) => (
            <CallCard key={call.id} {...call} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
