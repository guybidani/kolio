import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(
        new URL('/verify-email?error=missing-token', req.url)
      )
    }

    const user = await db.user.findFirst({
      where: { verifyToken: token },
    })

    if (!user) {
      return NextResponse.redirect(
        new URL('/verify-email?error=invalid-token', req.url)
      )
    }

    if (user.verifyTokenExp && user.verifyTokenExp < new Date()) {
      return NextResponse.redirect(
        new URL('/verify-email?error=expired-token', req.url)
      )
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        verifyTokenExp: null,
      },
    })

    return NextResponse.redirect(
      new URL('/verify-email?success=true', req.url)
    )
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.redirect(
      new URL('/verify-email?error=server-error', req.url)
    )
  }
}
