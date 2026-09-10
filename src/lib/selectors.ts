// Pure read helpers over StoreDataset for the UI layer.
import type { Action, ActionAssignment, ActionEvent, ISODate, Shift, StoreDataset, User } from '../types/bellatrix'
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
  return coaching?.action.target_metric ?? views[0]?.action.target_metric ?? ds.store.focus_metric
}
