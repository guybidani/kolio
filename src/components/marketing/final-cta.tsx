'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function FinalCTA() {
  return (
    <section className="py-24 bg-[#0A0A0F] relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Gradient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[300px] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl text-white mb-4">
            מוכנים לשדרג את צוות המכירות?
          </h2>
          <p className="text-lg text-white/50 mb-10">
            התחילו ניסיון חינם של 14 ימים. ללא כרטיס אשראי. בלי התחייבות.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_4px_14px_rgba(99,102,241,0.4)]">
                התחילו בחינם עכשיו
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            {/* TODO: Replace with actual WhatsApp number */}
            <Link href="https://wa.me/9720000000000">
              <Button variant="outline" size="lg" className="text-lg px-8 border-white/10 text-white/80 hover:bg-white/5">
                דברו איתנו בווטסאפ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
