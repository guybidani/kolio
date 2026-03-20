import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'
import crypto from 'crypto'

const SUPPORTED_PBX_TYPES = [
  'voicenter',
  '3cx',
  'freepbx',
  'asterisk',
  'twilio',
  'vonage',
  'aircall',
  'cloudtalk',
  'zoom',
  'generic',
] as const

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await requireAuth()
    const { orgId } = await params

    if (!session.isAdmin && session.orgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rbacUser = {
      id: session.id,
      role: session.role,
      orgId: session.orgId,
      isAdmin: session.isAdmin,
    }

    if (!can(rbacUser, 'settings:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const integrations = await db.pbxIntegration.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    })

    // Get org slug for webhook URL generation
    const org = await db.organization.findUnique({
      where: { id: orgId },
      select: { slug: true },
    })

    const result = integrations.map((i) => {
      const config = (i.config && typeof i.config === 'object' ? i.config : {}) as Record<string, unknown>
      return {
        id: i.id,
        name: config.name ?? getPbxDisplayName(i.pbxType),
        pbxType: i.pbxType,
        isActive: i.isActive,
        webhookUrl: i.webhookUrl,
        webhookSecret: config.webhookSecret ?? null,
        extensionMap: i.extensionMap,
        lastWebhookAt: config.lastWebhookAt ?? null,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      }
    })

    return NextResponse.json({ integrations: result, orgSlug: org?.slug })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('GET integrations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await requireAuth()
    const { orgId } = await params

    if (!session.isAdmin && session.orgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rbacUser = {
      id: session.id,
      role: session.role,
      orgId: session.orgId,
      isAdmin: session.isAdmin,
    }

    if (!can(rbacUser, 'settings:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, pbxType } = body

    if (!pbxType || !SUPPORTED_PBX_TYPES.includes(pbxType)) {
      return NextResponse.json(
        { error: 'Invalid PBX type', supported: SUPPORTED_PBX_TYPES },
        { status: 400 }
      )
    }

    // Get org slug for webhook URL
    const org = await db.organization.findUnique({
      where: { id: orgId },
      select: { slug: true },
    })

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Generate unique webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex')

    // Build webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kolio.projectadam.co.il'
    const webhookUrl = `${baseUrl}/api/webhooks/pbx?org=${org.slug}&secret=${webhookSecret}`

    const integration = await db.pbxIntegration.create({
      data: {
        orgId,
        pbxType,
        config: { name: name || getPbxDisplayName(pbxType), webhookSecret },
        webhookUrl,
        isActive: true,
      },
    })

    return NextResponse.json({
      integration: {
        id: integration.id,
        name: name || getPbxDisplayName(pbxType),
        pbxType: integration.pbxType,
        isActive: integration.isActive,
        webhookUrl: integration.webhookUrl,
        webhookSecret,
        extensionMap: integration.extensionMap,
        lastWebhookAt: null,
        createdAt: integration.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('POST integration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getPbxDisplayName(type: string): string {
  const names: Record<string, string> = {
    voicenter: 'Voicenter',
    '3cx': '3CX',
    freepbx: 'FreePBX',
    asterisk: 'Asterisk',
    twilio: 'Twilio',
    vonage: 'Vonage',
    aircall: 'Aircall',
    cloudtalk: 'CloudTalk',
    zoom: 'Zoom Phone',
    generic: 'Generic Webhook',
  }
  return names[type] || type
}
