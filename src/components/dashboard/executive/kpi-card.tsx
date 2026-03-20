'use client'

import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string
  subtitle: string
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
}

export function KpiCard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  iconBg,
}: KpiCardProps) {
  const isPositive = change !== undefined && change >= 0
  const TrendArrow = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:bg-white/[0.07] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-white/50">{title}</span>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
      <div className="flex items-center gap-2 mt-2">
        {change !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md',
              isPositive
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-red-400 bg-red-500/10'
            )}
          >
            <TrendArrow className="h-3 w-3" />
            {isPositive ? '+' : ''}{change}%
          </span>
        )}
        <span className="text-xs text-white/40">
          {changeLabel || subtitle}
        </span>
      </div>
    </div>
  )
}
