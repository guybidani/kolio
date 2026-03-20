'use client'

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface RadarComparisonProps {
  categories: string[]
  thisMonth: number[]
  lastMonth: number[]
}

export function RadarComparison({ categories, thisMonth, lastMonth }: RadarComparisonProps) {
  const data = categories.map((cat, i) => ({
    category: cat,
    'החודש': thisMonth[i],
    'חודש שעבר': lastMonth[i],
  }))

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <h3 className="text-base font-semibold text-white mb-4">השוואת תקופות</h3>
      <p className="text-xs text-white/40 mb-6">החודש לעומת חודש שעבר</p>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
              axisLine={false}
            />
            <Radar
              name="החודש"
              dataKey="החודש"
              stroke="#818cf8"
              fill="#818cf8"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Radar
              name="חודש שעבר"
              dataKey="חודש שעבר"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.1}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
