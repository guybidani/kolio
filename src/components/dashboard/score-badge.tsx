'use client'

import { cn } from '@/lib/utils'

interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

function getScoreColor(score: number) {
  if (score <= 3) return { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/20' }
  if (score <= 5) return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/20' }
  if (score <= 7) return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/20' }
  if (score <= 9) return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20' }
  return { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/20' }
}

function getScoreLabel(score: number) {
  if (score <= 3) return 'חלש'
  if (score <= 5) return 'דורש שיפור'
  if (score <= 7) return 'סביר'
  if (score <= 9) return 'חזק'
  return 'מצוין'
}

export function ScoreBadge({ score, size = 'md', showLabel = false }: ScoreBadgeProps) {
  const colors = getScoreColor(score)

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 rounded-md',
    md: 'text-sm px-2 py-1 rounded-lg',
    lg: 'text-lg px-3 py-1.5 font-bold rounded-xl',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border font-semibold tabular-nums',
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size]
      )}
    >
      {score.toFixed(1)}
      {showLabel && <span className="font-normal text-[0.8em] opacity-80">{getScoreLabel(score)}</span>}
    </span>
  )
}
