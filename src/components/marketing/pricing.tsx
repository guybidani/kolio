'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: '149',
    period: 'לחודש',
    description: 'לצוותים קטנים שרוצים להתחיל',
    features: [
      'עד 3 נציגים',
      '100 שיחות בחודש',
      'תמלול + ניתוח AI',
      'ציונים ומגמות',
      'חיבור מרכזיה אחת',
      'דוח שבועי',
    ],
    cta: 'התחילו עכשיו',
    popular: false,
  },
  {
    name: 'Pro',
    price: '249',
    period: 'לחודש',
    description: 'לצוותי מכירות מקצועיים',
    features: [
      'עד 10 נציגים',
      '500 שיחות בחודש',
      'תמלול + ניתוח AI מתקדם',
      'Playbook חכם',
      'חיבור מרכזיות ללא הגבלה',
      'דוח שבועי + API',
      'לידרבורד ותחרויות',
      'תמיכה עדיפה',
    ],
    cta: 'התחילו עכשיו',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'מותאם אישית',
    period: '',
    description: 'לארגונים גדולים',
    features: [
      'נציגים ללא הגבלה',
      'שיחות ללא הגבלה',
      'כל התכונות של Pro',
      'אינטגרציות CRM מותאמות',
      'SSO ואבטחה מתקדמת',
      'מנהל לקוח ייעודי',
      'SLA מותאם',
      'הדרכה וליווי',
    ],
    cta: 'דברו איתנו',
    popular: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-[#0A0A0F] relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl text-white">תמחור פשוט ושקוף</h2>
          <p className="mt-4 text-lg text-white/50">
            14 ימי ניסיון חינם לכל התוכניות. ללא כרטיס אשראי.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-xl backdrop-blur-xl p-6 transition-all ${
                plan.popular
                  ? 'bg-white/[0.08] border-2 border-indigo-500/50 shadow-[0_8px_24px_rgba(99,102,241,0.2)] scale-[1.03]'
                  : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 right-4 bg-indigo-600 text-white border-0">
                  הכי פופולרי
                </Badge>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-sm text-white/50 mt-1">{plan.description}</p>
                <div className="mt-4">
                  {plan.period ? (
                    <>
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-white/50 mr-1">&#8362; {plan.period}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                  )}
                </div>
              </div>
              <ul className="space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="mt-8 block">
                <Button
                  className={`w-full ${
                    plan.popular
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_4px_14px_rgba(99,102,241,0.4)]'
                      : 'border-white/10 text-white/80 hover:bg-white/5'
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
