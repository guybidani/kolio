import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { openai } from '@/lib/openai'

// Rate limiter: 10 evaluations per user per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 60_000
const RATE_LIMIT_MAX = 10

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

const EVALUATION_PROMPT = `אתה מומחה לאימון מכירות בישראל. אתה מנתח שיחת תרגול בין נציג מכירות ל"לקוח" AI.

נתח את השיחה ותן ציונים ומשוב מפורט.

## מדדי ציון (1-10 לכל אחד):
1. **discovery** - גילוי צרכים: האם הנציג שאל שאלות פתוחות? הבין את המצב? חפר לעומק?
2. **objection_handling** - טיפול בהתנגדויות: האם הנציג טיפל בהתנגדויות בצורה אפקטיבית?
3. **closing** - סגירה: האם הנציג קידם את השיחה לשלב הבא? ביקש החלטה?
4. **rapport** - ראפור: האם הנציג בנה קשר אישי? היה אמפתי?
5. **value_communication** - תקשורת ערך: האם הנציג הסביר את הערך ולא רק תכונות?

## מדד כולל (overall)
ממוצע משוקלל. שיחה שהנציג שולט בה ומקדם אותה = ציון גבוה. שיחה שהלקוח שולט בה = ציון נמוך.

## כללי ציון
- 1-3: ביצוע חלש, חסרים יסודות
- 4-5: צריך עבודה, יש בסיס
- 6-7: סולידי, יש מקום לשיפור
- 8-9: חזק מאוד
- 10: מושלם

החזר JSON בפורמט הבא:
{
  "scores": {
    "overall": number,
    "discovery": number,
    "objection_handling": number,
    "closing": number,
    "rapport": number,
    "value_communication": number
  },
  "strengths": ["string - נקודות חוזק ספציפיות עם ציטוטים מהשיחה"],
  "improvements": ["string - נקודות לשיפור ספציפיות עם ציטוט מה נאמר + מה היה עדיף לומר"],
  "summary": "string - סיכום קצר של הביצוע ב-2-3 משפטים",
  "bestMoment": "string - הרגע הכי טוב בשיחה",
  "worstMoment": "string - הרגע שהכי צריך שיפור"
}

כל הטקסט בעברית. ספציפי, לא גנרי. ציטוט מהשיחה בכל נקודה.`

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

    const practiceSession = await db.practiceSession.findUnique({
      where: { id },
    })

    if (!practiceSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    if (practiceSession.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mark as complete if not already
    if (!practiceSession.isComplete) {
      await db.practiceSession.update({
        where: { id },
        data: { isComplete: true },
      })
    }

    // If already evaluated, return cached
    if (practiceSession.evaluation) {
      return NextResponse.json({
        evaluation: practiceSession.evaluation,
        overallScore: practiceSession.overallScore,
      })
    }

    const messages = (practiceSession.messages as unknown as PracticeMessage[]) || []

    // Build conversation text
    let conversationText = `תרחיש: ${practiceSession.scenario} | רמת קושי: ${practiceSession.difficulty}\n\n`
    for (const msg of messages) {
      const speaker = msg.role === 'user' ? 'נציג' : 'לקוח'
      conversationText += `${speaker}: ${msg.content}\n\n`
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EVALUATION_PROMPT },
        { role: 'user', content: conversationText },
      ],
    })

    const content = response.choices[0]?.message?.content || '{}'
    let evaluation: Record<string, unknown>

    try {
      evaluation = JSON.parse(content)
    } catch {
      evaluation = { error: 'Failed to parse evaluation', raw: content }
    }

    const overallScore = (evaluation.scores as Record<string, number>)?.overall || null

    // Save evaluation
    await db.practiceSession.update({
      where: { id },
      data: {
        evaluation: JSON.parse(JSON.stringify(evaluation)),
        overallScore,
        isComplete: true,
      },
    })

    return NextResponse.json({ evaluation, overallScore })
  } catch (error) {
    console.error('Error evaluating practice session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
