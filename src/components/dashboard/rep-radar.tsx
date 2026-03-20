'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface RadarData {
  category: string
  label: string
  rep: number
  team: number
}

interface RepRadarProps {
  repName: string
  repData: Record<string, number>
  teamData: Record<string, number>
}

const categoryLabels: Record<string, string> = {
  discovery: 'חקירה',
  objectionHandling: 'טיפול בהתנגדויות',
  closing: 'סגירה',
  rapport: 'ראפור',
  valueCommunication: 'תקשורת ערך',
  energy: 'אנרגיה',
  nextSteps: 'צעדים הבאים',
}

export function RepRadar({ repName, repData, teamData }: RepRadarProps) {
  const data: RadarData[] = Object.keys(repData).map((key) => ({
    category: key,
    label: categoryLabels[key] || key,
    rep: repData[key] || 0,
    team: teamData[key] || 0,
  }))

  return (
    <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
      <h3 className="text-base font-semibold text-white mb-4">
        פרופיל יכולות - {repName}
      </h3>
      <div className="h-[350px]" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            />
            <Radar
              name={repName}
              dataKey="rep"
              stroke="#818CF8"
              fill="#818CF8"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Radar
              name="ממוצע צוות"
              dataKey="team"
              stroke="#F59E0B"
              fill="#F59E0B"
              fillOpacity={0.1}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Legend
              wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
