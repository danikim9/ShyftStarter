// Pure read helpers over StoreDataset for the UI layer.
import type { Action, ActionAssignment, ActionEvent, BehaviourType, ISODate, Shift, StoreDataset, User } from '../types/bellatrix'
import { dateOf } from './dates'

export function todayShiftFor(ds: StoreDataset, userId: string, today: ISODate): Shift | null {
  return ds.shifts.find((s) => s.user_id === userId && dateOf(s.start_at) === today && s.status !== 'cancelled') ?? null
}

export function shiftsOn(ds: StoreDataset, date: ISODate): Shift[] {
  return ds.shifts.filter((s) => dateOf(s.start_at) === date && s.status !== 'cancelled')
}

export function actionById(ds: StoreDataset, id: string): Action | undefined {
  return ds.actions.find((a) => a.id === id)
}

export function userById(ds: StoreDataset, id: string): User | undefined {
  return ds.users.find((u) => u.id === id)
}

export function assignmentsFor(ds: StoreDataset, userId: string, date: ISODate): ActionAssignment[] {
  return ds.assignments.filter((a) => a.assigned_to_user_id === userId && a.assigned_date === date)
}

export function eventsFor(ds: StoreDataset, assignmentId: string): ActionEvent[] {
  return ds.action_events.filter((e) => e.action_assignment_id === assignmentId).sort((a, b) => a.event_at.localeCompare(b.event_at))
}

/** Latest progress_value from events (falls back to 0). */
export function progressOf(ds: StoreDataset, assignment: ActionAssignment): number {
  const ev = eventsFor(ds, assignment.id)
  for (let i = ev.length - 1; i >= 0; i--) {
    const p = ev[i].progress_value
    if (p !== null) return p
  }
  return 0
}

export function hasEvent(ds: StoreDataset, assignmentId: string, type: ActionEvent['event_type']): boolean {
  return ds.action_events.some((e) => e.action_assignment_id === assignmentId && e.event_type === type)
}

export function hasCheckIn(ds: StoreDataset, assignmentId: string): boolean {
  return ds.evidence.some((e) => e.action_assignment_id === assignmentId && e.evidence_source === 'employee_self_report')
}

export function reflectionForShift(ds: StoreDataset, shiftId: string) {
  return ds.reflections.find((r) => r.shift_id === shiftId) ?? null
}

export interface AssignmentView {
  assignment: ActionAssignment
  action: Action
  progress: number
  target: number | null
  isDone: boolean
  isSkipped: boolean
}

export function viewAssignments(ds: StoreDataset, rows: ActionAssignment[]): AssignmentView[] {
  const out: AssignmentView[] = []
  for (const a of rows) {
    const action = actionById(ds, a.action_id)
    if (!action) continue
    out.push({
      assignment: a,
      action,
      progress: progressOf(ds, a),
      target: a.target_count,
      isDone: a.status === 'completed',
      isSkipped: a.status === 'skipped' || a.status === 'expired',
    })
  }
  return out
}

/** Today's Focus = target metric of today's micro-coaching, else the store's focus metric. */
export function todaysFocusMetric(ds: StoreDataset, views: AssignmentView[]) {
  const coaching = views.find((v) => v.action.intervention_type === 'micro_coaching')
  return coaching?.action.target_metric ?? views[0]?.action.target_metric ?? ds.store?.focus_metric ?? 'none'
}

// --- personal mode ---------------------------------------------------------

export function nextShiftFor(ds: StoreDataset, userId: string, nowIso: string): Shift | null {
  return (
    ds.shifts
      .filter((s) => s.user_id === userId && s.status !== 'cancelled' && s.end_at >= nowIso)
      .sort((a, b) => a.start_at.localeCompare(b.start_at))[0] ?? null
  )
}

export function activeGoals(ds: StoreDataset, userId: string) {
  return ds.personal_goals.filter((g) => g.user_id === userId && g.active).sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function goalAttemptsOn(ds: StoreDataset, goalId: string, date: ISODate): number {
  return ds.action_events.filter((e) => e.personal_goal_id === goalId && e.event_type === 'attempted' && dateOf(e.event_at) === date).length
}

export function prepForShift(ds: StoreDataset, userId: string, shiftId: string) {
  return ds.shift_preps.find((p) => p.user_id === userId && p.shift_id === shiftId) ?? null
}

export function cardById(ds: StoreDataset, id: string | null) {
  return id ? (ds.coaching_cards.find((c) => c.id === id) ?? null) : null
}

/** Picks the Shift Prep card for a shift: team action's behaviour first (if the
 * team asked for something today), else the most recent active personal goal's
 * card, else a card matching the person's interests. */
export function pickPrepCard(ds: StoreDataset, user: User, date: ISODate) {
  const assignments = viewAssignments(ds, assignmentsFor(ds, user.id, date)).filter((v) => !v.isDone && !v.isSkipped)
  const goals = activeGoals(ds, user.id)
  const job = user.job_category
  const byBehaviour = (b: BehaviourType) => ds.coaching_cards.find((c) => c.behaviour_type === b && c.job_category === job) ?? ds.coaching_cards.find((c) => c.behaviour_type === b) ?? null
  const teamPick = assignments[0]
  if (teamPick) {
    const card = byBehaviour(teamPick.action.behaviour_type)
    if (card) return { card, goal: goals.find((g) => g.behaviour_type === card.behaviour_type) ?? null, assignment: teamPick.assignment }
  }
  for (const g of goals) {
    const card = cardById(ds, g.coaching_card_id) ?? byBehaviour(g.behaviour_type)
    if (card) return { card, goal: g, assignment: null }
  }
  for (const b of user.interests) {
    const card = byBehaviour(b)
    if (card) return { card, goal: null, assignment: null }
  }
  const fallback = ds.coaching_cards.find((c) => c.job_category === job) ?? ds.coaching_cards[0] ?? null
  return fallback ? { card: fallback, goal: null, assignment: null } : null
}
