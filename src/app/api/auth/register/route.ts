import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createToken, getSessionCookieOptions } from '@/lib/auth'

export const runtime = 'nodejs'

// Rate limit: 3 registrations per IP per hour
const registerAttempts = new Map<string, { count: number; resetAt: number }>()

function checkRegisterRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = registerAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    registerAttempts.set(ip, { count: 1, resetAt: now + 3600_000 })
    return true
  }
  entry.count++
  return entry.count <= 3
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRegisterRateLimit(ip)) {
      return NextResponse.json({ error: 'יותר מדי ניסיונות. נסה שוב מאוחר יותר.' }, { status: 429 })
    }

    const { name, email, password, orgName } = await req.json()

    if (!name || !email || !password || !orgName) {
      return NextResponse.json({ error: 'כל השדות הם חובה' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'הסיסמה חייבת להכיל לפחות 8 תווים' }, { status: 400 })
    }

    const emailClean = email.toLowerCase().trim()
    const nameClean = name.trim()
    const orgNameClean = orgName.trim()

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email: emailClean } })
    if (existing) {
      return NextResponse.json({ error: 'כתובת האימייל כבר בשימוש' }, { status: 400 })
    }

    // Generate org slug
    const baseSlug = orgNameClean
      .toLowerCase()
      .replace(/[^a-z0-9\u0590-\u05FF]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'org'

    // Ensure unique slug
    let slug = baseSlug
    let counter = 0
    while (await db.organization.findUnique({ where: { slug } })) {
      counter++
      slug = `${baseSlug}-${counter}`
    }

    // Create org + admin user in a transaction
    const passwordHash = await hashPassword(password)

    const org = await db.organization.create({
      data: {
        name: orgNameClean,
        slug,
        plan: 'TRIAL',
        planSeats: 5,
      },
    })

    const user = await db.user.create({
      data: {
        email: emailClean,
        name: nameClean,
        passwordHash,
        orgId: org.id,
        role: 'ADMIN',
        isAdmin: false, // org admin, not system admin
      },
    })

    // Create JWT and set cookie
    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      orgId: org.id,
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
        org: { id: org.id, name: org.name, slug: org.slug },
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
    console.error('Register error:', error)
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 })
  }
}
