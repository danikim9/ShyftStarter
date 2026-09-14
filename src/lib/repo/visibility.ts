// Visibility filtering shared by adapters (and unit-tested). This is the
// single place that decides what a viewer may receive from a dataset.
import type { StoreDataset, User, VisibilityScope } from '../../types/bellatrix'

export function isManagerRole(u: User): boolean {
  return u.role === 'manager' || u.role === 'admin'
}

/** Scopes a manager may read about other people. 'private' is never included. */
export const MANAGER_READABLE: ReadonlySet<VisibilityScope> = new Set(['manager_visible', 'team', 'aggregated'])

/** Apply the privacy contract to a fully-loaded dataset. Employees see only
 * their own rows; managers see store rows minus anything private. */
export function applyVisibility(ds: StoreDataset, viewer: User): StoreDataset {
  const manager = isManagerRole(viewer)
  const own = <T extends { user_id: string }>(rows: T[]) => rows.filter((r) => r.user_id === viewer.id)
  const forManager = <T extends { user_id: string; visibility: VisibilityScope }>(rows: T[]) =>
    rows.filter((r) => r.user_id === viewer.id || MANAGER_READABLE.has(r.visibility))

  if (!manager) {
    // Shift times are shared inside a team so the 근무표 works for everyone; a
    // person without a team only ever receives their own shifts.
    const teammates = viewer.team_id ? new Set(ds.users.filter((u) => u.team_id === viewer.team_id).map((u) => u.id)) : null
    return {
      ...ds,
      shifts: ds.shifts.filter((s) => s.user_id === viewer.id || (teammates !== null && teammates.has(s.user_id))),
      personal_goals: own(ds.personal_goals),
      shift_preps: own(ds.shift_preps),
      assignments: ds.assignments.filter((a) => a.assigned_to_user_id === viewer.id),
      action_events: own(ds.action_events),
      evidence: own(ds.evidence),
      reflections: own(ds.reflections),
      // Store-level KPIs are business data. An employee may see rows that are
      // explicitly theirs (employee_id from POS/CSV) — that is their own sales.
      outcomes: ds.outcomes.filter((o) => o.user_id === viewer.id),
      pilot_participants: own(ds.pilot_participants),
    }
  }
  return {
    ...ds,
    personal_goals: own(ds.personal_goals),
    shift_preps: forManager(ds.shift_preps),
    action_events: forManager(ds.action_events),
    evidence: forManager(ds.evidence),
    reflections: forManager(ds.reflections),
  }
}
