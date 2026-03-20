import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    await requireAdmin()

    const orgs = await db.organization.findMany({
      include: {
        _count: { select: { users: true, calls: true, reps: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orgs)
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Admin orgs GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()

    const { name, slug } = await req.json()

    if (!name || !slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
    }

    // Validate slug format
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '')
    if (cleanSlug.length < 2) {
      return NextResponse.json({ error: 'Slug must be at least 2 characters (a-z, 0-9, -)' }, { status: 400 })
    }

    // Check uniqueness
    const existing = await db.organization.findUnique({ where: { slug: cleanSlug } })
    if (existing) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 400 })
    }

    const org = await db.organization.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        plan: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json(org)
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Admin orgs POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
