'use client'

import { AlertCircle, TrendingDown, TrendingUp, Minus } from 'lucide-react'

interface FillerWordRep {
  id: string
  name: string
  avgFillerWords: number
  totalCalls: number
  trend: number // negative is good (fewer fillers)
}

interface FillerWordsProps {
  data: FillerWordRep[]
}

function TrendIcon({ trend }: { trend: number }) {
  // For filler words, going down is good
  if (trend < -0.5) return <TrendingDown className="h-3 w-3 text-emerald-400" />
  if (trend > 0.5) return <TrendingUp className="h-3 w-3 text-red-400" />
  return <Minus className="h-3 w-3 text-white/50" />
}

export function FillerWords({ data }: FillerWordsProps) {
  const sorted = [...data].sort((a, b) => b.avgFillerWords - a.avgFillerWords)
  const worst = sorted[0]

  return (
    <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
      <div className="p-5 pb-3">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          מילות מילוי - לידרבורד
        </h3>
        <p className="text-xs text-white/50 mt-1">
          ממוצע מילות מילוי לשיחה (פחות = טוב יותר)
        </p>
      </div>

      {/* Shame highlight */}
      {worst && worst.avgFillerWords > 5 && (
        <div className="mx-5 mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-400">
            <span className="font-bold">{worst.name}</span> מוביל.ה עם ממוצע של{' '}
            <span className="font-bold">{worst.avgFillerWords.toFixed(1)}</span> מילות מילוי לשיחה
          </p>
        </div>
      )}

      <div className="px-5 pb-5">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-white/50">
              <th className="text-right pb-2 font-medium">#</th>
              <th className="text-right pb-2 font-medium">נציג</th>
              <th className="text-center pb-2 font-medium">ממוצע</th>
              <th className="text-center pb-2 font-medium">שיחות</th>
              <th className="text-center pb-2 font-medium">מגמה</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((rep, i) => (
              <tr
                key={rep.id}
                className="border-t border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-2.5 text-sm text-white/50 w-8">{i + 1}</td>
                <td className="py-2.5">
                  <span className="text-sm text-white">{rep.name}</span>
                </td>
                <td className="py-2.5 text-center">
                  <span
                    className={`text-sm font-mono font-bold ${
                      rep.avgFillerWords > 8
                        ? 'text-red-400'
                        : rep.avgFillerWords > 5
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {rep.avgFillerWords.toFixed(1)}
                  </span>
                </td>
                <td className="py-2.5 text-center text-xs text-white/40">
                  {rep.totalCalls}
                </td>
                <td className="py-2.5 text-center">
                  <div className="flex items-center justify-center">
                    <TrendIcon trend={rep.trend} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <p className="text-sm text-white/50 text-center py-4">
            אין נתונים עדיין
          </p>
        )}
      </div>
    </div>
  )
}
