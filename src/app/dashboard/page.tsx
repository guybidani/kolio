import { StatsOverview } from '@/components/dashboard/stats-overview'
import { RepLeaderboard } from '@/components/dashboard/rep-leaderboard'
import { CallCard } from '@/components/dashboard/call-card'
import { BadgesDisplay } from '@/components/dashboard/badges'
import { StreaksDisplay } from '@/components/dashboard/streaks'

// Mock data for development - in production, queries hit the real DB
const MOCK_CALLS = [
  {
    id: 'call-1',
    prospectName: 'דני כהן',
    prospectBusiness: 'קוסמטיקאית - Beauty by Dani',
    repName: 'גיא בידני',
    overallScore: 7.5,
    status: 'COMPLETE',
    direction: 'OUTBOUND',
    duration: 480,
    recordedAt: new Date().toISOString(),
    summary: 'שיחת מכירה ראשונה - הלקוחה מתעניינת בניהול קמפיינים לפייסבוק ואינסטגרם. ציינה שעבדה עם סוכנות קודמת ולא הייתה מרוצה.',
  },
  {
    id: 'call-2',
    prospectName: 'שרון לוי',
    prospectBusiness: 'קבלן שיפוצים',
    repName: 'מיכל דוד',
    overallScore: 5.2,
    status: 'COMPLETE',
    direction: 'INBOUND',
    duration: 320,
    recordedAt: new Date(Date.now() - 86400000).toISOString(),
    summary: 'ליד נכנס - מתעניין בבוט לווטסאפ. לא הצלחנו לסגור, צריך לחזור.',
  },
  {
    id: 'call-3',
    prospectName: null,
    prospectBusiness: null,
    repName: 'גיא בידני',
    overallScore: null,
    status: 'TRANSCRIBING',
    direction: 'OUTBOUND',
    duration: 195,
    recordedAt: new Date(Date.now() - 3600000).toISOString(),
    summary: null,
  },
]

const MOCK_REPS = [
  { id: 'rep-1', name: 'גיא בידני', avatarUrl: null, totalCalls: 45, avgScore: 7.8, trend: 0.5 },
  { id: 'rep-2', name: 'מיכל דוד', avatarUrl: null, totalCalls: 38, avgScore: 6.9, trend: -0.2 },
  { id: 'rep-3', name: 'יוסי אברהם', avatarUrl: null, totalCalls: 52, avgScore: 8.1, trend: 1.2 },
  { id: 'rep-4', name: 'נועה שמיר', avatarUrl: null, totalCalls: 29, avgScore: 6.2, trend: 0.8 },
]

// Mock badges data
const MOCK_BADGES = [
  { type: 'FIRST_CALL', name: 'שיחה ראשונה', description: 'העלית את השיחה הראשונה שלך לניתוח', earnedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { type: 'PERFECT_SCORE', name: 'ציון מושלם', description: 'קיבלת ציון 90+ בשיחה', earnedAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { type: 'STREAK_7', name: 'רצף שבועי', description: '7 ימים רצופים של שיחות', earnedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
]

// Mock streaks data
const MOCK_STREAKS = [
  { type: 'DAILY_CALLS', currentCount: 5, bestCount: 12, isAtRisk: false },
  { type: 'HIGH_SCORE', currentCount: 3, bestCount: 8, isAtRisk: false },
]

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">סקירה כללית</h1>
        <p className="text-white/40">ברוכים הבאים ל-Kolio</p>
      </div>

      <StatsOverview
        totalCalls={164}
        avgScore={7.2}
        totalReps={4}
        callsThisWeek={23}
        scoreChange={0.4}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-base font-semibold text-white">שיחות אחרונות</h3>
            </div>
            <div className="px-5 pb-5 space-y-3">
              {MOCK_CALLS.map((call) => (
                <CallCard key={call.id} {...call} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <RepLeaderboard reps={MOCK_REPS} />
          <StreaksDisplay streaks={MOCK_STREAKS} />
        </div>
      </div>

      <BadgesDisplay earned={MOCK_BADGES} />
    </div>
  )
}
