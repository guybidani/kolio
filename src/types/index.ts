export type Plan = 'TRIAL' | 'STARTER' | 'PRO' | 'ENTERPRISE'
export type UserRole = 'ADMIN' | 'MANAGER' | 'REP' | 'VIEWER'
export type CallDirection = 'INBOUND' | 'OUTBOUND' | 'UNKNOWN'
export type CallStatus = 'UPLOADED' | 'TRANSCRIBING' | 'TRANSCRIBED' | 'ANALYZING' | 'COMPLETE' | 'FAILED'
export type CallSource = 'PBX_WEBHOOK' | 'MANUAL_UPLOAD' | 'MOBILE_APP' | 'GOOGLE_DRIVE'

export interface CallScores {
  overall: number
  discovery: number
  objection_handling: number
  closing: number
  rapport: number
  value_communication: number
}

export interface CallAnalysis {
  call_metadata: {
    prospect_name: string
    prospect_business: string
    prospect_tier: string
    estimated_media_budget: string
    call_duration_estimate: string
    decision_maker: boolean
    other_stakeholders: string | null
  }
  summary: {
    prospect_needs: string
    what_was_offered: string
    what_was_agreed: string
    current_marketing: string
  }
  scores: CallScores
  scores_reasoning: string
  buying_signals: Array<{
    signal: string
    interpretation: string
    was_leveraged: boolean
    how_to_leverage: string
  }>
  objections_detected: Array<{
    objection: string
    type: string
    how_handled: string
    effectiveness: string
    suggested_response: string
  }>
  pain_points: Array<{
    pain: string
    explicit: boolean
    was_deepened: boolean
    deepening_suggestion: string
  }>
  retention_points: Array<{
    what: string
    when_in_call: string
    why_effective: string
    quote: string | null
    playbook_worthy: boolean
  }>
  improvement_points: Array<{
    what: string
    when_in_call: string
    current_behavior: string
    suggested_behavior: string
    quote_current: string | null
    quote_suggested: string
    impact: 'high' | 'medium' | 'low'
  }>
  next_call_prep: {
    recommended_callback: string
    opening_line: string
    key_points_to_address: string[]
    materials_to_prepare: string[]
    objections_to_preempt: string[]
    closing_strategy: string
  }
  missed_opportunities: string[]
  spin_analysis: {
    situation_questions_asked: string
    situation_questions_missing: string
    problem_questions_asked: string
    problem_questions_missing: string
    implication_questions_asked: string
    implication_questions_missing: string
    need_payoff_questions_asked: string
    need_payoff_questions_missing: string
  }
  _internal?: {
    israeli_market_insight: string
    objection_pattern_id: string
    prospect_persona: string
    sales_stage_accuracy: string
    closing_window_detected: boolean
    closing_window_description: string
    competitor_mentions: string[]
    budget_signals: string
    decision_timeline: string
    trust_level: string
    conversion_probability: number
    recommended_approach_next: string
    pattern_tags: string[]
    learnings_for_playbook: string
  }
}

export interface RepStats {
  id: string
  name: string
  avatarUrl?: string
  totalCalls: number
  avgScore: number
  avgDiscovery: number
  avgClosing: number
  avgObjectionHandling: number
  trend: number // +/- compared to last period
}

export interface DashboardStats {
  totalCalls: number
  avgScore: number
  totalReps: number
  callsThisWeek: number
  scoreChange: number
  topRep: RepStats | null
}
