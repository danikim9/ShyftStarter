// ---------------------------------------------------------------------------
// Bellatrix core domain — Frontline Behavioral Intelligence.
//
// Data chain the whole product is built around:
//   User → Shift → Intervention(Action/Assignment) → ActionEvent
//        → BehaviourEvidence → OutcomeEvent → Insight
//
// Field names are snake_case on purpose: these types mirror the Supabase
// tables in supabase/migrations 1:1 so the repository layer needs no mapping.
// ---------------------------------------------------------------------------

export type ISODate = string // 'YYYY-MM-DD'
export type ISODateTime = string // full ISO-8601 timestamp

export type UserRole = 'employee' | 'manager' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  store_id: string
  company_id: string | null
  created_at: ISODateTime
}

export interface Company {
  id: string
  name: string
  vertical: string
  created_at: ISODateTime
}

/** How Attach Rate is computed for a store. Deliberately configurable — the
 * definition differs between retailers, so we never hard-code one formula. */
export type AttachRateDefinition =
  | 'accessory_units_per_transaction' // accessory_units / transactions
  | 'accessory_transactions_per_transaction' // accessory_transactions / transactions
  | 'accessory_units_per_unit' // accessory_units / units

export type TargetMetric = 'cvr' | 'atv' | 'upt' | 'attach_rate' | 'revenue' | 'none'

export interface Store {
  id: string
  company_id: string
  name: string
  location: string | null
  vertical: string
  attach_rate_definition: AttachRateDefinition
  /** The KPI this store is currently trying to move — drives Today's Focus fallback. */
  focus_metric: TargetMetric
  created_at: ISODateTime
}

export type ShiftStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export interface Shift {
  id: string
  user_id: string
  store_id: string
  start_at: ISODateTime
  end_at: ISODateTime
  status: ShiftStatus
  created_at: ISODateTime
}

export type BehaviourType =
  | 'discovery'
  | 'demo'
  | 'recommendation'
  | 'cross_sell'
  | 'closing'
  | 'product_knowledge'
  | 'operational'
  | 'other'

export type InterventionType = 'action' | 'micro_coaching' | 'mini_quest'

/** Reusable intervention / behaviour definition (the "what we ask people to try"). */
export interface Action {
  id: string
  title: string
  description: string
  behaviour_type: BehaviourType
  intervention_type: InterventionType
  target_metric: TargetMetric
  default_target_count: number | null
  coaching_text: string | null
  active: boolean
  created_at: ISODateTime
}

export type AssignmentStatus = 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'skipped' | 'expired'

export interface ActionAssignment {
  id: string
  action_id: string
  assigned_by_user_id: string
  assigned_to_user_id: string
  store_id: string
  shift_id: string | null
  assigned_date: ISODate
  target_count: number | null
  target_metric: TargetMetric | null
  status: AssignmentStatus
  created_at: ISODateTime
}

export type ActionEventType =
  | 'viewed'
  | 'accepted'
  | 'started'
  | 'progress_updated'
  | 'completed'
  | 'skipped'
  | 'expired'

/** CRITICAL — the engagement timeline. Never collapse this into a completed flag. */
export interface ActionEvent {
  id: string
  action_assignment_id: string
  user_id: string
  shift_id: string | null
  event_type: ActionEventType
  event_at: ISODateTime
  progress_value: number | null
  metadata: Record<string, string | number | boolean | null> | null
}

export type EvidenceSource = 'employee_self_report' | 'manager_observation' | 'digital_signal' | 'system_inference'
export type ConfidenceLevel = 'low' | 'medium' | 'high'

/** Self-reported attempt-count bucket from the 20-second check-in. */
export type AttemptBucket = '0' | '1-2' | '3-5' | '5+'
export type HelpfulnessLevel = 'not_really' | 'a_little' | 'very_helpful'
export type ObservationResult = 'observed' | 'not_observed'

/** CRITICAL — evidence that a behaviour happened. Self-report ≠ verified. */
export interface BehaviourEvidence {
  id: string
  user_id: string
  store_id: string
  shift_id: string | null
  action_id: string | null
  action_assignment_id: string | null
  behaviour_type: BehaviourType
  evidence_source: EvidenceSource
  /** Source-dependent value: AttemptBucket for self-report, ObservationResult for manager. */
  evidence_value: string
  confidence_level: ConfidenceLevel
  observer_user_id: string | null
  helpfulness: HelpfulnessLevel | null
  coaching_needed: boolean | null
  note: string | null
  observed_at: ISODateTime
  created_at: ISODateTime
}

export type OutcomeSource = 'manual' | 'csv' | 'api'

/** CRITICAL — business outcome for a store/day (optionally per employee). */
export interface OutcomeEvent {
  id: string
  company_id: string | null
  store_id: string
  user_id: string | null
  shift_id: string | null
  outcome_date: ISODate
  visitors: number | null
  transactions: number | null
  revenue: number | null
  units: number | null
  accessory_units: number | null
  accessory_transactions: number | null
  cvr: number | null
  atv: number | null
  upt: number | null
  attach_rate: number | null
  source: OutcomeSource
  created_at: ISODateTime
}

export type PerceivedSalesLevel = 'lower' | 'similar' | 'higher'
export type CoachingHelpfulness = 1 | 2 | 3 | 4 | 5

export interface ShiftReflection {
  id: string
  user_id: string
  shift_id: string
  dominant_behaviour: BehaviourType
  perceived_sales_level: PerceivedSalesLevel
  coaching_helpfulness: CoachingHelpfulness
  note: string | null
  created_at: ISODateTime
}

export type PilotStatus = 'planned' | 'active' | 'completed'
export type PilotGroup = 'intervention' | 'control'

export interface Pilot {
  id: string
  company_id: string
  store_id: string | null
  name: string
  start_date: ISODate
  end_date: ISODate
  target_behaviour: BehaviourType
  target_metric: TargetMetric
  status: PilotStatus
}

export interface PilotParticipant {
  id: string
  pilot_id: string
  user_id: string
  group_type: PilotGroup
}

export type ProductEventName =
  | 'app_opened'
  | 'today_viewed'
  | 'coaching_viewed'
  | 'coaching_accepted'
  | 'action_started'
  | 'action_progress_updated'
  | 'action_completed'
  | 'action_skipped'
  | 'behaviour_checkin_submitted'
  | 'shift_reflection_submitted'
  | 'manager_observation_submitted'
  | 'action_assigned'
  | 'kpi_submitted'
  | 'kpi_csv_imported'
  | 'insight_viewed'
  | 'growth_viewed'

export interface ProductEvent {
  id: string
  user_id: string
  event_name: ProductEventName
  occurred_at: ISODateTime
  properties: Record<string, string | number | boolean | null> | null
}

// ---------------------------------------------------------------------------
// Aggregates used by the store / analytics layer
// ---------------------------------------------------------------------------

/** Everything the app needs for one store over a time window. Employees only
 * receive their own private rows (enforced by RLS on Supabase, filtered
 * locally in the offline adapter). */
export interface StoreDataset {
  company: Company | null
  store: Store
  users: User[]
  shifts: Shift[]
  actions: Action[]
  assignments: ActionAssignment[]
  action_events: ActionEvent[]
  evidence: BehaviourEvidence[]
  outcomes: OutcomeEvent[]
  reflections: ShiftReflection[]
  pilots: Pilot[]
  pilot_participants: PilotParticipant[]
}

export const BEHAVIOUR_LABEL: Record<BehaviourType, string> = {
  discovery: '니즈 파악',
  demo: '시연',
  recommendation: '추천·비교',
  cross_sell: '크로스셀',
  closing: '클로징',
  product_knowledge: '제품 지식',
  operational: '운영',
  other: '기타',
}

export const METRIC_LABEL: Record<TargetMetric, string> = {
  cvr: 'CVR (구매 전환율)',
  atv: 'ATV (객단가)',
  upt: 'UPT (건당 수량)',
  attach_rate: 'Attach Rate (부가상품 부착률)',
  revenue: '매출',
  none: '지정 안 함',
}

export const METRIC_SHORT: Record<TargetMetric, string> = {
  cvr: 'CVR',
  atv: 'ATV',
  upt: 'UPT',
  attach_rate: 'Attach Rate',
  revenue: '매출',
  none: '—',
}

export const INTERVENTION_LABEL: Record<InterventionType, string> = {
  action: '행동 액션',
  micro_coaching: '마이크로 코칭',
  mini_quest: '미니 퀘스트',
}

export const ATTEMPT_BUCKET_LABEL: Record<AttemptBucket, string> = {
  '0': '0회',
  '1-2': '1–2회',
  '3-5': '3–5회',
  '5+': '5회+',
}

export const HELPFULNESS_LABEL: Record<HelpfulnessLevel, string> = {
  not_really: '별로',
  a_little: '조금',
  very_helpful: '많이 도움됨',
}
