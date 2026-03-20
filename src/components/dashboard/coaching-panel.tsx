'use client'

import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScoreBadge } from './score-badge'
import {
  ThumbsUp,
  AlertTriangle,
  Target,
  MessageSquare,
  Lightbulb,
  BookOpen,
} from 'lucide-react'
import type { CallAnalysis } from '@/types'

interface CoachingPanelProps {
  analysis: CallAnalysis
}

export function CoachingPanel({ analysis }: CoachingPanelProps) {
  const { scores, retention_points, improvement_points, objections_detected, next_call_prep, spin_analysis } = analysis

  return (
    <div className="space-y-4">
      {/* Scores Overview */}
      <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-400" />
            ציונים
          </h3>
        </div>
        <div className="px-5 pb-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <ScoreBadge score={scores.overall} size="lg" showLabel />
              <p className="text-xs text-white/40 mt-1">כולל</p>
            </div>
            <div className="text-center">
              <ScoreBadge score={scores.discovery} size="md" />
              <p className="text-xs text-white/40 mt-1">דיסקברי</p>
            </div>
            <div className="text-center">
              <ScoreBadge score={scores.objection_handling} size="md" />
              <p className="text-xs text-white/40 mt-1">התנגדויות</p>
            </div>
            <div className="text-center">
              <ScoreBadge score={scores.closing} size="md" />
              <p className="text-xs text-white/40 mt-1">סגירה</p>
            </div>
            <div className="text-center">
              <ScoreBadge score={scores.rapport} size="md" />
              <p className="text-xs text-white/40 mt-1">ראפור</p>
            </div>
            <div className="text-center">
              <ScoreBadge score={scores.value_communication} size="md" />
              <p className="text-xs text-white/40 mt-1">העברת ערך</p>
            </div>
          </div>
          {analysis.scores_reasoning && (
            <p className="mt-4 text-sm text-white/40 border-t border-white/10 pt-3">
              {analysis.scores_reasoning}
            </p>
          )}
        </div>
      </div>

      {/* Coaching Tabs */}
      <Tabs defaultValue="retention" className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-white/5 border border-white/10">
          <TabsTrigger value="retention" className="text-xs data-[state=active]:bg-white/10">
            <ThumbsUp className="h-3 w-3 ml-1" />
            חוזקות
          </TabsTrigger>
          <TabsTrigger value="improvement" className="text-xs data-[state=active]:bg-white/10">
            <AlertTriangle className="h-3 w-3 ml-1" />
            לשיפור
          </TabsTrigger>
          <TabsTrigger value="objections" className="text-xs data-[state=active]:bg-white/10">
            <MessageSquare className="h-3 w-3 ml-1" />
            התנגדויות
          </TabsTrigger>
          <TabsTrigger value="next" className="text-xs data-[state=active]:bg-white/10">
            <Lightbulb className="h-3 w-3 ml-1" />
            המשך
          </TabsTrigger>
        </TabsList>

        <TabsContent value="retention" className="mt-4 space-y-3">
          {retention_points?.map((point, i) => (
            <div key={i} className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
              <div className="flex items-start gap-2">
                <ThumbsUp className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-white">{point.what}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {point.when_in_call}
                  </p>
                  <p className="text-sm text-white/60 mt-1">{point.why_effective}</p>
                  {point.quote && (
                    <blockquote className="mt-2 border-r-2 border-emerald-500/40 pr-3 text-sm italic text-white/40">
                      &ldquo;{point.quote}&rdquo;
                    </blockquote>
                  )}
                  {point.playbook_worthy && (
                    <Badge variant="outline" className="mt-2 text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      <BookOpen className="h-3 w-3 ml-1" />
                      שווה playbook
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!retention_points || retention_points.length === 0) && (
            <p className="text-sm text-white/50 text-center py-4">
              אין נקודות חוזק לשיחה זו
            </p>
          )}
        </TabsContent>

        <TabsContent value="improvement" className="mt-4 space-y-3">
          {improvement_points?.map((point, i) => (
            <div key={i} className="rounded-xl bg-orange-500/5 border border-orange-500/20 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-white">{point.what}</p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        point.impact === 'high'
                          ? 'border-red-500/20 text-red-400 bg-red-500/10'
                          : point.impact === 'medium'
                          ? 'border-orange-500/20 text-orange-400 bg-orange-500/10'
                          : 'border-amber-500/20 text-amber-400 bg-amber-500/10'
                      }`}
                    >
                      {point.impact === 'high' ? 'השפעה גבוהה' : point.impact === 'medium' ? 'השפעה בינונית' : 'השפעה נמוכה'}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    {point.when_in_call}
                  </p>
                  {point.quote_current && (
                    <blockquote className="mt-2 border-r-2 border-red-500/30 pr-3 text-sm italic text-white/40">
                      &ldquo;{point.quote_current}&rdquo;
                    </blockquote>
                  )}
                  <div className="mt-2 bg-emerald-500/5 rounded-lg p-2 border border-emerald-500/20">
                    <p className="text-xs font-medium text-emerald-400 mb-1">
                      במקום זאת:
                    </p>
                    <p className="text-sm text-emerald-300/80">
                      &ldquo;{point.quote_suggested}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(!improvement_points || improvement_points.length === 0) && (
            <p className="text-sm text-white/50 text-center py-4">
              אין נקודות לשיפור לשיחה זו
            </p>
          )}
        </TabsContent>

        <TabsContent value="objections" className="mt-4 space-y-3">
          {objections_detected?.map((obj, i) => (
            <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm text-white">{obj.objection}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-white/60">
                      {obj.type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        obj.effectiveness === 'effective'
                          ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10'
                          : obj.effectiveness === 'partially_effective'
                          ? 'border-amber-500/20 text-amber-400 bg-amber-500/10'
                          : 'border-red-500/20 text-red-400 bg-red-500/10'
                      }`}
                    >
                      {obj.effectiveness === 'effective'
                        ? 'טיפול אפקטיבי'
                        : obj.effectiveness === 'partially_effective'
                        ? 'טיפול חלקי'
                        : obj.effectiveness === 'not_handled'
                        ? 'לא טופלה'
                        : 'לא אפקטיבי'}
                    </Badge>
                  </div>
                  <p className="text-sm text-white/50 mt-2">{obj.how_handled}</p>
                  {obj.suggested_response && (
                    <div className="mt-2 bg-indigo-500/5 rounded-lg p-2 border border-indigo-500/20">
                      <p className="text-xs font-medium text-indigo-400 mb-1">
                        תגובה מוצעת:
                      </p>
                      <p className="text-sm text-indigo-300/80">
                        &ldquo;{obj.suggested_response}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!objections_detected || objections_detected.length === 0) && (
            <p className="text-sm text-white/50 text-center py-4">
              לא זוהו התנגדויות בשיחה
            </p>
          )}
        </TabsContent>

        <TabsContent value="next" className="mt-4 space-y-3">
          {next_call_prep && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-4">
              {next_call_prep.recommended_callback && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">מתי להתקשר חזרה</h4>
                  <p className="text-sm text-white/50">
                    {next_call_prep.recommended_callback}
                  </p>
                </div>
              )}
              {next_call_prep.opening_line && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">משפט פתיחה מוצע</h4>
                  <p className="text-sm bg-white/5 rounded-lg p-2 text-white/60 border border-white/10">
                    &ldquo;{next_call_prep.opening_line}&rdquo;
                  </p>
                </div>
              )}
              {next_call_prep.key_points_to_address?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">נקודות לכיסוי</h4>
                  <ul className="list-disc list-inside text-sm text-white/50 space-y-1">
                    {next_call_prep.key_points_to_address.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {next_call_prep.closing_strategy && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">אסטרטגיית סגירה</h4>
                  <p className="text-sm text-white/50">
                    {next_call_prep.closing_strategy}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SPIN Analysis */}
          {spin_analysis && (
            <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="p-4 pb-2">
                <h4 className="text-sm font-medium text-white">ניתוח SPIN</h4>
              </div>
              <div className="px-4 pb-4 space-y-3 text-sm">
                {(['situation', 'problem', 'implication', 'need_payoff'] as const).map(
                  (type) => {
                    const labels = {
                      situation: 'מצב (Situation)',
                      problem: 'בעיה (Problem)',
                      implication: 'השלכה (Implication)',
                      need_payoff: 'תועלת (Need-Payoff)',
                    }
                    const asked = spin_analysis[`${type}_questions_asked`]
                    const missing = spin_analysis[`${type}_questions_missing`]

                    return (
                      <div key={type}>
                        <h5 className="font-medium text-white">{labels[type]}</h5>
                        {asked && (
                          <p className="text-white/40 text-xs mt-0.5">
                            <span className="text-emerald-400">נשאלו:</span> {asked}
                          </p>
                        )}
                        {missing && (
                          <p className="text-white/40 text-xs mt-0.5">
                            <span className="text-orange-400">חסרות:</span> {missing}
                          </p>
                        )}
                      </div>
                    )
                  }
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
