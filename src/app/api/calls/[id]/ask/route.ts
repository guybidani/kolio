import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { openai } from '@/lib/openai'
import { canAccessCall } from '@/lib/permissions'

// In-memory rate limiter: 20 questions per user per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 20

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

const ASK_SYSTEM_PROMPT = `אתה עוזר AI שמנתח תמלולי שיחות מכירה. ענה על שאלת המשתמש בהתבסס אך ורק על תוכן התמלול.
ענה בעברית. היה תמציתי וספציפי.
אם התשובה לא נמצאת בתמלול, אמור זאת בבירור.
אל תמציא מידע שלא מופיע בתמלול.`

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit check
    if (!checkRateLimit(session.id)) {
      return NextResponse.json(
        { error: 'הגעת למגבלת השאלות (20 לשעה). נסה שוב מאוחר יותר.' },
        { status: 429 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { question } = body

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    if (question.length > 500) {
      return NextResponse.json({ error: 'Question too long (max 500 characters)' }, { status: 400 })
    }

    // Fetch user for RBAC
    const user = await db.user.findUnique({
      where: { id: session.id },
      include: { repProfile: { select: { id: true } } },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch call with transcript
    const call = await db.call.findFirst({
      where: { id, orgId: user.orgId },
      select: {
        id: true,
        orgId: true,
        repId: true,
        status: true,
        transcriptText: true,
      },
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    // RBAC check
    const rbacUser = {
      id: user.id,
      role: user.role,
      orgId: user.orgId,
      isAdmin: user.isAdmin,
      repProfileId: user.repProfile?.id ?? null,
    }
    if (!canAccessCall(rbacUser, call)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (call.status !== 'COMPLETE') {
      return NextResponse.json({ error: 'Call analysis not complete' }, { status: 400 })
    }

    if (!call.transcriptText) {
      return NextResponse.json({ error: 'No transcript available for this call' }, { status: 400 })
    }

    // Send to GPT-4o
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
        { role: 'system', content: ASK_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `תמלול השיחה:\n---\n${call.transcriptText}\n---\n\nשאלה: ${question.trim()}`,
        },
      ],
    })

    const answer = response.choices[0]?.message?.content || 'לא הצלחתי לענות על השאלה.'

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('Error in ask call:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
