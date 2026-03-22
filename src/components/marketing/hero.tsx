'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Phone, TrendingUp, Brain } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32 bg-[#0A0A0F]">
      {/* Background gradient effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-amber-500/5 blur-[80px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-1.5 text-sm">
            <Brain className="h-4 w-4 text-indigo-400" />
            <span className="text-white/70">AI שמנתח כל שיחת מכירה שלכם</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-white">
            תפסיק לנחש.{' '}
            <span className="bg-gradient-to-l from-indigo-400 to-indigo-500 bg-clip-text text-transparent">
              תתחיל לדעת.
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-white/60 sm:text-xl">
            Kolio מנתח את שיחות המכירה של הצוות שלכם בזמן אמת, מזהה נקודות חוזק וחולשה,
            ומספק טיפים מותאמים אישית לשיפור ביצועים. בעברית, לשוק הישראלי.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_4px_14px_rgba(99,102,241,0.4)]">
                התחילו ניסיון חינם
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="text-lg px-8 border-white/10 text-white/80 hover:bg-white/5">
                איך זה עובד?
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                <Phone className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white">50K+</div>
              <div className="text-sm text-white/50">שיחות נותחו</div>
            </div>
            <div>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                <TrendingUp className="h-6 w-6 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">+34%</div>
              <div className="text-sm text-white/50">שיפור ביצועים ממוצע</div>
            </div>
            <div>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                <Brain className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white">עברית</div>
              <div className="text-sm text-white/50">תמיכה מלאה בשוק הישראלי</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
