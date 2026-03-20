import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing CLERK_WEBHOOK_SECRET' }, { status: 500 })
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: { type: string; data: Record<string, unknown> }

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as { type: string; data: Record<string, unknown> }
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const eventType = evt.type

  if (eventType === 'organization.created') {
    const data = evt.data as {
      id: string
      name: string
      slug: string
    }

    await db.organization.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug || data.id,
        plan: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },
    })
  }

  if (eventType === 'organizationMembership.created') {
    const data = evt.data as {
      organization: { id: string }
      public_user_data: {
        user_id: string
        first_name: string
        last_name: string
        identifier: string
        image_url: string
      }
      role: string
    }

    const roleMap: Record<string, 'ADMIN' | 'MANAGER' | 'REP' | 'VIEWER'> = {
      'org:admin': 'ADMIN',
      'org:member': 'REP',
    }

    await db.user.upsert({
      where: { clerkUserId: data.public_user_data.user_id },
      create: {
        orgId: data.organization.id,
        email: data.public_user_data.identifier,
        name: `${data.public_user_data.first_name || ''} ${data.public_user_data.last_name || ''}`.trim(),
        role: roleMap[data.role] || 'VIEWER',
        clerkUserId: data.public_user_data.user_id,
        avatarUrl: data.public_user_data.image_url,
      },
      update: {
        name: `${data.public_user_data.first_name || ''} ${data.public_user_data.last_name || ''}`.trim(),
        avatarUrl: data.public_user_data.image_url,
      },
    })
  }

  return NextResponse.json({ received: true })
}
