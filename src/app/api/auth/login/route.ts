import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createToken, getSessionCookieOptions } from '@/lib/auth'

export const runtime = 'nodejs'

// In-memory rate limiter: max 5 attempts per email per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX = 5

function checkLoginRateLimit(email: string): boolean {
  const now = Date.now()
  const key = email.toLowerCase().trim()
  const entry = loginAttempts.get(key)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT_MAX
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'יש להזין אימייל וסיסמה' }, { status: 400 })
    }

    if (!checkLoginRateLimit(email)) {
      return NextResponse.json({ error: 'יותר מדי ניסיונות התחברות. נסה שוב מאוחר יותר.' }, { status: 429 })
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { org: true },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'אימייל או סיסמה שגויים' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'אימייל או סיסמה שגויים' }, { status: 401 })
    }

    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      orgId: user.orgId,
      role: user.role,
      isAdmin: user.isAdmin,
    })

    const cookieOptions = getSessionCookieOptions()
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.isAdmin,
        org: { id: user.org.id, name: user.org.name, slug: user.org.slug },
      },
    })

    response.cookies.set(cookieOptions.name, token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    })

    return response
  } catch (error: unknown) {
    console.error('Login error:', error)
    const body: Record<string, string> = { error: 'שגיאה פנימית בשרת' }
    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
      body.detail = error.message.slice(0, 200)
    }
    return NextResponse.json(body, { status: 500 })
  }
}
