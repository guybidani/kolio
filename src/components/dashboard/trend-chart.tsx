'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { chartColors } from '@/lib/design-tokens'

interface TrendDataPoint {
  period: string
  [repName: string]: string | number
}

interface RepTrend {
  id: string
  name: string
  improving: boolean
}

interface TrendChartProps {
  data: TrendDataPoint[]
  reps: RepTrend[]
}

export function TrendChart({ data, reps }: TrendChartProps) {
  const colors = chartColors.dark

  return (
    <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">מגמות ציונים לפי נציג</h3>
        <div className="flex gap-2">
          {reps.map((rep) => (
            <span
              key={rep.id}
              className={`text-xs px-2 py-0.5 rounded-full ${
                rep.improving
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {rep.name}: {rep.improving ? 'משתפר' : 'יורד'}
            </span>
          ))}
        </div>
      </div>
      <div className="h-[300px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="period"
              stroke="var(--border)"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <YAxis
              domain={[0, 10]}
              stroke="var(--border)"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--foreground)',
              }}
            />
            <Legend
              wrapperStyle={{ color: 'var(--muted-foreground)', fontSize: '12px' }}
            />
            {reps.map((rep, i) => (
              <Line
                key={rep.id}
                type="monotone"
                dataKey={rep.name}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[i % colors.length], r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
