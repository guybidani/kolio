'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

interface WeekData {
  week: string
  score: number
  calls: number
}

interface ScoreTrendChartProps {
  data: WeekData[]
  targetScore?: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-popover border border-border px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">שבוע {label}</p>
      <p className="text-sm font-semibold text-indigo-400">ציון: {payload[0].value}</p>
    </div>
  )
}

export function ScoreTrendChart({ data, targetScore = 75 }: ScoreTrendChartProps) {
  return (
    <div className="rounded-2xl bg-muted/50 backdrop-blur-xl border border-border p-6">
      <h3 className="text-base font-semibold text-foreground mb-6">מגמת ציון צוות</h3>
      <div className="h-[280px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="week"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <YAxis
              domain={[40, 100]}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={targetScore}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
              label={{
                value: `יעד: ${targetScore}`,
                position: 'insideTopRight',
                fill: '#f59e0b',
                fontSize: 11,
                opacity: 0.7,
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#818cf8"
              strokeWidth={2.5}
              fill="url(#scoreGradient)"
              dot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#818cf8', stroke: 'var(--background)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
