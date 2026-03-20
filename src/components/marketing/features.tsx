'use client'

import {
  Mic,
  Brain,
  BarChart3,
  Users,
  Zap,
  Shield,
  Headphones,
  BookOpen,
} from 'lucide-react'

const features = [
  {
    icon: Mic,
    title: 'תמלול אוטומטי',
    description:
      'חיבור ישיר למרכזיות (Voicenter, 3CX, Yeastar ועוד). כל שיחה מתומללת אוטומטית בעברית עם דיוק גבוה.',
  },
  {
    icon: Brain,
    title: 'ניתוח AI חכם',
    description:
      'ניתוח SPIN + Challenger מתקדם. מזהה סיגנלי קנייה, התנגדויות, נקודות כאב ו-talk ratio בכל שיחה.',
  },
  {
    icon: BarChart3,
    title: 'ציונים ומגמות',
    description:
      'ציון כולל לכל שיחה (1-10) עם פירוט: דיסקברי, טיפול בהתנגדויות, סגירה, ראפור, והעברת ערך.',
  },
  {
    icon: Users,
    title: 'לוח נציגים',
    description:
      'לידרבורד בזמן אמת. זהו את הנציגים המצטיינים, עקבו אחרי מגמות ושפרו את כל הצוות.',
  },
  {
    icon: Zap,
    title: 'טיפים מותאמים',
    description:
      'כל טיפ מתייחס לרגע ספציפי בשיחה עם ציטוט מדויק ומשפט חלופי מוצע - בעברית טבעית.',
  },
  {
    icon: BookOpen,
    title: 'Playbook חכם',
    description:
      'המערכת לומדת מהשיחות המוצלחות ובונה playbook מותאם לארגון. טכניקות שעבדו נשמרות אוטומטית.',
  },
  {
    icon: Headphones,
    title: 'נגן סינכרוני',
    description:
      'האזנה לשיחה עם תמלול מסונכרן. דילגו לרגעים מפתח, התנגדויות ונקודות ציון בלחיצה.',
  },
  {
    icon: Shield,
    title: 'דוח שבועי',
    description:
      'דוח אוטומטי עם סטטיסטיקות, הנציג המוביל, דפוסי התנגדויות נפוצים ותובנות לשיפור.',
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-[#0A0A0F] relative">
      {/* Subtle top gradient for visual separation */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl text-white">
            כל מה שצריך כדי להפוך את הצוות למכונת מכירות
          </h2>
          <p className="mt-4 text-lg text-white/50">
            מתמלול אוטומטי ועד דוחות שבועיים - Kolio מכסה את כל מחזור חיי השיחה
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 transition-all duration-300 hover:bg-white/[0.08] hover:border-indigo-500/30 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(99,102,241,0.15)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                <feature.icon className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
