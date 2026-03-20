'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface ScoreBin {
  range: string
  count: number
  color: string
}

interface ScoreDistributionProps {
  data: ScoreBin[]
}

export function ScoreDistribution({ data }: ScoreDistributionProps) {
  const total = data.reduce((sum, bin) => sum + bin.count, 0)

  return (
    <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
      <h3 className="text-base font-semibold text-white mb-4">התפלגות ציונים</h3>
      <div className="h-[250px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="range"
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 15, 25, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number) => [
                `${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
                'שיחות',
              ]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        {data.map((bin) => (
          <div key={bin.range} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: bin.color }}
            />
            <span className="text-xs text-white/40">{bin.range}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
