// Reusable analytics over a StoreDataset. Pure functions, no React. These are
// the building blocks the weekly insight engine and the Growth screen use, and
// the seam where a real statistics service can plug in later.
import type {
  ActionAssignment,
  BehaviourEvidence,
  BehaviourType,
  ISODate,
  OutcomeEvent,
  StoreDataset,
  TargetMetric,
} from '../../types/bellatrix'
import { addDays, dateOf, daysBetween, parseISODate, toISODate, weekKey } from '../dates'
import { isObserved, rateStrength, type EvidenceStrength } from './confidence'
import { metricValue } from './metrics'

export interface DateRange {
  from: ISODate
  to: ISODate
}

export function inRange(date: ISODate, r?: DateRange): boolean {
  if (!r) return true
  return date >= r.from && date <= r.to
}

export function getSampleSize<T>(rows: T[]): number {
  return rows.length
}

export interface RateResult {
  numerator: number
  denominator: number
  rate: number | null
}

function rate(n: number, d: number): RateResult {
  return { numerator: n, denominator: d, rate: d > 0 ? n / d : null }
}

export interface AssignmentFilter {
  userId?: string
  behaviourType?: BehaviourType
  interventionType?: 'action' | 'micro_coaching' | 'mini_quest'
  range?: DateRange
}

export function filterAssignments(ds: StoreDataset, f: AssignmentFilter): ActionAssignment[] {
  const actionById = new Map(ds.actions.map((a) => [a.id, a]))
  return ds.assignments.filter((a) => {
    if (f.userId && a.assigned_to_user_id !== f.userId) return false
    if (!inRange(a.assigned_date, f.range)) return false
    const action = actionById.get(a.action_id)
    if (!action) return false
    if (f.behaviourType && action.behaviour_type !== f.behaviourType) return false
    if (f.interventionType && action.intervention_type !== f.interventionType) return false
    return true
  })
}

/** completed ÷ all team assignments, plus (for a single user) personal-goal
 * shifts where an attempt was logged ÷ shifts with an active goal of that
 * behaviour. Both are "did the person try" signals, never verified behaviour. */
export function getActionCompletionRate(ds: StoreDataset, f: AssignmentFilter = {}): RateResult {
  const rows = filterAssignments(ds, f)
  let num = rows.filter((a) => a.status === 'completed').length
  let den = rows.length
  if (f.userId) {
    const goals = ds.personal_goals.filter((g) => g.user_id === f.userId && (!f.behaviourType || g.behaviour_type === f.behaviourType))
    if (goals.length > 0) {
      const goalIds = new Set(goals.map((g) => g.id))
      const shifts = ds.shifts.filter((s) => s.user_id === f.userId && s.status !== 'cancelled' && inRange(dateOf(s.start_at), f.range))
      const attemptedShiftIds = new Set(
        ds.action_events.filter((e) => e.personal_goal_id && goalIds.has(e.personal_goal_id) && e.event_type === 'attempted' && e.shift_id).map((e) => e.shift_id as string)
      )
      den += shifts.length
      num += shifts.filter((s) => attemptedShiftIds.has(s.id)).length
    }
  }
  return rate(num, den)
}

export interface EvidenceFilter {
  userId?: string
  behaviourType?: BehaviourType
  range?: DateRange
}

export function filterEvidence(ds: StoreDataset, f: EvidenceFilter): BehaviourEvidence[] {
  return ds.evidence.filter((e) => {
    if (f.userId && e.user_id !== f.userId) return false
    if (f.behaviourType && e.behaviour_type !== f.behaviourType) return false
    return inRange(dateOf(e.observed_at), f.range)
  })
}

/** Among manager observations that were actually checked, share marked 'observed'. */
export function getBehaviourObservationRate(ds: StoreDataset, f: EvidenceFilter = {}): RateResult {
  const rows = filterEvidence(ds, f).filter((e) => e.evidence_source === 'manager_observation')
  return rate(rows.filter(isObserved).length, rows.length)
}

export interface GroupStats {
  n: number
  mean: number | null
}

export interface GroupComparison {
  metric: TargetMetric
  behaviour: BehaviourType
  groupBy: 'action_completed' | 'behaviour_observed'
  withGroup: GroupStats
  withoutGroup: GroupStats
  deltaPct: number | null
  strength: EvidenceStrength
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function storeDayOutcomes(ds: StoreDataset, range?: DateRange): OutcomeEvent[] {
  return ds.outcomes.filter((o) => o.user_id === null && inRange(o.outcome_date, range))
}

/** Splits store-days into two groups and compares the mean of a KPI.
 * groupBy 'action_completed': days with ≥1 completed assignment of that behaviour.
 * groupBy 'behaviour_observed': days a manager marked that behaviour 'observed'
 *   vs days a manager checked and marked it 'not_observed' (unchecked days excluded). */
export function compareMetricBetweenActionGroups(
  ds: StoreDataset,
  params: { behaviour: BehaviourType; metric: TargetMetric; groupBy: GroupComparison['groupBy']; range?: DateRange }
): GroupComparison {
  const { behaviour, metric, groupBy, range } = params
  const outcomes = storeDayOutcomes(ds, range)
  const withDays = new Set<ISODate>()
  const withoutDays = new Set<ISODate>()

  if (groupBy === 'action_completed') {
    const rows = filterAssignments(ds, { behaviourType: behaviour, range })
    for (const a of rows) if (a.status === 'completed') withDays.add(a.assigned_date)
    for (const o of outcomes) if (!withDays.has(o.outcome_date)) withoutDays.add(o.outcome_date)
  } else {
    const rows = filterEvidence(ds, { behaviourType: behaviour, range }).filter((e) => e.evidence_source === 'manager_observation')
    for (const e of rows) {
      const d = dateOf(e.observed_at)
      if (e.evidence_value === 'observed') withDays.add(d)
    }
    for (const e of rows) {
      const d = dateOf(e.observed_at)
      if (e.evidence_value === 'not_observed' && !withDays.has(d)) withoutDays.add(d)
    }
  }

  const pick = (days: Set<ISODate>) =>
    outcomes.filter((o) => days.has(o.outcome_date)).map((o) => metricValue(o, metric)).filter((v): v is number => v !== null)
  const a = pick(withDays)
  const b = pick(withoutDays)
  const ma = mean(a)
  const mb = mean(b)
  const deltaPct = ma !== null && mb !== null && mb !== 0 ? ((ma - mb) / mb) * 100 : null
  return {
    metric,
    behaviour,
    groupBy,
    withGroup: { n: a.length, mean: ma },
    withoutGroup: { n: b.length, mean: mb },
    deltaPct,
    strength: rateStrength(a.length, b.length, deltaPct),
  }
}

export function getAverageOutcomeByActionCompletion(ds: StoreDataset, behaviour: BehaviourType, metric: TargetMetric, range?: DateRange) {
  return compareMetricBetweenActionGroups(ds, { behaviour, metric, groupBy: 'action_completed', range })
}

export type TrendDirection = 'up' | 'flat' | 'down' | 'insufficient'

export interface BehaviourTrend {
  behaviour: BehaviourType
  /** Oldest → newest weekly counts (completed actions + observed behaviours). */
  weekly: { week: ISODate; completed: number; observed: number; selfReported: number }[]
  direction: TrendDirection
  total: number
}

function trendFromSeries(values: number[]): TrendDirection {
  if (values.length < 2 || values.reduce((a, b) => a + b, 0) < 3) return 'insufficient'
  const last = values[values.length - 1]
  const prev = values.slice(0, -1)
  const prevMean = prev.reduce((a, b) => a + b, 0) / prev.length
  if (last > prevMean * 1.15 && last - prevMean >= 1) return 'up'
  if (last < prevMean * 0.85 && prevMean - last >= 1) return 'down'
  return 'flat'
}

function behaviourTrend(ds: StoreDataset, userId: string | undefined, weeks: number, today: ISODate): BehaviourTrend[] {
  const actionById = new Map(ds.actions.map((a) => [a.id, a]))
  const behaviours: BehaviourType[] = ['discovery', 'demo', 'recommendation', 'cross_sell', 'closing']
  const thisWeek = weekKey(today)
  const weekKeys: ISODate[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    weekKeys.push(toISODate(addDays(parseISODate(thisWeek), -i * 7)))
  }
  return behaviours.map((b) => {
    const weekly = weekKeys.map((wk) => ({ week: wk, completed: 0, observed: 0, selfReported: 0 }))
    const idx = new Map(weekKeys.map((k, i) => [k, i]))
    for (const a of ds.assignments) {
      if (userId && a.assigned_to_user_id !== userId) continue
      const action = actionById.get(a.action_id)
      if (!action || action.behaviour_type !== b || a.status !== 'completed') continue
      const i = idx.get(weekKey(a.assigned_date))
      if (i !== undefined) weekly[i].completed++
    }
    for (const e of ds.evidence) {
      if (userId && e.user_id !== userId) continue
      if (e.behaviour_type !== b) continue
      const i = idx.get(weekKey(dateOf(e.observed_at)))
      if (i === undefined) continue
      if (isObserved(e)) weekly[i].observed++
      else if (e.evidence_source === 'employee_self_report' && e.evidence_value !== '0') weekly[i].selfReported++
    }
    // Personal-goal attempts (private self-report) count as "tried" for the owner's own trend.
    if (userId) {
      const goalIds = new Set(ds.personal_goals.filter((g) => g.user_id === userId && g.behaviour_type === b).map((g) => g.id))
      for (const e of ds.action_events) {
        if (e.user_id !== userId || e.event_type !== 'attempted' || !e.personal_goal_id || !goalIds.has(e.personal_goal_id)) continue
        const i = idx.get(weekKey(dateOf(e.event_at)))
        if (i !== undefined) weekly[i].selfReported++
      }
    }
    const series = weekly.map((w) => w.completed + w.observed + (userId ? w.selfReported : 0))
    // The current week is partial — project it to a full week for the direction
    // only, so a Tuesday never reads as "down" against complete weeks.
    const elapsed = Math.max(1, daysBetween(thisWeek, today) + 1)
    const projected = series.map((v, i) => (i === series.length - 1 && elapsed < 7 ? Math.round((v * 7) / elapsed) : v))
    return { behaviour: b, weekly, direction: trendFromSeries(projected), total: series.reduce((x, y) => x + y, 0) }
  })
}

export function getEmployeeBehaviourTrend(ds: StoreDataset, userId: string, today: ISODate, weeks = 3): BehaviourTrend[] {
  return behaviourTrend(ds, userId, weeks, today)
}

export function getStoreBehaviourTrend(ds: StoreDataset, today: ISODate, weeks = 3): BehaviourTrend[] {
  return behaviourTrend(ds, undefined, weeks, today)
}

export interface WeeklySummary {
  actionsCompleted: number
  coachingApplied: number
  managerObservations: number
  observedBehaviours: number
  selfReports: number
}

/** "This week" = Monday of the current week → today. */
export function getWeeklySummary(ds: StoreDataset, userId: string | undefined, today: ISODate): WeeklySummary {
  const range: DateRange = { from: weekKey(today), to: today }
  const actionById = new Map(ds.actions.map((a) => [a.id, a]))
  const rows = filterAssignments(ds, { userId, range })
  const completed = rows.filter((a) => a.status === 'completed')
  const coachingApplied = completed.filter((a) => actionById.get(a.action_id)?.intervention_type === 'micro_coaching').length
  const ev = filterEvidence(ds, { userId, range })
  const obs = ev.filter((e) => e.evidence_source === 'manager_observation')
  return {
    actionsCompleted: completed.length,
    coachingApplied,
    managerObservations: obs.length,
    observedBehaviours: obs.filter(isObserved).length,
    selfReports: ev.filter((e) => e.evidence_source === 'employee_self_report').length,
  }
}

/** Weekly co-movement of a behaviour's completions and a KPI. */
export interface CoMovement {
  behaviour: BehaviourType
  metric: TargetMetric
  weeks: { week: ISODate; completed: number; metricMean: number | null }[]
  sameDirectionWeeks: number
  comparableWeeks: number
}

export function getWeeklyCoMovement(ds: StoreDataset, behaviour: BehaviourType, metric: TargetMetric, today: ISODate, weeks = 3): CoMovement {
  const trend = behaviourTrend(ds, undefined, weeks + 1, today).find((t) => t.behaviour === behaviour)
  const weekly = (trend?.weekly ?? []).map((w) => {
    const vals = ds.outcomes
      .filter((o) => o.user_id === null && weekKey(o.outcome_date) === w.week)
      .map((o) => metricValue(o, metric))
      .filter((v): v is number => v !== null)
    return { week: w.week, completed: w.completed, metricMean: mean(vals) }
  })
  let same = 0
  let comparable = 0
  for (let i = 1; i < weekly.length; i++) {
    const a = weekly[i - 1]
    const b = weekly[i]
    if (a.metricMean === null || b.metricMean === null) continue
    const dC = Math.sign(b.completed - a.completed)
    const dM = Math.sign(b.metricMean - a.metricMean)
    if (dC === 0 || dM === 0) continue
    comparable++
    if (dC === dM) same++
  }
  return { behaviour, metric, weeks: weekly, sameDirectionWeeks: same, comparableWeeks: comparable }
}

/** Behaviour observation rate split by pilot group. */
export function getPilotGroupObservation(ds: StoreDataset, behaviour: BehaviourType, range?: DateRange) {
  const pilot = ds.pilots.find((p) => p.status === 'active' && p.target_behaviour === behaviour)
  if (!pilot) return null
  const groups = { intervention: [] as string[], control: [] as string[] }
  for (const p of ds.pilot_participants) if (p.pilot_id === pilot.id) groups[p.group_type].push(p.user_id)
  const rateFor = (ids: string[]) => {
    const rows = filterEvidence(ds, { behaviourType: behaviour, range }).filter((e) => e.evidence_source === 'manager_observation' && ids.includes(e.user_id))
    return rate(rows.filter(isObserved).length, rows.length)
  }
  return { pilot, intervention: rateFor(groups.intervention), control: rateFor(groups.control) }
}
