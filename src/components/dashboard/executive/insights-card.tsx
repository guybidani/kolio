'use client'

import { Sparkles, Lightbulb } from 'lucide-react'

interface InsightsCardProps {
  insights: string[]
}

export function InsightsCard({ insights }: InsightsCardProps) {
  return (
    <div className="rounded-2xl bg-muted/50 backdrop-blur-xl border border-border p-6">
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-5">
        <Sparkles className="h-4 w-4 text-indigo-400" />
        תובנות AI
      </h3>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50"
          >
            <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground/70 leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
