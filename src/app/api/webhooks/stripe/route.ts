import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const orgId = session.metadata?.orgId
      const plan = session.metadata?.plan as 'STARTER' | 'PRO' | undefined

      if (orgId && plan) {
        await db.organization.update({
          where: { id: orgId },
          data: {
            plan,
            stripeCustomerId: session.customer as string,
            stripeSubId: session.subscription as string,
            planSeats: plan === 'STARTER' ? 5 : plan === 'PRO' ? 20 : 3,
            trialEndsAt: null,
          },
        })
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const org = await db.organization.findUnique({
        where: { stripeCustomerId: subscription.customer as string },
      })

      if (org) {
        const isActive = subscription.status === 'active' || subscription.status === 'trialing'
        if (!isActive) {
          await db.organization.update({
            where: { id: org.id },
            data: { plan: 'TRIAL' },
          })
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await db.organization.updateMany({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
          plan: 'TRIAL',
          stripeSubId: null,
        },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
