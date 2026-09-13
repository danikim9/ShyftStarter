// ---------------------------------------------------------------------------
// Bellatrix app state: session (who), dataset (what) and all write operations.
// Screens never talk to the repository directly. Every write:
//   1. calls the repo (local or Supabase),
//   2. optimistically updates the in-memory dataset,
//   3. records a product analytics event,
//   4. surfaces failures as a toast — never silently.
//
// Privacy: personal goals, reflections, shift preps and personal-goal events
// are written with visibility 'private'. Team-action execution status is
// 'manager_visible'. Nothing here ever widens a scope silently.
// ---------------------------------------------------------------------------
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  ActionAssignment,
  ActionEventType,
  AttemptBucket,
  BehaviourEvidence,
  BehaviourType,
  ConfidenceFeel,
  ConsentSetting,
  CustomerReaction,
  HelpfulnessLevel,
  ISODate,
  JobCategory,
  ObservationResult,
  OutcomeEvent,
  PersonalGoal,
  ProductEventName,
  Shift,
  ShiftPrep,
  Store,
  StoreDataset,
  TargetMetric,
  TriedLevel,
  User,
} from '../types/bellatrix'
import { getRepo, RepoError, type NewRow } from './repo'
import { addDaysISO, atTime, todayISO } from './dates'
import { track } from './tracking'
import { getEvidenceConfidence } from './analytics/confidence'
import { deriveKpis, type RawKpiInput } from './analytics/metrics'
import { progressOf, todayShiftFor } from './selectors'

export type SessionState = { status: 'loading' } | { status: 'signed_out' } | { status: 'signed_in'; user: User }

export type DatasetState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: StoreDataset }
  | { status: 'error'; message: string; retryable: boolean }

export type BxSheet =
  | { kind: 'coaching'; assignmentId: string }
  | { kind: 'checkin'; assignmentId: string }
  | { kind: 'actionDetail'; assignmentId: string }
  | { kind: 'shiftPrep'; shiftId: string }
  | { kind: 'reflection'; shiftId: string }
  | { kind: 'goalComposer' }
  | { kind: 'goalDetail'; goalId: string }
  | { kind: 'shiftComposer'; presetDate?: ISODate; editShiftId?: string }
  | { kind: 'shiftDetail'; shiftId: string }
  | { kind: 'joinTeam' }
  | { kind: 'rolePlay'; cardId: string; goalId?: string }
  | { kind: 'quickQuiz'; cardId: string }
  | { kind: 'assign'; presetUserId?: string }
  | { kind: 'observe'; presetUserId?: string }
  | { kind: 'kpi'; presetDate?: ISODate }
  | { kind: 'csvImport' }
  | null

export interface CheckInInput {
  assignmentId: string
  attempts: AttemptBucket
  helpfulness: HelpfulnessLevel
  note: string
  complete: boolean
}

export interface ObservationInput {
  userId: string
  results: Partial<Record<BehaviourType, ObservationResult>>
  coachingNeeded: boolean | null
  note: string
}

export interface AssignInput {
  actionId: string
  userIds: string[]
  date: ISODate
  targetCount: number | null
  targetMetric: TargetMetric
  campaignId: string | null
}

export interface KpiInput extends RawKpiInput {
  date: ISODate
  storeId: string
}

export interface ReflectionInput {
  shiftId: string
  tried: TriedLevel
  reaction: CustomerReaction
  tryAgain: boolean
  tipHelpful: boolean | null
  confidence: ConfidenceFeel | null
  winNote: string
}

export interface SignUpInput {
  name: string
  email: string
  password?: string
  job_category: JobCategory
  interests: BehaviourType[]
}

export interface NewShiftInput {
  date: ISODate
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
}

export interface RepeatShiftInput {
  /** 0=Sun … 6=Sat */
  weekdays: number[]
  weeks: number
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
}

export interface NewGoalInput {
  title: string
  behaviour_type: BehaviourType
  target_count: number | null
  source: PersonalGoal['source']
  coaching_card_id: string | null
}

interface BellatrixShape {
  repoMode: 'local' | 'supabase'
  session: SessionState
  dataset: DatasetState
  today: ISODate
  // auth / profile
  signIn: (email: string, password?: string) => Promise<void>
  signUp: (input: SignUpInput) => Promise<void>
  signOut: () => Promise<void>
  listDemoAccounts: () => Promise<User[]>
  updateConsent: (consent: ConsentSetting) => Promise<void>
  joinTeam: (code: string) => Promise<string>
  leaveTeam: () => Promise<void>
  reload: () => Promise<void>
  resetDemoData: () => Promise<void>
  // ui
  sheet: BxSheet
  openSheet: (s: BxSheet) => void
  closeSheet: () => void
  toast: string | null
  showToast: (msg: string) => void
  trackEvent: (name: ProductEventName, props?: Record<string, string | number | boolean | null>) => void
  // employee writes
  createShift: (input: NewShiftInput) => Promise<Shift>
  createRepeatShifts: (input: RepeatShiftInput) => Promise<number>
  updateShift: (id: string, input: NewShiftInput) => Promise<void>
  deleteShift: (id: string) => Promise<void>
  createGoal: (input: NewGoalInput) => Promise<PersonalGoal>
  setGoalActive: (id: string, active: boolean) => Promise<void>
  logGoalAttempt: (goalId: string, delta: 1 | -1) => Promise<void>
  acceptShiftPrep: (input: { shiftId: string; coachingCardId: string; personalGoalId: string | null; assignmentId: string | null }) => Promise<void>
  /** Quiz answer (aggregated: managers see counts only) or role-play practice (private). */
  logCardEvent: (input: { cardId: string; type: 'quiz_answered' | 'practiced'; goalId?: string | null; shiftId?: string | null; metadata: Record<string, string | number | boolean | null> }) => Promise<void>
  logActionEvent: (assignmentId: string, type: ActionEventType, progress?: number | null) => Promise<void>
  submitCheckIn: (input: CheckInInput) => Promise<void>
  submitReflection: (input: ReflectionInput) => Promise<void>
  // manager writes
  assignAction: (input: AssignInput) => Promise<void>
  submitObservation: (input: ObservationInput) => Promise<void>
  submitKpi: (input: KpiInput) => Promise<void>
  importOutcomes: (rows: NewRow<OutcomeEvent>[]) => Promise<{ imported: number; failed: number }>
}

const Ctx = createContext<BellatrixShape | null>(null)

const LOOKBACK_DAYS = 35
const LOOKAHEAD_DAYS = 14

function errorMessage(e: unknown, fallback: string): string {
  if (e instanceof RepoError) return e.message
  if (e instanceof Error && e.message) return e.message
  return fallback
}

const EVENT_TO_TRACK: Partial<Record<ActionEventType, ProductEventName>> = {
  started: 'action_started',
  progress_updated: 'action_progress_updated',
  completed: 'action_completed',
  skipped: 'action_skipped',
  accepted: 'coaching_accepted',
}

function statusForEvent(type: ActionEventType, prev: ActionAssignment['status']): ActionAssignment['status'] {
  switch (type) {
    case 'accepted':
      return prev === 'assigned' ? 'accepted' : prev
    case 'started':
    case 'attempted':
    case 'progress_updated':
      return prev === 'completed' ? prev : 'in_progress'
    case 'completed':
      return 'completed'
    case 'skipped':
      return 'skipped'
    case 'expired':
      return 'expired'
    case 'viewed':
    case 'helpful':
    case 'not_helpful':
    case 'quiz_answered':
    case 'practiced':
      return prev
  }
}

export function BellatrixProvider({ children }: { children: ReactNode }) {
  const repo = useMemo(() => getRepo(), [])
  const [session, setSession] = useState<SessionState>({ status: 'loading' })
  const [dataset, setDataset] = useState<DatasetState>({ status: 'idle' })
  const [sheet, setSheet] = useState<BxSheet>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)
  const today = todayISO()

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2800)
  }, [])

  const user = session.status === 'signed_in' ? session.user : null
  const data = dataset.status === 'ready' ? dataset.data : null

  const trackEvent = useCallback(
    (name: ProductEventName, props: Record<string, string | number | boolean | null> = {}) => track(user?.id ?? null, name, props),
    [user?.id]
  )

  const loadFor = useCallback(
    async (u: User) => {
      setDataset({ status: 'loading' })
      try {
        const d = await repo.loadDataset(u, { from: addDaysISO(today, -LOOKBACK_DAYS), to: addDaysISO(today, LOOKAHEAD_DAYS) })
        setDataset({ status: 'ready', data: d })
      } catch (e) {
        const retryable = !(e instanceof RepoError && e.code === 'auth')
        setDataset({ status: 'error', message: errorMessage(e, '데이터를 불러오지 못했어요.'), retryable })
      }
    },
    [repo, today]
  )

  useEffect(() => {
    let cancelled = false
    repo
      .getCurrentUser()
      .then((u) => {
        if (cancelled) return
        if (u) {
          setSession({ status: 'signed_in', user: u })
          track(u.id, 'app_opened', { restored: true })
          void loadFor(u)
        } else setSession({ status: 'signed_out' })
      })
      .catch(() => {
        if (!cancelled) setSession({ status: 'signed_out' })
      })
    return () => {
      cancelled = true
    }
  }, [repo, loadFor])

  const signIn = useCallback(
    async (email: string, password?: string) => {
      const u = await repo.signIn({ email, password })
      setSession({ status: 'signed_in', user: u })
      track(u.id, 'app_opened', { restored: false, role: u.role })
      await loadFor(u)
    },
    [repo, loadFor]
  )

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const u = await repo.signUp(input)
      setSession({ status: 'signed_in', user: u })
      track(u.id, 'signed_up', { job_category: input.job_category, interests: input.interests.length })
      await loadFor(u)
    },
    [repo, loadFor]
  )

  const signOut = useCallback(async () => {
    try {
      await repo.signOut()
    } finally {
      setSession({ status: 'signed_out' })
      setDataset({ status: 'idle' })
      setSheet(null)
    }
  }, [repo])

  const reload = useCallback(async () => {
    if (user) await loadFor(user)
  }, [user, loadFor])

  const resetDemoData = useCallback(async () => {
    try {
      await repo.resetDemoData()
      showToast('데모 데이터를 초기화했어요')
      if (user) await loadFor(user)
    } catch (e) {
      showToast(errorMessage(e, '초기화에 실패했어요'))
    }
  }, [repo, user, loadFor, showToast])

  const updateConsent = useCallback(
    async (consent: ConsentSetting) => {
      if (!user) return
      try {
        const u = await repo.updateConsent(user.id, consent)
        setSession({ status: 'signed_in', user: u })
        showToast('공유 설정을 저장했어요')
      } catch (e) {
        showToast(errorMessage(e, '설정을 저장하지 못했어요'))
        throw e
      }
    },
    [repo, user, showToast]
  )

  const joinTeam = useCallback(
    async (code: string) => {
      if (!user) throw new RepoError('auth', '로그인이 필요해요.')
      const { user: u, team } = await repo.joinTeam(user.id, code)
      setSession({ status: 'signed_in', user: u })
      trackEvent('team_joined', { team_id: team.id })
      await loadFor(u)
      showToast(`${team.name}에 참여했어요`)
      return team.name
    },
    [repo, user, loadFor, showToast, trackEvent]
  )

  const leaveTeam = useCallback(async () => {
    if (!user) return
    try {
      const u = await repo.leaveTeam(user.id)
      setSession({ status: 'signed_in', user: u })
      await loadFor(u)
      showToast('팀을 떠났어요. 개인 기록은 그대로 남아 있어요')
    } catch (e) {
      showToast(errorMessage(e, '팀을 떠나지 못했어요'))
      throw e
    }
  }, [repo, user, loadFor, showToast])

  const patch = useCallback((fn: (d: StoreDataset) => StoreDataset) => {
    setDataset((prev) => (prev.status === 'ready' ? { status: 'ready', data: fn(prev.data) } : prev))
  }, [])

  const requireCtx = useCallback(() => {
    if (!user || !data) throw new RepoError('unknown', '데이터가 준비되지 않았어요. 잠시 후 다시 시도해주세요.')
    return { user, data }
  }, [user, data])

  const guard = useCallback(
    async <T,>(fn: () => Promise<T>, fallback: string): Promise<T> => {
      try {
        return await fn()
      } catch (e) {
        showToast(errorMessage(e, fallback))
        throw e
      }
    },
    [showToast]
  )

  // --- shifts ----------------------------------------------------------------
  const createShift = useCallback(
    (input: NewShiftInput) =>
      guard(async () => {
        const { user: u } = requireCtx()
        const row: NewRow<Shift> = {
          user_id: u.id,
          store_id: u.store_id,
          start_at: atTime(input.date, input.startHour, input.startMinute),
          end_at: atTime(input.date, input.endHour, input.endMinute),
          status: input.date < today ? 'completed' : input.date === today ? 'in_progress' : 'scheduled',
          source: 'self',
        }
        const created = await repo.createShift(row)
        patch((cur) => ({ ...cur, shifts: [...cur.shifts, created] }))
        trackEvent('shift_created', { date: input.date })
        showToast('근무를 등록했어요')
        return created
      }, '근무를 저장하지 못했어요'),
    [guard, requireCtx, repo, patch, trackEvent, showToast, today]
  )

  const createRepeatShifts = useCallback(
    (input: RepeatShiftInput) =>
      guard(async () => {
        const { user: u } = requireCtx()
        if (input.weekdays.length === 0) throw new RepoError('validation', '요일을 하나 이상 골라주세요.')
        const rows: NewRow<Shift>[] = []
        for (let i = 0; i < input.weeks * 7; i++) {
          const date = addDaysISO(today, i)
          const dow = new Date(`${date}T12:00:00`).getDay()
          if (!input.weekdays.includes(dow)) continue
          rows.push({
            user_id: u.id,
            store_id: u.store_id,
            start_at: atTime(date, input.startHour, input.startMinute),
            end_at: atTime(date, input.endHour, input.endMinute),
            status: date === today ? 'in_progress' : 'scheduled',
            source: 'self',
          })
        }
        const created = await repo.createShifts(rows)
        patch((cur) => {
          const ids = new Set(created.map((c) => c.id))
          return { ...cur, shifts: [...cur.shifts.filter((s) => !ids.has(s.id)), ...created] }
        })
        trackEvent('shift_created', { repeat: true, count: created.length })
        showToast(`근무 ${created.length}개를 등록했어요`)
        return created.length
      }, '반복 근무를 저장하지 못했어요'),
    [guard, requireCtx, repo, patch, trackEvent, showToast, today]
  )

  const updateShift = useCallback(
    (id: string, input: NewShiftInput) =>
      guard(async () => {
        const { user: u } = requireCtx()
        const updated = await repo.updateShift(id, u.id, { start_at: atTime(input.date, input.startHour, input.startMinute), end_at: atTime(input.date, input.endHour, input.endMinute) })
        patch((cur) => ({ ...cur, shifts: cur.shifts.map((s) => (s.id === id ? updated : s)) }))
        showToast('근무 시간을 수정했어요')
      }, '근무를 수정하지 못했어요'),
    [guard, requireCtx, repo, patch, showToast]
  )

  const deleteShift = useCallback(
    (id: string) =>
      guard(async () => {
        const { user: u } = requireCtx()
        await repo.deleteShift(id, u.id)
        patch((cur) => ({ ...cur, shifts: cur.shifts.filter((s) => s.id !== id) }))
        showToast('근무를 삭제했어요')
      }, '근무를 삭제하지 못했어요'),
    [guard, requireCtx, repo, patch, showToast]
  )

  // --- personal goals (private) ---------------------------------------------
  const createGoal = useCallback(
    (input: NewGoalInput) =>
      guard(async () => {
        const { user: u } = requireCtx()
        const created = await repo.createPersonalGoal({ ...input, user_id: u.id, active: true, visibility: 'private' })
        patch((cur) => ({ ...cur, personal_goals: [...cur.personal_goals, created] }))
        trackEvent('personal_goal_created', { source: input.source, behaviour: input.behaviour_type })
        showToast('내 목표에 추가했어요')
        return created
      }, '목표를 저장하지 못했어요'),
    [guard, requireCtx, repo, patch, trackEvent, showToast]
  )

  const setGoalActive = useCallback(
    (id: string, active: boolean) =>
      guard(async () => {
        const updated = await repo.updatePersonalGoal(id, { active })
        patch((cur) => ({ ...cur, personal_goals: cur.personal_goals.map((g) => (g.id === id ? updated : g)) }))
        showToast(active ? '목표를 다시 켰어요' : '목표를 보관했어요')
      }, '목표를 저장하지 못했어요'),
    [guard, repo, patch, showToast]
  )

  const logGoalAttempt = useCallback(
    (goalId: string, delta: 1 | -1) =>
      guard(async () => {
        const { user: u, data: d } = requireCtx()
        const goal = d.personal_goals.find((g) => g.id === goalId)
        if (!goal) throw new RepoError('not_found', '목표를 찾을 수 없어요.')
        const shift = todayShiftFor(d, u.id, today)
        const todayCount = d.action_events.filter((e) => e.personal_goal_id === goalId && e.event_type === 'attempted' && e.event_at.slice(0, 10) === today).length
        const next = Math.max(0, todayCount + delta)
        const ev = await repo.createActionEvent({
          user_id: u.id,
          action_kind: 'personal_goal',
          action_assignment_id: null,
          personal_goal_id: goalId,
          coaching_card_id: goal.coaching_card_id,
          action_id: null,
          source: goal.source === 'recommended' ? 'ai' : 'personal',
          shift_id: shift?.id ?? null,
          store_id: u.store_id,
          team_id: u.team_id,
          campaign_id: null,
          event_type: delta > 0 ? 'attempted' : 'progress_updated',
          event_at: new Date().toISOString(),
          progress_value: next,
          self_report: true,
          visibility: 'private',
          metadata: null,
        })
        patch((cur) => ({ ...cur, action_events: [...cur.action_events, ev] }))
        if (delta > 0) trackEvent('goal_attempt_logged', { goal_id: goalId, behaviour: goal.behaviour_type })
      }, '시도를 기록하지 못했어요'),
    [guard, requireCtx, repo, patch, trackEvent, today]
  )

  // --- shift prep (private) ---------------------------------------------------
  const acceptShiftPrep = useCallback(
    (input: { shiftId: string; coachingCardId: string; personalGoalId: string | null; assignmentId: string | null }) =>
      guard(async () => {
        const { user: u, data: d } = requireCtx()
        const shift = d.shifts.find((s) => s.id === input.shiftId)
        if (!shift) throw new RepoError('not_found', '근무를 찾을 수 없어요.')
        const prep: Omit<ShiftPrep, 'id'> = {
          user_id: u.id,
          shift_id: shift.id,
          shift_date: shift.start_at.slice(0, 10),
          coaching_card_id: input.coachingCardId,
          personal_goal_id: input.personalGoalId,
          action_assignment_id: input.assignmentId,
          accepted_at: new Date().toISOString(),
          visibility: 'private',
        }
        const created = await repo.createShiftPrep(prep)
        const ev = await repo.createActionEvent({
          user_id: u.id,
          action_kind: 'coaching_card',
          action_assignment_id: null,
          personal_goal_id: null,
          coaching_card_id: input.coachingCardId,
          action_id: null,
          source: input.assignmentId ? 'team' : 'ai',
          shift_id: shift.id,
          store_id: u.store_id,
          team_id: u.team_id,
          campaign_id: null,
          event_type: 'accepted',
          event_at: created.accepted_at,
          progress_value: null,
          self_report: true,
          visibility: 'private',
          metadata: { personal_goal_id: input.personalGoalId, assignment_id: input.assignmentId },
        })
        patch((cur) => ({
          ...cur,
          shift_preps: [...cur.shift_preps.filter((p) => p.id !== created.id), created],
          action_events: [...cur.action_events, ev],
        }))
        trackEvent('shift_prep_accepted', { shift_id: shift.id, card_id: input.coachingCardId })
        showToast('오늘 해볼 행동을 정했어요 — 근무 잘 다녀와요')
      }, '준비를 저장하지 못했어요'),
    [guard, requireCtx, repo, patch, trackEvent, showToast]
  )

  const logCardEvent = useCallback(
    (input: { cardId: string; type: 'quiz_answered' | 'practiced'; goalId?: string | null; shiftId?: string | null; metadata: Record<string, string | number | boolean | null> }) =>
      guard(async () => {
        const { user: u, data: d } = requireCtx()
        const shift = input.shiftId ? d.shifts.find((s) => s.id === input.shiftId) ?? null : todayShiftFor(d, u.id, today)
        const ev = await repo.createActionEvent({
          user_id: u.id,
          action_kind: 'coaching_card',
          action_assignment_id: null,
          personal_goal_id: null,
          coaching_card_id: input.cardId,
          action_id: null,
          source: 'ai',
          shift_id: shift?.id ?? null,
          store_id: u.store_id,
          team_id: u.team_id,
          campaign_id: null,
          event_type: input.type,
          event_at: new Date().toISOString(),
          progress_value: null,
          self_report: true,
          visibility: input.type === 'quiz_answered' ? 'aggregated' : 'private',
          metadata: { ...input.metadata, goal_id: input.goalId ?? null },
        })
        patch((cur) => ({ ...cur, action_events: [...cur.action_events, ev] }))
        trackEvent(input.type === 'quiz_answered' ? 'quiz_answered' : 'role_play_practiced', { card_id: input.cardId, ...input.metadata })
      }, '기록을 저장하지 못했어요'),
    [guard, requireCtx, repo, patch, trackEvent, today]
  )

  // --- team actions (manager_visible) -----------------------------------------
  const logActionEvent = useCallback(
    (assignmentId: string, type: ActionEventType, progress: number | null = null) =>
      guard(async () => {
        const { user: u, data: d } = requireCtx()
        const assignment = d.assignments.find((a) => a.id === assignmentId)
        if (!assignment) throw new RepoError('not_found', '액션을 찾을 수 없어요.')
        const shift = todayShiftFor(d, u.id, today)
        const nextStatus = statusForEvent(type, assignment.status)
        const ev = await repo.createActionEvent({
          user_id: u.id,
          action_kind: 'team_action',
          action_assignment_id: assignmentId,
          personal_goal_id: null,
          coaching_card_id: null,
          action_id: assignment.action_id,
          source: 'manager',
          shift_id: assignment.shift_id ?? shift?.id ?? null,
          store_id: assignment.store_id,
          team_id: u.team_id,
          campaign_id: assignment.campaign_id,
          event_type: type,
          event_at: new Date().toISOString(),
          progress_value: progress,
          self_report: type !== 'viewed',
          visibility: 'manager_visible',
          metadata: null,
        })
        if (nextStatus !== assignment.status) await repo.updateAssignmentStatus(assignmentId, nextStatus)
        patch((cur) => ({
          ...cur,
          action_events: [...cur.action_events, ev],
          assignments: cur.assignments.map((a) => (a.id === assignmentId ? { ...a, status: nextStatus } : a)),
        }))
        const tname = EVENT_TO_TRACK[type]
        if (tname) trackEvent(tname, { assignment_id: assignmentId, action_id: assignment.action_id, progress })
      }, '진행 기록을 저장하지 못했어요'),
    [guard, requireCtx, repo, patch, trackEvent, today]
  )

  const submitCheckIn = useCallback(
    (input: CheckInInput) =>
      guard(async () => {
        const { user: u, data: d } = requireCtx()
        const assignment = d.assignments.find((a) => a.id === input.assignmentId)
        const action = assignment && d.actions.find((a) => a.id === assignment.action_id)
        if (!assignment || !action) throw new RepoError('not_found', '액션을 찾을 수 없어요.')
        const shiftId = assignment.shift_id ?? todayShiftFor(d, u.id, today)?.id ?? null
        const corroborated = d.evidence.some(
          (e) => e.evidence_source === 'manager_observation' && e.user_id === u.id && e.shift_id === shiftId && e.behaviour_type === action.behaviour_type && e.evidence_value === 'observed'
        )
        const now = new Date().toISOString()
        const row: NewRow<BehaviourEvidence> = {
          user_id: u.id,
          store_id: assignment.store_id,
          shift_id: shiftId,
          action_id: action.id,
          action_assignment_id: assignment.id,
          behaviour_type: action.behaviour_type,
          evidence_source: 'employee_self_report',
          evidence_value: input.attempts,
          confidence_level: getEvidenceConfidence('employee_self_report', { corroboratedByObservation: corroborated }),
          observer_user_id: null,
          helpfulness: input.helpfulness,
          coaching_needed: null,
          note: input.note.trim() || null,
          // Execution status of a team action is visible to the manager; the free-text note stays with the count.
          visibility: 'manager_visible',
          observed_at: now,
        }
        const [created] = await repo.createEvidence([row])
        patch((cur) => ({ ...cur, evidence: [...cur.evidence, created] }))
        trackEvent('behaviour_checkin_submitted', { assignment_id: assignment.id, attempts: input.attempts, helpfulness: input.helpfulness })
        if (input.complete && assignment.status !== 'completed') {
          await logActionEvent(assignment.id, 'completed', assignment.target_count ?? Math.max(progressOf(d, assignment), 1))
        }
        await logActionEvent(assignment.id, input.helpfulness === 'not_really' ? 'not_helpful' : 'helpful')
        showToast('기록했어요 — 시도한 만큼 근거가 쌓여요')
      }, '체크인을 저장하지 못했어요'),
    [guard, requireCtx, repo, patch, trackEvent, logActionEvent, showToast, today]
  )

  // --- reflection (private unless consented) ---------------------------------
  const submitReflection = useCallback(
    (input: ReflectionInput) =>
      guard(async () => {
        const { user: u, data: d } = requireCtx()
        const shift = d.shifts.find((s) => s.id === input.shiftId)
        if (!shift) throw new RepoError('not_found', '근무를 찾을 수 없어요.')
        const prep = d.shift_preps.find((p) => p.shift_id === shift.id && p.user_id === u.id) ?? null
        const created = await repo.createReflection({
          user_id: u.id,
          shift_id: shift.id,
          shift_date: shift.start_at.slice(0, 10),
          coaching_card_id: prep?.coaching_card_id ?? null,
          personal_goal_id: prep?.personal_goal_id ?? null,
          action_assignment_id: prep?.action_assignment_id ?? null,
          tried: input.tried,
          customer_reaction: input.reaction,
          try_again: input.tryAgain,
          tip_helpful: input.tipHelpful,
          confidence: input.confidence,
          win_note: input.winNote.trim() || null,
          visibility: u.consent.share_reflections_with_manager ? 'manager_visible' : 'private',
        })
        patch((cur) => ({ ...cur, reflections: [...cur.reflections, created] }))
        trackEvent('shift_reflection_submitted', { shift_id: shift.id, tried: input.tried, reaction: input.reaction, try_again: input.tryAgain })
        if (prep?.coaching_card_id && input.tipHelpful !== null) {
          const ev = await repo.createActionEvent({
            user_id: u.id,
            action_kind: 'coaching_card',
            action_assignment_id: null,
            personal_goal_id: null,
            coaching_card_id: prep.coaching_card_id,
            action_id: null,
            source: prep.action_assignment_id ? 'team' : 'ai',
            shift_id: shift.id,
            store_id: u.store_id,
            team_id: u.team_id,
            campaign_id: null,
            event_type: input.tipHelpful ? 'helpful' : 'not_helpful',
            event_at: created.created_at,
            progress_value: null,
            self_report: true,
            visibility: 'aggregated',
            metadata: { tried: input.tried },
          })
          patch((cur) => ({ ...cur, action_events: [...cur.action_events, ev] }))
        }
        showToast(input.tried === 'no' ? '기록했어요. 다음 근무에 다시 해봐요' : '오늘도 하나 해냈어요 🙌')
      }, '회고를 저장하지 못했어요'),
    [guard, requireCtx, repo, patch, trackEvent, showToast]
  )

  // --- manager ---------------------------------------------------------------
  const assignAction = useCallback(
    (input: AssignInput) =>
      guard(async () => {
        const { user: u, data: d } = requireCtx()
        if (!u.store_id) throw new RepoError('validation', '매장에 소속된 매니저만 배정할 수 있어요.')
        if (input.userIds.length === 0) throw new RepoError('validation', '대상 직원을 한 명 이상 선택해주세요.')
        const storeId = u.store_id
        const rows: NewRow<ActionAssignment>[] = input.userIds.map((uid) => ({
          action_id: input.actionId,
          assigned_by_user_id: u.id,
          assigned_to_user_id: uid,
          store_id: storeId,
          shift_id: d.shifts.find((s) => s.user_id === uid && s.start_at.slice(0, 10) === input.date)?.id ?? null,
          campaign_id: input.campaignId,
          assigned_date: input.date,
          target_count: input.targetCount,
          target_metric: input.targetMetric,
          status: 'assigned',
        }))
        const created = await repo.createAssignments(rows)
        patch((cur) => ({ ...cur, assignments: [...cur.assignments, ...created] }))
        trackEvent('action_assigned', { action_id: input.actionId, count: created.length, date: input.date, campaign_id: input.campaignId })
        showToast(`${created.length}명에게 팀 액션을 보냈어요`)
      }, '액션을 배정하지 못했어요'),
    [guard, requireCtx, repo, patch, trackEvent, showToast]
  )

  const submitObservation = useCallback(
    (input: ObservationInput) =>
      guard(async () => {
        const { user: u, data: d } = requireCtx()
        if (!u.store_id) throw new RepoError('validation', '매장에 소속된 매니저만 기록할 수 있어요.')
        const entries = Object.entries(input.results).filter((x): x is [BehaviourType, ObservationResult] => x[1] !== undefined)
        if (entries.length === 0) throw new RepoError('validation', '최소 한 가지 행동은 관찰함/관찰 안 됨으로 표시해주세요.')
        const shift = todayShiftFor(d, input.userId, today)
        const now = new Date().toISOString()
        const storeId = u.store_id
        const rows: NewRow<BehaviourEvidence>[] = entries.map(([behaviour, result]) => ({
          user_id: input.userId,
          store_id: storeId,
          shift_id: shift?.id ?? null,
          action_id: null,
          action_assignment_id: null,
          behaviour_type: behaviour,
          evidence_source: 'manager_observation',
          evidence_value: result,
          confidence_level: getEvidenceConfidence('manager_observation'),
          observer_user_id: u.id,
          helpfulness: null,
          coaching_needed: input.coachingNeeded,
          note: input.note.trim() || null,
          visibility: 'manager_visible',
          observed_at: now,
        }))
        const created = await repo.createEvidence(rows)
        patch((cur) => ({ ...cur, evidence: [...cur.evidence, ...created] }))
        trackEvent('manager_observation_submitted', { observed_user_id: input.userId, behaviours: entries.length, coaching_needed: input.coachingNeeded })
        showToast('관찰을 기록했어요')
      }, '관찰을 저장하지 못했어요'),
    [guard, requireCtx, repo, patch, trackEvent, showToast, today]
  )

  const submitKpi = useCallback(
    (input: KpiInput) =>
      guard(async () => {
        const { data: d } = requireCtx()
        if (!d.store) throw new RepoError('validation', '매장 정보가 없어요.')
        const raw: RawKpiInput = {
          visitors: input.visitors,
          transactions: input.transactions,
          revenue: input.revenue,
          units: input.units,
          accessory_units: input.accessory_units,
          accessory_transactions: input.accessory_transactions,
        }
        const row: NewRow<OutcomeEvent> = {
          company_id: d.company?.id ?? null,
          store_id: input.storeId,
          user_id: null,
          shift_id: null,
          outcome_date: input.date,
          ...raw,
          ...deriveKpis(raw, d.store.attach_rate_definition),
          source: 'manual',
        }
        const saved = await repo.upsertOutcome(row)
        patch((cur) => ({ ...cur, outcomes: [...cur.outcomes.filter((o) => o.id !== saved.id), saved] }))
        trackEvent('kpi_submitted', { date: input.date, store_id: input.storeId })
        showToast('오늘 성과를 저장했어요')
      }, 'KPI를 저장하지 못했어요'),
    [guard, requireCtx, repo, patch, trackEvent, showToast]
  )

  const importOutcomes = useCallback(
    async (rows: NewRow<OutcomeEvent>[]) => {
      requireCtx()
      let imported = 0
      let failed = 0
      const saved: OutcomeEvent[] = []
      for (const row of rows) {
        try {
          saved.push(await repo.upsertOutcome(row))
          imported++
        } catch {
          failed++
        }
      }
      patch((cur) => {
        const ids = new Set(saved.map((s) => s.id))
        return { ...cur, outcomes: [...cur.outcomes.filter((o) => !ids.has(o.id)), ...saved] }
      })
      trackEvent('kpi_csv_imported', { imported, failed })
      showToast(failed === 0 ? `${imported}행을 가져왔어요` : `${imported}행 성공 · ${failed}행 실패`)
      return { imported, failed }
    },
    [requireCtx, repo, patch, trackEvent, showToast]
  )

  const value = useMemo<BellatrixShape>(
    () => ({
      repoMode: repo.mode,
      session,
      dataset,
      today,
      signIn,
      signUp,
      signOut,
      listDemoAccounts: () => repo.listDemoAccounts(),
      updateConsent,
      joinTeam,
      leaveTeam,
      reload,
      resetDemoData,
      sheet,
      openSheet: setSheet,
      closeSheet: () => setSheet(null),
      toast,
      showToast,
      trackEvent,
      createShift,
      createRepeatShifts,
      updateShift,
      deleteShift,
      createGoal,
      setGoalActive,
      logGoalAttempt,
      acceptShiftPrep,
      logCardEvent,
      logActionEvent,
      submitCheckIn,
      submitReflection,
      assignAction,
      submitObservation,
      submitKpi,
      importOutcomes,
    }),
    [
      repo,
      session,
      dataset,
      today,
      signIn,
      signUp,
      signOut,
      updateConsent,
      joinTeam,
      leaveTeam,
      reload,
      resetDemoData,
      sheet,
      toast,
      showToast,
      trackEvent,
      createShift,
      createRepeatShifts,
      updateShift,
      deleteShift,
      createGoal,
      setGoalActive,
      logGoalAttempt,
      acceptShiftPrep,
      logCardEvent,
      logActionEvent,
      submitCheckIn,
      submitReflection,
      assignAction,
      submitObservation,
      submitKpi,
      importOutcomes,
    ]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useBellatrix(): BellatrixShape {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useBellatrix must be used within BellatrixProvider')
  return ctx
}

/** Signed-in user + ready dataset, or null while loading. */
export function useReadyData(): { user: User; data: StoreDataset } | null {
  const { session, dataset } = useBellatrix()
  if (session.status !== 'signed_in' || dataset.status !== 'ready') return null
  return { user: session.user, data: dataset.data }
}

/** Manager screens need a store. Returns null until the dataset (with store) is ready. */
export function useManagerData(): { user: User; data: StoreDataset; store: Store } | null {
  const ready = useReadyData()
  if (!ready || !ready.data.store) return null
  return { ...ready, store: ready.data.store }
}
