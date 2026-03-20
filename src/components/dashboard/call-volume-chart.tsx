'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface CallVolumeData {
  period: string
  count: number
}

interface CallVolumeChartProps {
  data: CallVolumeData[]
  target?: number
}

export function CallVolumeChart({ data, target }: CallVolumeChartProps) {
  return (
    <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-5">
      <h3 className="text-base font-semibold text-foreground mb-4">נפח שיחות</h3>
      <div className="h-[300px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="callVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="period"
              stroke="var(--border)"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <YAxis
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
              labelStyle={{ color: 'var(--muted-foreground)' }}
            />
            {target && (
              <ReferenceLine
                y={target}
                stroke="#F59E0B"
                strokeDasharray="5 5"
                label={{
                  value: `יעד: ${target}`,
                  fill: '#F59E0B',
                  fontSize: 12,
                  position: 'insideTopRight',
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="count"
              stroke="#818CF8"
              strokeWidth={2}
              fill="url(#callVolumeGradient)"
              name="שיחות"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
