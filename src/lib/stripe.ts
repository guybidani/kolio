import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
  typescript: true,
})

export const PLANS = {
  STARTER: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    seats: 5,
    callsPerMonth: 200,
    priceNIS: 299,
  },
  PRO: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    seats: 20,
    callsPerMonth: 1000,
    priceNIS: 799,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: null,
    seats: -1, // unlimited
    callsPerMonth: -1,
    priceNIS: null, // custom
  },
} as const

export async function createCheckoutSession(
  orgId: string,
  orgEmail: string,
  planKey: 'STARTER' | 'PRO',
  returnUrl: string
) {
  const plan = PLANS[planKey]

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: orgEmail,
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    metadata: {
      orgId,
      plan: planKey,
    },
    success_url: `${returnUrl}?success=true`,
    cancel_url: `${returnUrl}?canceled=true`,
  })

  return session
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session
}
