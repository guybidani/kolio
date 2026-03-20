'use client'

interface TalkRatioGaugeProps {
  repRatio: number
  customerRatio: number
  repName?: string
}

export function TalkRatioGauge({ repRatio, customerRatio, repName }: TalkRatioGaugeProps) {
  const total = repRatio + customerRatio
  const repPct = total > 0 ? (repRatio / total) * 100 : 50
  const customerPct = 100 - repPct

  // Color zones: green 40-60%, yellow 60-70%, red >70% or <30%
  const getZoneColor = (pct: number) => {
    if (pct >= 40 && pct <= 60) return 'bg-emerald-500'
    if (pct > 60 && pct <= 70) return 'bg-amber-500'
    if (pct < 40 && pct >= 30) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getZoneLabel = (pct: number) => {
    if (pct >= 40 && pct <= 60) return 'אזור אידיאלי'
    if (pct > 60 && pct <= 70) return 'נציג מדבר יותר מדי'
    if (pct < 40 && pct >= 30) return 'נציג שותק יותר מדי'
    if (pct > 70) return 'חריגה - נציג שולט בשיחה'
    return 'חריגה - נציג לא מוביל'
  }

  const repColor = getZoneColor(repPct)

  return (
    <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
      <h3 className="text-base font-semibold text-white mb-4">יחס דיבור/הקשבה</h3>

      <div className="space-y-4">
        {/* Main gauge bar */}
        <div className="relative">
          <div className="flex h-8 rounded-full overflow-hidden bg-white/5">
            <div
              className={`${repColor} transition-all duration-500 flex items-center justify-center`}
              style={{ width: `${repPct}%` }}
            >
              <span className="text-xs font-bold text-white drop-shadow">
                {repPct.toFixed(0)}%
              </span>
            </div>
            <div
              className="bg-indigo-500/60 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${customerPct}%` }}
            >
              <span className="text-xs font-bold text-white drop-shadow">
                {customerPct.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Ideal zone markers */}
          <div className="absolute top-0 h-full pointer-events-none" style={{ left: '40%' }}>
            <div className="h-full border-r border-dashed border-white/20" />
          </div>
          <div className="absolute top-0 h-full pointer-events-none" style={{ left: '60%' }}>
            <div className="h-full border-r border-dashed border-white/20" />
          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs text-white/40">
          <span>{repName || 'נציג'}</span>
          <span>לקוח</span>
        </div>

        {/* Zone indicator */}
        <div className="text-center">
          <span
            className={`inline-block text-xs px-3 py-1 rounded-full ${
              repPct >= 40 && repPct <= 60
                ? 'bg-emerald-500/10 text-emerald-400'
                : repPct > 70 || repPct < 30
                ? 'bg-red-500/10 text-red-400'
                : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            {getZoneLabel(repPct)}
          </span>
        </div>

        {/* Ideal range note */}
        <p className="text-xs text-white/50 text-center">
          אזור ירוק: 40-60% דיבור נציג
        </p>
      </div>
    </div>
  )
}
