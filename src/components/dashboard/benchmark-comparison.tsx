'use client'

import { useMemo } from 'react'
import {
  SALES_BENCHMARKS,
  classifyBenchmark,
  gapFromIdeal,
  type BenchmarkKey,
} from '@/lib/benchmarks'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'

export interface BenchmarkDataPoint {
  key: string
  value: number
  previousValue?: number
}

interface BenchmarkComparisonProps {
  data: BenchmarkDataPoint[]
  title?: string
  showTrends?: boolean
  compact?: boolean
}

const ZONE_COLORS = {
  green: {
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-500/20 to-emerald-500/5',
  },
  yellow: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    gradient: 'from-amber-500/20 to-amber-500/5',
  },
  red: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-500/15',
    text: 'text-red-400',
    border: 'border-red-500/30',
    gradient: 'from-red-500/20 to-red-500/5',
  },
} as const

function getTrendInfo(key: string, current: number, previous?: number) {
  if (previous == null) return null
  const benchmark = SALES_BENCHMARKS[key]
  if (!benchmark) return null

  const currentGap = Math.abs(current - benchmark.ideal)
  const previousGap = Math.abs(previous - benchmark.ideal)
  const diff = currentGap - previousGap

  if (Math.abs(diff) < 0.3) return { direction: 'stable' as const, icon: Minus }
  if (diff < 0) return { direction: 'improving' as const, icon: TrendingUp }
  return { direction: 'declining' as const, icon: TrendingDown }
}

export function BenchmarkComparison({
  data,
  title = 'השוואה לסטנדרט',
  showTrends = true,
  compact = false,
}: BenchmarkComparisonProps) {
  const metrics = useMemo(() => {
    return data
      .filter((d) => SALES_BENCHMARKS[d.key])
      .map((d) => {
        const benchmark = SALES_BENCHMARKS[d.key]
        const zone = classifyBenchmark(d.key, d.value)
        const gap = gapFromIdeal(d.key, d.value)
        const trend = showTrends ? getTrendInfo(d.key, d.value, d.previousValue) : null
        return { ...d, benchmark, zone, gap, trend }
      })
  }, [data, showTrends])

  if (metrics.length === 0) return null

  return (
    <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            אידיאלי
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            סביר
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            לשיפור
          </span>
        </div>
      </div>

      <div className={`space-y-${compact ? '3' : '4'}`}>
        {metrics.map((metric) => {
          const { benchmark, zone, gap, trend, value, key } = metric
          const colors = ZONE_COLORS[zone]
          const { min, max, ideal } = benchmark

          // Calculate positions as percentages
          const range = max - min
          const idealPct = ((ideal - min) / range) * 100
          const valuePct = Math.max(0, Math.min(100, ((value - min) / range) * 100))

          // Green zone: ±10% of ideal
          const greenStart = Math.max(0, ((ideal * 0.9 - min) / range) * 100)
          const greenEnd = Math.min(100, ((ideal * 1.1 - min) / range) * 100)
          // Yellow zone: ±20% of ideal
          const yellowStart = Math.max(0, ((ideal * 0.8 - min) / range) * 100)
          const yellowEnd = Math.min(100, ((ideal * 1.2 - min) / range) * 100)

          return (
            <div key={key} className="group">
              {/* Label row */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {benchmark.label}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span
                      className="text-[10px] text-muted-foreground cursor-help"
                      title={`${benchmark.description}\n${benchmark.source}`}
                    >
                      <Info className="inline h-3 w-3" />
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Trend arrow */}
                  {trend && trend.direction !== 'stable' && (
                    <trend.icon
                      className={`h-3.5 w-3.5 ${
                        trend.direction === 'improving'
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    />
                  )}
                  {/* Value + gap */}
                  <span className={`text-sm font-bold tabular-nums ${colors.text}`}>
                    {value % 1 === 0 ? value : value.toFixed(1)}
                    {benchmark.unit ? ` ${benchmark.unit}` : ''}
                  </span>
                  <span
                    className={`text-[11px] tabular-nums ${
                      gap === 0
                        ? 'text-muted-foreground'
                        : zone === 'green'
                        ? 'text-emerald-400/70'
                        : zone === 'yellow'
                        ? 'text-amber-400/70'
                        : 'text-red-400/70'
                    }`}
                  >
                    {gap === 0 ? 'מדויק' : gap > 0 ? `+${gap}%` : `${gap}%`}
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="relative h-3 rounded-full bg-muted/80 overflow-hidden">
                {/* Red zone (full bar background) */}
                <div className="absolute inset-0 bg-red-500/8 rounded-full" />

                {/* Yellow zone */}
                <div
                  className="absolute top-0 bottom-0 bg-amber-500/12 rounded-full"
                  style={{
                    left: `${yellowStart}%`,
                    width: `${yellowEnd - yellowStart}%`,
                  }}
                />

                {/* Green zone */}
                <div
                  className="absolute top-0 bottom-0 rounded-full"
                  style={{
                    left: `${greenStart}%`,
                    width: `${greenEnd - greenStart}%`,
                    background: 'linear-gradient(90deg, rgba(16,185,129,0.15), rgba(16,185,129,0.25), rgba(16,185,129,0.15))',
                  }}
                />

                {/* Benchmark reference line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10"
                  style={{ left: `${idealPct}%` }}
                  title={`אידיאל: ${ideal}${benchmark.unit ? ` ${benchmark.unit}` : ''}`}
                />

                {/* Rep value marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-500"
                  style={{ left: `${valuePct}%` }}
                >
                  <div
                    className={`h-4 w-4 -ml-2 rounded-full border-2 border-background shadow-lg ${colors.bg}`}
                    style={{
                      boxShadow: `0 0 8px ${
                        zone === 'green'
                          ? 'rgba(16,185,129,0.5)'
                          : zone === 'yellow'
                          ? 'rgba(245,158,11,0.5)'
                          : 'rgba(239,68,68,0.5)'
                      }`,
                    }}
                  />
                </div>
              </div>

              {/* Scale labels (only in non-compact mode) */}
              {!compact && (
                <div className="flex justify-between mt-0.5 text-[10px] text-muted-foreground/60">
                  <span>{min}{benchmark.unit ? ` ${benchmark.unit}` : ''}</span>
                  <span>{max}{benchmark.unit ? ` ${benchmark.unit}` : ''}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Source attribution */}
      <div className="mt-4 pt-3 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          נתוני השוואה מבוססים על מחקרי Gong Labs
        </p>
      </div>
    </div>
  )
}

/**
 * Compact summary card showing how many metrics are in each zone.
 */
export function BenchmarkSummaryCard({
  data,
}: {
  data: BenchmarkDataPoint[]
}) {
  const counts = useMemo(() => {
    let green = 0
    let yellow = 0
    let red = 0
    for (const d of data) {
      if (!SALES_BENCHMARKS[d.key]) continue
      const zone = classifyBenchmark(d.key, d.value)
      if (zone === 'green') green++
      else if (zone === 'yellow') yellow++
      else red++
    }
    return { green, yellow, red, total: green + yellow + red }
  }, [data])

  if (counts.total === 0) return null

  return (
    <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-5">
      <h3 className="text-base font-semibold text-foreground mb-3">
        סיכום השוואה לסטנדרט
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-2xl font-bold text-emerald-400">{counts.green}</div>
          <div className="text-xs text-emerald-400/70 mt-1">באזור אידיאלי</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="text-2xl font-bold text-amber-400">{counts.yellow}</div>
          <div className="text-xs text-amber-400/70 mt-1">סביר</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="text-2xl font-bold text-red-400">{counts.red}</div>
          <div className="text-xs text-red-400/70 mt-1">לשיפור</div>
        </div>
      </div>
    </div>
  )
}
