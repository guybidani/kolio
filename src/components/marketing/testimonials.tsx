'use client'

import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'רועי אשכנזי',
    role: 'מנהל מכירות',
    company: 'סוכנות דיגיטל M360',
    quote: 'מאז שהתחלנו להשתמש ב-Kolio, הציונים של הצוות עלו ב-30% תוך חודשיים. הנציגים אוהבים את הטיפים הספציפיים אחרי כל שיחה.',
    rating: 5,
  },
  {
    name: 'ענת גולדברג',
    role: 'סמנכ"לית מכירות',
    company: 'LeadPro',
    quote: 'סוף סוף כלי שמבין עברית ואת השוק הישראלי. ה-Playbook החכם שינה את הדרך שאנחנו מכשירים נציגים חדשים.',
    rating: 5,
  },
  {
    name: 'יובל מזרחי',
    role: 'מייסד',
    company: 'ClickFunnel IL',
    quote: 'החיבור למרכזיית Voicenter עבד מהרגע הראשון. כל שיחה נכנסת לאנליזה אוטומטית - חוסך לנו שעות של הקשבה ידנית.',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-24 bg-[#0A0A0F] relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl text-white">
            מה אומרים הלקוחות שלנו
          </h2>
          <p className="mt-4 text-lg text-white/50">
            עסקים ישראליים שמשפרים ביצועי מכירות עם Kolio
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-sm text-white/70 leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <span className="text-indigo-300 font-bold text-sm">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-white/40">{t.role}, {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
