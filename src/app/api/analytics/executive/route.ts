import { NextResponse } from 'next/server'

// Mock data for executive dashboard - realistic looking data
// In production, this would query Call + Rep tables with aggregations

function generateWeeklyData(weeks: number) {
  const data = []
  const now = new Date()
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i * 7)
    const weekLabel = `${date.getDate()}/${date.getMonth() + 1}`
    data.push({
      week: weekLabel,
      score: Math.round((60 + Math.random() * 25 + (weeks - i) * 0.8) * 10) / 10,
      calls: Math.floor(30 + Math.random() * 40 + (weeks - i) * 1.5),
    })
  }
  return data
}

function generateMockData() {
  const weeklyData = generateWeeklyData(12)
  const currentMonth = weeklyData.slice(-4)
  const lastMonth = weeklyData.slice(-8, -4)

  const currentCalls = currentMonth.reduce((s, w) => s + w.calls, 0)
  const lastMonthCalls = lastMonth.reduce((s, w) => s + w.calls, 0)
  const callsChange = lastMonthCalls > 0
    ? Math.round(((currentCalls - lastMonthCalls) / lastMonthCalls) * 100)
    : 0

  const currentAvgScore = Math.round(
    (currentMonth.reduce((s, w) => s + w.score, 0) / currentMonth.length) * 10
  ) / 10
  const lastMonthAvgScore = Math.round(
    (lastMonth.reduce((s, w) => s + w.score, 0) / lastMonth.length) * 10
  ) / 10
  const scoreChange = Math.round((currentAvgScore - lastMonthAvgScore) * 10) / 10

  const reps = [
    {
      id: 'rep-1',
      name: 'יוסי אברהם',
      callsThisMonth: 52,
      avgScore: 81,
      trend: 'up' as const,
      trendValue: 5.2,
      topStrength: 'טיפול בהתנגדויות',
      biggestGap: 'שאלות גילוי',
    },
    {
      id: 'rep-2',
      name: 'גיא בידני',
      callsThisMonth: 45,
      avgScore: 78,
      trend: 'up' as const,
      trendValue: 3.1,
      topStrength: 'סגירת עסקאות',
      biggestGap: 'הקשבה אקטיבית',
    },
    {
      id: 'rep-3',
      name: 'מיכל דוד',
      callsThisMonth: 38,
      avgScore: 69,
      trend: 'down' as const,
      trendValue: -2.4,
      topStrength: 'בניית קרבה',
      biggestGap: 'הצגת ערך',
    },
    {
      id: 'rep-4',
      name: 'נועה שמיר',
      callsThisMonth: 29,
      avgScore: 62,
      trend: 'up' as const,
      trendValue: 8.0,
      topStrength: 'מעקב',
      biggestGap: 'טיפול בהתנגדויות',
    },
    {
      id: 'rep-5',
      name: 'אלון כהן',
      callsThisMonth: 41,
      avgScore: 45,
      trend: 'down' as const,
      trendValue: -5.3,
      topStrength: 'ידע מוצר',
      biggestGap: 'סגירה',
    },
    {
      id: 'rep-6',
      name: 'דנה רוזן',
      callsThisMonth: 33,
      avgScore: 42,
      trend: 'stable' as const,
      trendValue: 0.2,
      topStrength: 'הקשבה אקטיבית',
      biggestGap: 'טיפול בהתנגדויות',
    },
  ]

  const insights = [
    'שיפור של 15% בטיפול בהתנגדויות השבוע',
    '3 נציגים מתחת לציון 50 - דורשים תשומת לב',
    'זמן שיחה ממוצע ירד ב-2 דקות - בדוק אם נציגים מקצרים',
    'נועה שמיר הראתה את השיפור הגדול ביותר החודש (+8 נקודות)',
    'שיעור הסגירה עלה ל-23% מ-18% בחודש שעבר',
  ]

  const actionItems = [
    { type: 'coach' as const, rep: 'אלון כהן', action: 'אימון על טיפול בהתנגדויות וסגירה' },
    { type: 'review' as const, rep: 'דנה רוזן', action: 'סקירת 5 שיחות אחרונות' },
    { type: 'update' as const, rep: null, action: 'עדכון Playbook להתנגדות "יקר לי"' },
    { type: 'coach' as const, rep: 'מיכל דוד', action: 'בדיקת ירידה בביצועים' },
  ]

  // Radar chart comparison data
  const radarComparison = {
    categories: ['טיפול בהתנגדויות', 'שאלות גילוי', 'הצגת ערך', 'סגירה', 'בניית קרבה', 'הקשבה אקטיבית'],
    thisMonth: [78, 65, 72, 70, 80, 68],
    lastMonth: [63, 62, 68, 65, 75, 70],
  }

  return {
    kpis: {
      totalCallsThisMonth: currentCalls,
      totalCallsLastMonth: lastMonthCalls,
      callsChange,
      avgTeamScore: currentAvgScore,
      avgTeamScoreLastMonth: lastMonthAvgScore,
      scoreChange,
      activeReps: 5,
      totalReps: 6,
      estimatedRevenueImpact: 47500,
      avgDealSize: 2500,
      improvementPercent: 12,
    },
    weeklyData,
    reps,
    insights,
    actionItems,
    radarComparison,
  }
}

export async function GET() {
  try {
    // In production: validate session, query DB with org filter
    // For now, return mock data
    const data = generateMockData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching executive data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
