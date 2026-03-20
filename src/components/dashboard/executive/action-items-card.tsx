'use client'

import { ListTodo, UserRound, Eye, FileEdit } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActionItem {
  type: 'coach' | 'review' | 'update'
  rep: string | null
  action: string
}

interface ActionItemsCardProps {
  items: ActionItem[]
}

const typeConfig = {
  coach: { icon: UserRound, color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: 'אימון' },
  review: { icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'סקירה' },
  update: { icon: FileEdit, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'עדכון' },
}

export function ActionItemsCard({ items }: ActionItemsCardProps) {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
        <ListTodo className="h-4 w-4 text-emerald-400" />
        פעולות נדרשות
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => {
          const config = typeConfig[item.type]
          const Icon = config.icon
          return (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', config.bg)}>
                <Icon className={cn('h-3.5 w-3.5', config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn('text-[10px] font-semibold uppercase tracking-wider', config.color)}>
                    {config.label}
                  </span>
                  {item.rep && (
                    <span className="text-xs text-white/40">
                      — {item.rep}
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/70">{item.action}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
