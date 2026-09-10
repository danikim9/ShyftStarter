// ---------------------------------------------------------------------------
// Bellatrix app state: session (who), dataset (what) and all write operations.
// Screens never talk to the repository directly. Every write:
//   1. calls the repo (local or Supabase),
//   2. optimistically updates the in-memory dataset,
//   3. records a product analytics event,
//   4. surfaces failures as a toast — never silently.
// ---------------------------------------------------------------------------
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  ActionAssignment,
  ActionEventType,
  AttemptBucket,
  BehaviourEvidence,
  BehaviourType,
  CoachingHelpfulness,
  HelpfulnessLevel,
  ISODate,
  ObservationResult,
  OutcomeEvent,
  PerceivedSalesLevel,
  ProductEventName,
  StoreDataset,
  TargetMetric,
  User,
} from '../types/bellatrix'
import { getRepo, RepoError, type NewRow } from './repo'
import { addDaysISO, todayISO } from './dates'
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
  | { kind: 'reflection' }
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
  /** When true the assignment is also marked completed. */
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
}

export interface KpiInput extends RawKpiInput {
  date: ISODate
  storeId: string
}

export interface ReflectionInput {
  dominant: BehaviourType
  perceived: PerceivedSalesLevel
  helpfulness: CoachingHelpfulness
  note: string
}

interface BellatrixShape {
  repoMode: 'local' | 'supabase'
  session: SessionState
  dataset: DatasetState
  today: ISODate
  signIn: (email: string, password?: string) => Promise<void>
  signOut: () => Promise<void>
  listDemoAccounts: () => Promise<User[]>
  reload: () => Promise<void>
  resetDemoData: () => Promise<void>
  sheet: BxSheet
  openSheet: (s: BxSheet) => void
  closeSheet: () => void
  toast: string | null
  showToast: (msg: string) => void
  trackEvent: (name: ProductEventName, props?: Record<string, string | number | boolean | null>) => void
  // employee writes
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
const LOOKAHEAD_DAYS = 7

function errorMessage(e: unknown, fallback: string): string {
  if (e instanceof RepoError) return e.message
  if (e instanceof Error && e.message) return e.message
  return fallback
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

  const trackEvent = useCallback(
    (name: ProductEventName, props: Record<string, string | number | boolean | null> = {}) => track(user?.id ?? null, name, props),
    [user?.id]
  )

  const loadFor = useCallback(
    async (u: User) => {
      setDataset({ status: 'loading' })
      try {
        const data = await repo.loadDataset(u.store_id, u, { from: addDaysISO(today, -LOOKBACK_DAYS), to: addDaysISO(today, LOOKAHEAD_DAYS) })
        setDataset({ status: 'ready', data })
      } catch (e) {
        const retryable = !(e instanceof RepoError && e.code === 'auth')
        setDataset({ status: 'error', message: errorMessage(e, '데이터를 불러오지 못했어요.'), retryable })
      }
    },
    [repo, today]
  )

  // Restore session on boot.
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

  /** Mutate the in-memory dataset after a successful write. */
  const patch = useCallback((fn: (d: StoreDataset) => StoreDataset) => {
    setDataset((prev) => (prev.status === 'ready' ? { status: 'ready', data: fn(prev.data) } : prev))
  }, [])

  const data = dataset.status === 'ready' ? dataset.data : null

  const requireCtx = () => {
    if (!user || !data) throw new RepoError('unknown', '데이터가 준비되지 않았어요. 잠시 후 다시 시도해주세요.')
    return { user, data }
  }

  const statusForEvent = (type: ActionEventType, prev: ActionAssignment['status']): ActionAssignment['status'] => {
    switch (type) {
      case 'accepted':
        return prev === 'assigned' ? 'accepted' : prev
      case 'started':
      case 'progress_updated':
        return prev === 'completed' ? prev : 'in_progress'
      case 'completed':
        return 'completed'
      case 'skipped':
        return 'skipped'
      case 'expired':
        return 'expired'
      case 'viewed':
        return prev
    }
  }

  const EVENT_TO_TRACK: Partial<Record<ActionEventType, ProductEventName>> = {
    started: 'action_started',
    progress_updated: 'action_progress_updated',
    completed: 'action_completed',
    skipped: 'action_skipped',
    accepted: 'coaching_accepted',
  }

  const logActionEvent = useCallback(
    async (assignmentId: string, type: ActionEventType, progress: number | null = null) => {
      const { user: u, data: d } = requireCtx()
      const assignment = d.assignments.find((a) => a.id === assignmentId)
      if (!assignment) throw new RepoError('not_found', '액션을 찾을 수 없어요.')
      const shift = todayShiftFor(d, u.id, today)
      const nextStatus = statusForEvent(type, assignment.status)
      try {
        const ev = await repo.createActionEvent({
          action_assignment_id: assignmentId,
          user_id: u.id,
          shift_id: assignment.shift_id ?? shift?.id ?? null,
          event_type: type,
          event_at: new Date().toISOString(),
          progress_value: progress,
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
      } catch (e) {
        showToast(errorMessage(e, '진행 기록을 저장하지 못했어요'))
        throw e
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, data, repo, today, patch, showToast, trackEvent]
  )

  const submitCheckIn = useCallback(
    async (input: CheckInInput) => {
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
        store_id: u.store_id,
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
        observed_at: now,
      }
      try {
        const [created] = await repo.createEvidence([row])
        patch((cur) => ({ ...cur, evidence: [...cur.evidence, created] }))
        trackEvent('behaviour_checkin_submitted', { assignment_id: assignment.id, attempts: input.attempts, helpfulness: input.helpfulness })
        if (input.complete && assignment.status !== 'completed') {
          const target = assignment.target_count
          await logActionEvent(assignment.id, 'completed', target ?? Math.max(progressOf(d, assignment), 1))
        }
        showToast('체크인을 기록했어요 — 근거가 쌓이고 있어요')
      } catch (e) {
        showToast(errorMessage(e, '체크인을 저장하지 못했어요'))
        throw e
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, data, repo, today, patch, showToast, trackEvent, logActionEvent]
  )

  const submitReflection = useCallback(
    async (input: ReflectionInput) => {
      const { user: u, data: d } = requireCtx()
      const shift = todayShiftFor(d, u.id, today)
      if (!shift) throw new RepoError('validation', '오늘 근무가 없어 회고를 남길 수 없어요.')
      try {
        const created = await repo.createReflection({
          user_id: u.id,
          shift_id: shift.id,
          dominant_behaviour: input.dominant,
          perceived_sales_level: input.perceived,
          coaching_helpfulness: input.helpfulness,
          note: input.note.trim() || null,
        })
        patch((cur) => ({ ...cur, reflections: [...cur.reflections, created] }))
        trackEvent('shift_reflection_submitted', { shift_id: shift.id, dominant: input.dominant, perceived: input.perceived, helpfulness: input.helpfulness })
        showToast('오늘 회고를 남겼어요. 수고했어요 🙌')
      } catch (e) {
        showToast(errorMessage(e, '회고를 저장하지 못했어요'))
        throw e
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, data, repo, today, patch, showToast, trackEvent]
  )

  const assignAction = useCallback(
    async (input: AssignInput) => {
      const { user: u, data: d } = requireCtx()
      if (input.userIds.length === 0) throw new RepoError('validation', '대상 직원을 한 명 이상 선택해주세요.')
      const rows: NewRow<ActionAssignment>[] = input.userIds.map((uid) => ({
        action_id: input.actionId,
        assigned_by_user_id: u.id,
        assigned_to_user_id: uid,
        store_id: u.store_id,
        shift_id: d.shifts.find((s) => s.user_id === uid && s.start_at.slice(0, 10) <= input.date && s.end_at.slice(0, 10) >= input.date)?.id ?? null,
        assigned_date: input.date,
        target_count: input.targetCount,
        target_metric: input.targetMetric,
        status: 'assigned',
      }))
      try {
        const created = await repo.createAssignments(rows)
        patch((cur) => ({ ...cur, assignments: [...cur.assignments, ...created] }))
        trackEvent('action_assigned', { action_id: input.actionId, count: created.length, date: input.date })
        showToast(`${created.length}명에게 액션을 배정했어요`)
      } catch (e) {
        showToast(errorMessage(e, '액션을 배정하지 못했어요'))
        throw e
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, data, repo, patch, showToast, trackEvent]
  )

  const submitObservation = useCallback(
    async (input: ObservationInput) => {
      const { user: u, data: d } = requireCtx()
      const entries = Object.entries(input.results).filter((x): x is [BehaviourType, ObservationResult] => x[1] !== undefined)
      if (entries.length === 0) throw new RepoError('validation', '최소 한 가지 행동은 관찰함/관찰 안 됨으로 표시해주세요.')
      const shift = todayShiftFor(d, input.userId, today)
      const now = new Date().toISOString()
      const rows: NewRow<BehaviourEvidence>[] = entries.map(([behaviour, result]) => ({
        user_id: input.userId,
        store_id: u.store_id,
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
        observed_at: now,
      }))
      try {
        const created = await repo.createEvidence(rows)
        patch((cur) => ({ ...cur, evidence: [...cur.evidence, ...created] }))
        trackEvent('manager_observation_submitted', { observed_user_id: input.userId, behaviours: entries.length, coaching_needed: input.coachingNeeded })
        showToast('관찰을 기록했어요')
      } catch (e) {
        showToast(errorMessage(e, '관찰을 저장하지 못했어요'))
        throw e
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, data, repo, today, patch, showToast, trackEvent]
  )

  const submitKpi = useCallback(
    async (input: KpiInput) => {
      const { data: d } = requireCtx()
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
      try {
        const saved = await repo.upsertOutcome(row)
        patch((cur) => ({ ...cur, outcomes: [...cur.outcomes.filter((o) => o.id !== saved.id), saved] }))
        trackEvent('kpi_submitted', { date: input.date, store_id: input.storeId })
        showToast('오늘 성과를 저장했어요')
      } catch (e) {
        showToast(errorMessage(e, 'KPI를 저장하지 못했어요'))
        throw e
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, data, repo, patch, showToast, trackEvent]
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, data, repo, patch, showToast, trackEvent]
  )

  const value = useMemo<BellatrixShape>(
    () => ({
      repoMode: repo.mode,
      session,
      dataset,
      today,
      signIn,
      signOut,
      listDemoAccounts: () => repo.listDemoAccounts(),
      reload,
      resetDemoData,
      sheet,
      openSheet: setSheet,
      closeSheet: () => setSheet(null),
      toast,
      showToast,
      trackEvent,
      logActionEvent,
      submitCheckIn,
      submitReflection,
      assignAction,
      submitObservation,
      submitKpi,
      importOutcomes,
    }),
    [repo, session, dataset, today, signIn, signOut, reload, resetDemoData, sheet, toast, showToast, trackEvent, logActionEvent, submitCheckIn, submitReflection, assignAction, submitObservation, submitKpi, importOutcomes]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useBellatrix(): BellatrixShape {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useBellatrix must be used within BellatrixProvider')
  return ctx
}

/** Convenience: signed-in user + ready dataset, or null while loading. */
export function useReadyData(): { user: User; data: StoreDataset } | null {
  const { session, dataset } = useBellatrix()
  if (session.status !== 'signed_in' || dataset.status !== 'ready') return null
  return { user: session.user, data: dataset.data }
}
