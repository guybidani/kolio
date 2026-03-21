import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'טוקן וסיסמה הם שדות חובה' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'הסיסמה חייבת להכיל לפחות 8 תווים' }, { status: 400 })
    }

    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: { gt: new Date() },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'הקישור לא תקין או שפג תוקפו' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExp: null,
      },
    })

    return NextResponse.json({ message: 'הסיסמה שונתה בהצלחה' })
  } catch (error: unknown) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 })
  }
}
