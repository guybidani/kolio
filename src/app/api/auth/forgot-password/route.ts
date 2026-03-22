import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// Rate limit: 3 requests per email per hour
const resetAttempts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 3

function checkResetRateLimit(email: string): boolean {
  const now = Date.now()
  const key = email.toLowerCase().trim()
  const entry = resetAttempts.get(key)
  if (!entry || now > entry.resetAt) {
    resetAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT_MAX
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'אימייל הוא שדה חובה' }, { status: 400 })
    }

    const emailClean = email.toLowerCase().trim()

    if (!checkResetRateLimit(emailClean)) {
      // Still return success to not reveal rate limiting per email
      return NextResponse.json({ message: 'אם האימייל קיים במערכת, נשלח קישור לאיפוס' })
    }

    const user = await db.user.findUnique({ where: { email: emailClean } })

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await db.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExp },
      })

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kolio.projectadam.co.il'
      const resetLink = `${appUrl}/reset-password?token=${resetToken}`
      console.log(`[PASSWORD RESET] Link for ${emailClean}: ${resetLink}`)

      // TODO: Send reset email via sendEmail() when email service is configured
      return NextResponse.json({
        message: 'אם האימייל קיים במערכת, נשלח קישור לאיפוס',
      })
    }

    // Always return success to not reveal if email exists
    return NextResponse.json({ message: 'אם האימייל קיים במערכת, נשלח קישור לאיפוס' })
  } catch (error: unknown) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 })
  }
}
