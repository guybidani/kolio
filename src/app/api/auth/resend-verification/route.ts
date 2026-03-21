import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'

// Rate limit: 1 per 5 minutes per user
const resendAttempts = new Map<string, number>()

export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
    }

    // Rate limit check
    const lastSent = resendAttempts.get(session.id)
    const now = Date.now()
    if (lastSent && now - lastSent < 5 * 60 * 1000) {
      const waitMinutes = Math.ceil((5 * 60 * 1000 - (now - lastSent)) / 60000)
      return NextResponse.json(
        { error: `ניתן לשלוח שוב בעוד ${waitMinutes} דקות` },
        { status: 429 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'האימייל כבר מאומת' }, { status: 400 })
    }

    // Generate new token
    const verifyToken = crypto.randomBytes(32).toString('hex')
    const verifyTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await db.user.update({
      where: { id: user.id },
      data: { verifyToken, verifyTokenExp },
    })

    // Log verification link (no email service yet)
    const verifyUrl = `https://kolio.projectadam.co.il/verify-email?token=${verifyToken}`
    console.log(`[EMAIL VERIFY] Resend for ${user.email} - Verification link: ${verifyUrl}`)

    // Update rate limit
    resendAttempts.set(session.id, now)

    return NextResponse.json({ message: 'קישור אימות נשלח מחדש' })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 })
  }
}
