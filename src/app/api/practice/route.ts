import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { openai } from '@/lib/openai'

const SCENARIOS: Record<string, { label: string; systemContext: string }> = {
  discovery: {
    label: 'שיחת גילוי',
    systemContext: `זו שיחת גילוי ראשונית. אתה בעל עסק שמקבל שיחה מנציג מכירות. יש לך עסק פעיל אבל אתה לא בטוח שאתה צריך שירותי שיווק. תן לנציג לנסות להבין את המצב שלך. יש לך כמה כאבים עסקיים אבל אתה לא חושף אותם מיד - רק אם הנציג שואל את השאלות הנכונות.`,
  },
  demo: {
    label: 'הדגמת מוצר',
    systemContext: `זו שיחת הדגמה. אתה כבר עברת שיחת גילוי ועכשיו רוצה לראות מה המוצר יכול לעשות בשבילך. שאל שאלות טכניות, בקש דוגמאות של לקוחות דומים, ותבדוק אם זה באמת מתאים לעסק שלך. אתה מעוניין אבל עדיין סקפטי.`,
  },
  closing: {
    label: 'שיחת סגירה',
    systemContext: `זו שיחת סגירה. אתה כבר ראית הדגמה ואתה מעוניין, אבל יש לך התלבטויות אחרונות - מחיר, תזמון, צריך להתייעץ עם שותף. הנציג צריך לסגור אותך. אם הוא טוב - תסגור. אם לא - תגיד שאתה צריך לחשוב על זה.`,
  },
  'objection-handling': {
    label: 'טיפול בהתנגדויות',
    systemContext: `אתה לקוח שמלא התנגדויות. תעלה התנגדויות אחת אחרי השנייה - מחיר ("יקר לי"), תזמון ("לא עכשיו"), אמון ("עבדתי עם סוכנות שרימתה אותי"), סמכות ("אני צריך לדבר עם השותף"), ותחרות ("קיבלתי הצעה יותר זולה"). תן לנציג להתמודד עם כל התנגדות.`,
  },
}

const DIFFICULTY_PROMPTS: Record<string, string> = {
  easy: `אתה לקוח פתוח ונחמד. אתה מקשיב, עונה על שאלות, ובאופן כללי אתה שיתופי. אתה מעלה התנגדות אחת קלה.`,
  medium: `אתה לקוח סקפטי אבל הוגן. אתה לא נותן מידע בקלות, מעלה 2-3 התנגדויות, ואתה צריך לשמוע תשובות טובות כדי להתקדם. לפעמים אתה מסיח את הנציג.`,
  hard: `אתה לקוח קשוח וסקפטי מאוד. אתה קוטע, מזלזל, מעלה התנגדויות חזקות, משווה למתחרים, לוחץ על מחיר, ולא נותן כלום בקלות. רק נציג מעולה יצליח להתקדם איתך. אתה אגרסיבי אבל לא גס.`,
}

function buildBuyerOpeningMessage(scenario: string, difficulty: string): string {
  switch (scenario) {
    case 'discovery':
      if (difficulty === 'easy') return 'היי, כן, מישהו מהצוות שלכם השאיר לי הודעה. מה בדיוק אתם עושים?'
      if (difficulty === 'hard') return 'שלום, יש לי דקה. מה רצית?'
      return 'היי, אמרו לי שאתם עושים שיווק דיגיטלי. אני מקשיב.'
    case 'demo':
      if (difficulty === 'easy') return 'היי! אחרי השיחה שלנו אני ממש סקרן לראות איך זה עובד.'
      if (difficulty === 'hard') return 'יאללה תראה לי מה יש לכם, אין לי הרבה זמן.'
      return 'היי, דיברנו בשבוע שעבר. אמרת שתראה לי איך המערכת עובדת.'
    case 'closing':
      if (difficulty === 'easy') return 'היי! אז חשבתי על ההצעה שלכם, ובאופן כללי זה נשמע טוב. יש לי עוד כמה שאלות.'
      if (difficulty === 'hard') return 'שמע, אני עדיין לא משוכנע. קיבלתי הצעה מסוכנות אחרת שהרבה יותר זולה.'
      return 'היי, אז אני חושב על זה... יש כמה דברים שאני צריך להבין לפני שאני מחליט.'
    case 'objection-handling':
      if (difficulty === 'easy') return 'היי, בוא נדבר. יש לי כמה חששות שאני רוצה לשתף.'
      if (difficulty === 'hard') return 'תשמע, אני אגיד לך את האמת - שרפתי כסף על שיווק דיגיטלי ואני לא מאמין לאף אחד יותר.'
      return 'היי, אז הנה הבעיה שלי - עבדתי עם סוכנות בעבר ולא ראיתי תוצאות. למה אתם שונים?'
    default:
      return 'שלום, במה מדובר?'
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow REP, MANAGER, ADMIN roles
    if (!['REP', 'MANAGER', 'ADMIN', 'CEO'].includes(session.role) && !session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { scenario, difficulty } = body

    if (!scenario || !SCENARIOS[scenario]) {
      return NextResponse.json({ error: 'Invalid scenario' }, { status: 400 })
    }
    if (!difficulty || !DIFFICULTY_PROMPTS[difficulty]) {
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
    }

    // Get org playbook for realistic objections
    const playbook = await db.playbook.findFirst({
      where: { orgId: session.orgId, isActive: true },
      orderBy: { isDefault: 'desc' },
    })

    const openingMessage = buildBuyerOpeningMessage(scenario, difficulty)

    const messages = [
      {
        role: 'buyer',
        content: openingMessage,
        timestamp: new Date().toISOString(),
      },
    ]

    const practiceSession = await db.practiceSession.create({
      data: {
        orgId: session.orgId,
        userId: session.id,
        scenario,
        difficulty,
        messages: JSON.parse(JSON.stringify(messages)),
      },
    })

    return NextResponse.json({
      id: practiceSession.id,
      scenario,
      difficulty,
      messages,
      playbookName: playbook?.name || null,
    })
  } catch (error) {
    console.error('Error creating practice session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)

    const sessions = await db.practiceSession.findMany({
      where: { orgId: session.orgId, userId: session.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        scenario: true,
        difficulty: true,
        isComplete: true,
        overallScore: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching practice sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
