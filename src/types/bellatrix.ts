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

/** Who may read a row. Default everywhere is the most restrictive scope that
 * still lets the feature work (minimum-disclosure principle).
 *  - private:          the author only (personal goals, reflections, private notes)
 *  - team:             members of the same team (handover, shared tips)
 *  - manager_visible:  the author + their manager (team-action execution status, observations)
 *  - aggregated:       only ever surfaced as counts/averages, never per-row */
export type VisibilityScope = 'private' | 'team' | 'manager_visible' | 'aggregated'

export type JobCategory = 'electronics' | 'beauty' | 'fashion' | 'telecom' | 'other'

/** Employee-controlled sharing switches. Everything defaults to OFF. */
export interface ConsentSetting {
  /** Let my manager read my shift reflections (they stay private otherwise). */
  share_reflections_with_manager: boolean
  /** Let my team see progress on my personal goals as an aggregate. */
  share_goal_progress_with_team: boolean
}

export const DEFAULT_CONSENT: ConsentSetting = {
  share_reflections_with_manager: false,
  share_goal_progress_with_team: false,
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  /** null for a personal-mode user who has not joined a store team. */
  store_id: string | null
  team_id: string | null
  company_id: string | null
  job_category: JobCategory
  /** Behaviours the person said they want to get better at (onboarding). */
  interests: BehaviourType[]
  consent: ConsentSetting
  /** Seeded sample account — UI labels its data as demo. */
  is_demo: boolean
  created_at: ISODateTime
}

/** A group of people who share announcements, handover and team actions. */
export interface Team {
  id: string
  store_id: string | null
  name: string
  /** Invite code typed by employees (case-insensitive). */
  join_code: string
  created_at: ISODateTime
}

export type TeamRole = 'member' | 'manager'

export interface TeamMembership {
  id: string
  team_id: string
  user_id: string
  role: TeamRole
  joined_at: ISODateTime
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

export type ShiftSource = 'self' | 'roster'

export interface Shift {
  id: string
  user_id: string
  store_id: string | null
  start_at: ISODateTime
  end_at: ISODateTime
  status: ShiftStatus
  /** self = the employee registered it; roster = the store/manager did. */
  source: ShiftSource
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

export type GoalSource = 'self' | 'recommended'

/** An employee's own behaviour goal. Always private. Never visible to a manager. */
export interface PersonalGoal {
  id: string
  user_id: string
  title: string
  behaviour_type: BehaviourType
  target_count: number | null
  source: GoalSource
  /** Which coaching card the recommendation came from, if any. */
  coaching_card_id: string | null
  active: boolean
  visibility: 'private'
  created_at: ISODateTime
}

/** 30-second Shift Prep content: one behaviour, one script, one product point,
 * one objection with a response, one cross-sell tip. */
export interface CoachingCard {
  id: string
  job_category: JobCategory
  behaviour_type: BehaviourType
  target_metric: TargetMetric
  headline: string
  /** Killer question or a 1–2 line script to say. */
  script: string
  product_point: string
  objection: string
  objection_response: string
  cross_sell_tip: string
  active: boolean
  created_at: ISODateTime
}

/** The employee's pre-shift commitment: "오늘 해볼게요". */
export interface ShiftPrep {
  id: string
  user_id: string
  shift_id: string
  shift_date: ISODate
  coaching_card_id: string
  personal_goal_id: string | null
  action_assignment_id: string | null
  accepted_at: ISODateTime
  visibility: VisibilityScope
}

/** Business campaign (new product launch, promotion) that team actions can be tied to. */
export interface Campaign {
  id: string
  store_id: string
  name: string
  behaviour_type: BehaviourType
  target_metric: TargetMetric
  start_date: ISODate
  end_date: ISODate
  active: boolean
}

export type AssignmentStatus = 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'skipped' | 'expired'

export interface ActionAssignment {
  id: string
  action_id: string
  assigned_by_user_id: string
  assigned_to_user_id: string
  store_id: string
  shift_id: string | null
  campaign_id: string | null
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
  | 'attempted'
  | 'progress_updated'
  | 'completed'
  | 'skipped'
  | 'expired'
  | 'helpful'
  | 'not_helpful'

/** Where the thing being acted on came from. */
export type ActionSource = 'personal' | 'team' | 'manager' | 'ai' | 'system'
export type ActionKind = 'personal_goal' | 'team_action' | 'coaching_card'

/** CRITICAL — the engagement timeline. Never collapse this into a completed flag.
 * Exactly one of action_assignment_id / personal_goal_id / coaching_card_id is set. */
export interface ActionEvent {
  id: string
  user_id: string
  action_kind: ActionKind
  action_assignment_id: string | null
  personal_goal_id: string | null
  coaching_card_id: string | null
  action_id: string | null
  source: ActionSource
  shift_id: string | null
  store_id: string | null
  team_id: string | null
  campaign_id: string | null
  event_type: ActionEventType
  event_at: ISODateTime
  progress_value: number | null
  /** True when the value came from the employee's own tap, not an observer or system. */
  self_report: boolean
  visibility: VisibilityScope
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
  visibility: VisibilityScope
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

export type TriedLevel = 'yes' | 'partly' | 'no'
export type CustomerReaction = 'positive' | 'neutral' | 'negative' | 'no_chance'
export type ConfidenceFeel = 'low' | 'ok' | 'high'

/** 5–15 second post-shift reflection. Private by default; the employee can opt
 * in to sharing with their manager via ConsentSetting. */
export interface ShiftReflection {
  id: string
  user_id: string
  shift_id: string
  shift_date: ISODate
  coaching_card_id: string | null
  personal_goal_id: string | null
  action_assignment_id: string | null
  tried: TriedLevel
  customer_reaction: CustomerReaction
  try_again: boolean
  tip_helpful: boolean | null
  confidence: ConfidenceFeel | null
  win_note: string | null
  visibility: VisibilityScope
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
  | 'signed_up'
  | 'team_joined'
  | 'team_skipped'
  | 'shift_created'
  | 'personal_goal_created'
  | 'goal_attempt_logged'
  | 'shift_prep_viewed'
  | 'shift_prep_accepted'
  | 'my_shift_viewed'

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
  /** null for a personal-mode user with no store. */
  store: Store | null
  team: Team | null
  memberships: TeamMembership[]
  users: User[]
  shifts: Shift[]
  actions: Action[]
  coaching_cards: CoachingCard[]
  personal_goals: PersonalGoal[]
  shift_preps: ShiftPrep[]
  campaigns: Campaign[]
  assignments: ActionAssignment[]
  action_events: ActionEvent[]
  evidence: BehaviourEvidence[]
  outcomes: OutcomeEvent[]
  reflections: ShiftReflection[]
  pilots: Pilot[]
  pilot_participants: PilotParticipant[]
}

export const JOB_LABEL: Record<JobCategory, string> = {
  electronics: '전자제품 판매',
  beauty: '뷰티 어드바이저',
  fashion: '패션·럭셔리',
  telecom: '통신 판매',
  other: '기타 판매·서비스',
}

export const VISIBILITY_LABEL: Record<VisibilityScope, string> = {
  private: '나만 보기',
  team: '팀에 공개',
  manager_visible: '매니저에게 보임',
  aggregated: '집계로만 반영',
}

export const TRIED_LABEL: Record<TriedLevel, string> = { yes: '해봤어요', partly: '조금 해봤어요', no: '못 했어요' }
export const REACTION_LABEL: Record<CustomerReaction, string> = { positive: '좋았어요', neutral: '보통이었어요', negative: '별로였어요', no_chance: '기회가 없었어요' }
export const CONFIDENCE_FEEL_LABEL: Record<ConfidenceFeel, string> = { low: '아직 어색해요', ok: '할 만해요', high: '자신 있어요' }

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
