'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    q: 'איך Kolio מתחבר למרכזיה שלי?',
    a: 'Kolio עובד עם webhook פשוט. מעתיקים את כתובת ה-Webhook מההגדרות ומדביקים במרכזיה. תומכים ב-Voicenter, 3CX, Yeastar, Grandstream, Twilio, Vonage, CloudTalk ועוד. ההתקנה לוקחת 2 דקות.',
  },
  {
    q: 'כמה מדויק התמלול בעברית?',
    a: 'אנחנו משתמשים ב-Deepgram Nova 3 שמתמחה בעברית מדוברת, כולל סלנג ושפה עסקית. הדיוק עומד על כ-92% ומשתפר כל הזמן. המערכת גם מזהה דוברים שונים בשיחה אוטומטית.',
  },
  {
    q: 'מה קורה עם פרטיות ואבטחת מידע?',
    a: 'כל הנתונים מוצפנים בתעבורה ובאחסון. ההקלטות נשמרות ב-Cloudflare R2 באירופה. אנחנו לא משתפים נתונים עם צד שלישי. אפשר למחוק הקלטות בכל רגע.',
  },
  {
    q: 'כמה זמן לוקח לנתח שיחה?',
    a: 'תמלול וניתוח מלא לוקחים 2-5 דקות מרגע ההקלטה. שיחות ארוכות במיוחד (30+ דקות) עשויות לקחת עד 8 דקות.',
  },
  {
    q: 'האם אפשר להתאים את הניתוח לתחום שלי?',
    a: 'בהחלט. דרך ה-Playbook אתם מגדירים את שלבי המכירה, בנק התנגדויות ומילות מפתח שחשובות בתחום שלכם. ה-AI מתאים את הניתוח בהתאם.',
  },
  {
    q: 'מה ההבדל בין Starter ל-Pro?',
    a: 'Starter מיועד לצוותים קטנים עד 3 נציגים עם 100 שיחות בחודש. Pro כולל עד 10 נציגים, 500 שיחות, Playbook חכם, לידרבורד ו-API. שתי התוכניות כוללות ניתוח AI מלא.',
  },
  {
    q: 'האם יש תקופת ניסיון?',
    a: 'כן, 14 ימי ניסיון חינם מלאים ללא צורך בכרטיס אשראי. מקבלים גישה לכל הפיצ\'רים של תוכנית Pro.',
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 bg-[#0A0A0F] relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl text-white">
            שאלות נפוצות
          </h2>
          <p className="mt-4 text-lg text-white/50">
            כל מה שצריך לדעת לפני שמתחילים
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
            >
              <button
                className="flex items-center justify-between w-full p-4 text-right"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-white text-sm">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-white/40 transition-transform duration-200 flex-shrink-0 mr-4',
                    open === i && 'rotate-180'
                  )}
                />
              </button>
              <div
                className={cn(
                  'grid transition-all duration-200',
                  open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm text-white/50 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
