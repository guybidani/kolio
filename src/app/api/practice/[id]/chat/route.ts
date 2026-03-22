import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { openai } from '@/lib/openai'

// Rate limiter: 30 messages per user per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 10 * 60_000
const RATE_LIMIT_MAX = 30

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT_MAX
}

interface PracticeMessage {
  role: 'user' | 'buyer'
  content: string
  timestamp: string
}

const SCENARIOS: Record<string, string> = {
  discovery: `אתה בעל עסק ישראלי שמקבל שיחת גילוי מנציג מכירות של סוכנות שיווק דיגיטלי. יש לך עסק פעיל (תבחר תחום - קוסמטיקה, קבלנות, ייעוץ, נדל"ן, עריכת דין, או כל תחום אחר). אתה לא בטוח שאתה צריך שירותי שיווק. תן לנציג לנסות להבין את המצב שלך.`,
  demo: `אתה בעל עסק שכבר עבר שיחת גילוי עם סוכנות שיווק דיגיטלי ועכשיו רואה הדגמה. שאל שאלות טכניות, בקש דוגמאות, ותבדוק אם זה מתאים לעסק שלך.`,
  closing: `אתה בעל עסק שכבר ראה הדגמה מסוכנות שיווק דיגיטלי ואתה בשלב סגירה. אתה מעוניין אבל יש לך התלבטויות אחרונות.`,
  'objection-handling': `אתה בעל עסק שמלא התנגדויות כלפי סוכנות שיווק דיגיטלי. תעלה התנגדויות שונות - מחיר, תזמון, אמון, סמכות, תחרות.`,
}

const DIFFICULTY_BEHAVIORS: Record<string, string> = {
  easy: `אתה לקוח נחמד ופתוח. אתה מקשיב, שואל שאלות, ומשתף מידע. אתה מעלה התנגדות אחת קלה. אם הנציג טוב - אתה מתקדם.`,
  medium: `אתה לקוח סקפטי אבל הוגן. לא נותן מידע בקלות, מעלה 2-3 התנגדויות, לפעמים מסיח. צריך לשמוע תשובות טובות.`,
  hard: `אתה לקוח קשוח מאוד. קוטע, מזלזל, מעלה התנגדויות חזקות, משווה למתחרים, לוחץ על מחיר. רק נציג מעולה יצליח איתך. אגרסיבי אבל לא גס.`,
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!checkRateLimit(session.id)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { id } = await params
    const body = await req.json()
    const { message } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const practiceSession = await db.practiceSession.findUnique({
      where: { id },
    })

    if (!practiceSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    if (practiceSession.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (practiceSession.isComplete) {
      return NextResponse.json({ error: 'Session is already complete' }, { status: 400 })
    }

    // Get org playbook for objections
    const playbook = await db.playbook.findFirst({
      where: { orgId: session.orgId, isActive: true },
      orderBy: { isDefault: 'desc' },
    })

    const messages = (practiceSession.messages as unknown as PracticeMessage[]) || []
    const exchangeCount = messages.filter((m) => m.role === 'user').length

    // Add user message
    messages.push({
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    })

    // Build objection context from playbook
    let objectionContext = ''
    if (playbook) {
      const objections = Array.isArray(playbook.objectionBank) ? playbook.objectionBank : []
      if (objections.length > 0) {
        objectionContext = `\n\nהנה התנגדויות אמיתיות מהפלייבוק של הארגון. השתמש בהן באופן טבעי:\n`
        for (const obj of objections.slice(0, 8) as Array<{ objection: string; category?: string }>) {
          objectionContext += `- "${obj.objection}" (${obj.category || 'כללי'})\n`
        }
      }
    }

    // Determine if conversation should wrap up
    const shouldWrapUp = exchangeCount >= 7 // After 8-12 exchanges
    const mustEnd = exchangeCount >= 11

    let wrapUpInstruction = ''
    if (mustEnd) {
      wrapUpInstruction = `\n\nזו ההודעה האחרונה שלך. תסיים את השיחה באופן טבעי - תגיד שאתה צריך לחשוב / ללכת לפגישה / שתחזור אליו.`
    } else if (shouldWrapUp) {
      wrapUpInstruction = `\n\nהשיחה מתקדמת. אם הנציג מתקדם טוב - תתחיל לסגור (חיובית או שלילית בהתאם לביצוע שלו). אם לא - תגיד שאתה צריך ללכת.`
    }

    const systemPrompt = `אתה משחק תפקיד של קונה ישראלי בשיחת מכירות לצורך אימון נציגי מכירות.

## התפקיד שלך
${SCENARIOS[practiceSession.scenario] || SCENARIOS.discovery}

## רמת קושי
${DIFFICULTY_BEHAVIORS[practiceSession.difficulty] || DIFFICULTY_BEHAVIORS.medium}

## כללים חשובים
1. דבר עברית ישראלית טבעית, כמו בעל עסק אמיתי. לא פורמלי, לא ספרותי.
2. תשובות קצרות וטבעיות (1-3 משפטים בדרך כלל). לא מונולוגים.
3. אל תצא מהתפקיד. אתה הלקוח, לא מאמן מכירות.
4. תגיב לגוף מה שהנציג אומר, לא באופן גנרי.
5. אם הנציג אומר משהו טוב - תגיב חיובית. אם אומר משהו חלש - תלחץ.
6. השתמש בביטויים ישראליים: "תשמע", "בוא נגיד", "אחי", "בסדר", "מה אתה אומר", "נו", "יאללה"
7. לפעמים תקטע את הנציג באמצע, כמו בשיחה אמיתית.
${objectionContext}${wrapUpInstruction}`

    // Build chat messages for GPT
    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ]

    for (const msg of messages) {
      chatMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 300,
      temperature: 0.8,
      messages: chatMessages,
    })

    const reply = response.choices[0]?.message?.content || 'טוב, אני צריך ללכת. נדבר.'
    const isComplete = mustEnd

    // Add buyer reply
    messages.push({
      role: 'buyer',
      content: reply,
      timestamp: new Date().toISOString(),
    })

    // Update session
    await db.practiceSession.update({
      where: { id },
      data: {
        messages: JSON.parse(JSON.stringify(messages)),
        isComplete,
      },
    })

    return NextResponse.json({
      reply,
      isComplete,
      exchangeCount: exchangeCount + 1,
    })
  } catch (error) {
    console.error('Error in practice chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
