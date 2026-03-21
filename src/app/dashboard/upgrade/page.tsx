'use client'

import { useState, useEffect } from 'react'
import { Crown, Check, Zap, Phone, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PlanStatusData {
  plan: string
  trialExpired: boolean
  trialDaysLeft?: number
}

const plans = [
  {
    id: 'STARTER',
    name: 'סטארטר',
    price: '199',
    period: 'לחודש',
    description: 'לצוותי מכירות קטנים שרוצים לשפר ביצועים',
    features: [
      'עד 5 משתמשים',
      '200 שיחות בחודש',
      'ניתוח שיחות AI',
      'תסריט מכירה',
      'דשבורד בסיסי',
    ],
    color: 'border-blue-500/30 hover:border-blue-500/50',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    button: 'bg-blue-600 hover:bg-blue-500',
  },
  {
    id: 'PRO',
    name: 'פרו',
    price: '499',
    period: 'לחודש',
    description: 'לארגונים שרוצים שליטה מלאה על תהליך המכירה',
    popular: true,
    features: [
      'עד 20 משתמשים',
      'שיחות ללא הגבלה',
      'ניתוח שיחות AI מתקדם',
      'תסריט מכירה מותאם',
      'אנליטיקס מתקדם',
      'דשבורד מנהלים',
      'גיימיפיקציה ותחרויות',
      'התממשקות למרכזיה',
    ],
    color: 'border-indigo-500/30 hover:border-indigo-500/50',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    button: 'bg-indigo-600 hover:bg-indigo-500',
  },
  {
    id: 'ENTERPRISE',
    name: 'אנטרפרייז',
    price: 'בהתאמה אישית',
    period: '',
    description: 'לארגונים גדולים עם צרכים ייחודיים',
    features: [
      'משתמשים ללא הגבלה',
      'שיחות ללא הגבלה',
      'כל הפיצ\'רים',
      'מנהל לקוח ייעודי',
      'התאמות אישיות',
      'SLA מובטח',
      'הדרכה והטמעה',
      'API גישה מלאה',
    ],
    color: 'border-purple-500/30 hover:border-purple-500/50',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    button: 'bg-purple-600 hover:bg-purple-500',
  },
]

export default function UpgradePage() {
  const [status, setStatus] = useState<PlanStatusData | null>(null)

  useEffect(() => {
    fetch('/api/plan')
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {})
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <Crown className="h-8 w-8 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {status?.trialExpired ? 'תקופת הניסיון שלך הסתיימה' : 'שדרג את התוכנית שלך'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {status?.trialExpired
            ? 'בחר תוכנית כדי להמשיך להשתמש בכל הפיצ\'רים'
            : 'בחר את התוכנית המתאימה לצוות שלך'}
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              'relative rounded-xl bg-card border-2 p-6 transition-colors',
              plan.color
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-indigo-600 text-white border-0 px-3 py-0.5 text-xs">
                  <Zap className="h-3 w-3 ml-1" />
                  הכי פופולרי
                </Badge>
              </div>
            )}

            <div className="mb-4">
              <Badge className={cn('text-xs border mb-3', plan.badge)}>
                {plan.name}
              </Badge>
              <div className="flex items-baseline gap-1">
                {plan.price !== 'בהתאמה אישית' ? (
                  <>
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-foreground">{plan.price}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
            </div>

            <ul className="space-y-2.5 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="mailto:guy@projectadam.co.il?subject=שדרוג תוכנית Kolio"
              className="block"
            >
              <Button className={cn('w-full text-white', plan.button)}>
                צור קשר לשדרוג
              </Button>
            </a>
          </div>
        ))}
      </div>

      {/* Contact section */}
      <div className="rounded-xl bg-card border border-border p-6 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">צריך עזרה בבחירת תוכנית?</h3>
        <p className="text-muted-foreground mb-4">צוות המכירות שלנו ישמח לעזור</p>
        <div className="flex items-center justify-center gap-6">
          <a
            href="mailto:guy@projectadam.co.il"
            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Mail className="h-4 w-4" />
            guy@projectadam.co.il
          </a>
          <a
            href="tel:+972543307711"
            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Phone className="h-4 w-4" />
            054-330-7711
          </a>
        </div>
      </div>
    </div>
  )
}
