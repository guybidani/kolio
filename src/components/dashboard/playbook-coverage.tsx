'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import type { CallAnalysis } from '@/types'

interface PlaybookCoverageProps {
  analysis: CallAnalysis
}

interface PlaybookStage {
  id: string
  label: string
  covered: boolean
  reason: string
}

/**
 * Determines playbook stage coverage from SPIN analysis and scores.
 * Maps analysis data to standard sales call stages.
 */
function getPlaybookStages(analysis: CallAnalysis): PlaybookStage[] {
  const { scores, spin_analysis, objections_detected, next_call_prep } = analysis

  // Opening - based on rapport score
  const openingCovered = scores.rapport >= 5
  // Discovery - based on discovery score + SPIN situation/problem questions
  const hasDiscoveryQuestions =
    (spin_analysis?.situation_questions_asked && spin_analysis.situation_questions_asked !== 'N/A' && spin_analysis.situation_questions_asked.length > 5) ||
    (spin_analysis?.problem_questions_asked && spin_analysis.problem_questions_asked !== 'N/A' && spin_analysis.problem_questions_asked.length > 5)
  const discoveryCovered = scores.discovery >= 5 || !!hasDiscoveryQuestions

  // Value presentation - based on value_communication score + SPIN need-payoff
  const hasValuePresentation =
    spin_analysis?.need_payoff_questions_asked && spin_analysis.need_payoff_questions_asked !== 'N/A' && spin_analysis.need_payoff_questions_asked.length > 5
  const valueCovered = scores.value_communication >= 5 || !!hasValuePresentation

  // Objection handling - only if objections were detected, check handling quality
  const hasObjections = objections_detected && objections_detected.length > 0
  const objectionsCovered = hasObjections
    ? scores.objection_handling >= 5
    : true // No objections = not applicable but counted as covered

  // Closing - based on closing score and next steps
  const hasNextSteps = next_call_prep?.closing_strategy && next_call_prep.closing_strategy.length > 5
  const closingCovered = scores.closing >= 5 || !!hasNextSteps

  return [
    {
      id: 'opening',
      label: 'פתיחה',
      covered: openingCovered,
      reason: openingCovered
        ? `ציון ראפור: ${scores.rapport.toFixed(1)}`
        : `ציון ראפור נמוך: ${scores.rapport.toFixed(1)}`,
    },
    {
      id: 'discovery',
      label: 'גילוי צרכים',
      covered: discoveryCovered,
      reason: discoveryCovered
        ? `ציון דיסקברי: ${scores.discovery.toFixed(1)}`
        : `ציון דיסקברי נמוך: ${scores.discovery.toFixed(1)}`,
    },
    {
      id: 'value',
      label: 'הצגת ערך',
      covered: valueCovered,
      reason: valueCovered
        ? `ציון העברת ערך: ${scores.value_communication.toFixed(1)}`
        : `ציון העברת ערך נמוך: ${scores.value_communication.toFixed(1)}`,
    },
    {
      id: 'objections',
      label: 'טיפול בהתנגדויות',
      covered: objectionsCovered,
      reason: !hasObjections
        ? 'לא זוהו התנגדויות'
        : objectionsCovered
        ? `ציון טיפול: ${scores.objection_handling.toFixed(1)}`
        : `ציון טיפול נמוך: ${scores.objection_handling.toFixed(1)}`,
    },
    {
      id: 'closing',
      label: 'סגירה',
      covered: closingCovered,
      reason: closingCovered
        ? `ציון סגירה: ${scores.closing.toFixed(1)}`
        : `ציון סגירה נמוך: ${scores.closing.toFixed(1)}`,
    },
  ]
}

export function PlaybookCoverage({ analysis }: PlaybookCoverageProps) {
  const stages = getPlaybookStages(analysis)
  const coveredCount = stages.filter((s) => s.covered).length

  return (
    <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">כיסוי תסריט מכירה</h3>
          <span className="text-sm text-muted-foreground">
            {coveredCount}/{stages.length} שלבים
          </span>
        </div>
      </div>
      <div className="px-5 pb-5">
        {/* Visual pipeline */}
        <div className="flex items-center gap-1 mb-4">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-center flex-1">
              <div
                className={`h-2 w-full rounded-full transition-colors ${
                  stage.covered ? 'bg-emerald-500' : 'bg-red-500/40'
                }`}
              />
              {i < stages.length - 1 && <div className="w-1 shrink-0" />}
            </div>
          ))}
        </div>

        {/* Stage list */}
        <div className="space-y-2">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={`flex items-center gap-3 rounded-lg p-2.5 transition-colors ${
                stage.covered
                  ? 'bg-emerald-500/5 border border-emerald-500/20'
                  : 'bg-red-500/5 border border-red-500/20'
              }`}
            >
              {stage.covered ? (
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="h-4.5 w-4.5 text-red-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{stage.label}</span>
                <p className="text-xs text-muted-foreground truncate">{stage.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
