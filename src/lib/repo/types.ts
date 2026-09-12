import type {
  ActionAssignment,
  ActionEvent,
  BehaviourEvidence,
  ConsentSetting,
  ISODate,
  JobCategory,
  OutcomeEvent,
  PersonalGoal,
  ProductEvent,
  Shift,
  ShiftPrep,
  ShiftReflection,
  StoreDataset,
  Team,
  User,
} from '../../types/bellatrix'

export type RepoMode = 'local' | 'supabase'

export interface SignInParams {
  email: string
  password?: string
}

export interface SignUpParams {
  name: string
  email: string
  password?: string
  job_category: JobCategory
  interests: PersonalGoal['behaviour_type'][]
}

export interface DatasetWindow {
  from: ISODate
  to: ISODate
}

export type NewRow<T extends { id: string; created_at: string }> = Omit<T, 'id' | 'created_at'>

/** Repository contract. UI code depends on this only — never on Supabase or
 * localStorage directly. Every method is async so the offline adapter and the
 * network adapter are interchangeable.
 *
 * Privacy contract (enforced here AND by RLS on Supabase): loadDataset for a
 * manager never returns rows whose visibility is 'private' — personal goals,
 * reflections, private notes and personal-goal events stay with the employee. */
export interface BellatrixRepo {
  readonly mode: RepoMode

  // auth --------------------------------------------------------------------
  getCurrentUser(): Promise<User | null>
  signIn(params: SignInParams): Promise<User>
  signUp(params: SignUpParams): Promise<User>
  signOut(): Promise<void>
  /** Local adapter only: the demo accounts a tester can pick from. */
  listDemoAccounts(): Promise<User[]>
  updateConsent(userId: string, consent: ConsentSetting): Promise<User>

  // team ---------------------------------------------------------------------
  /** Joins by invite code; returns the updated user and the team. */
  joinTeam(userId: string, code: string): Promise<{ user: User; team: Team }>
  leaveTeam(userId: string): Promise<User>

  // reads -------------------------------------------------------------------
  loadDataset(viewer: User, window: DatasetWindow): Promise<StoreDataset>

  // employee writes ---------------------------------------------------------
  createShift(row: NewRow<Shift>): Promise<Shift>
  deleteShift(id: string, userId: string): Promise<void>
  createPersonalGoal(row: NewRow<PersonalGoal>): Promise<PersonalGoal>
  updatePersonalGoal(id: string, patch: Partial<Pick<PersonalGoal, 'active' | 'title' | 'target_count'>>): Promise<PersonalGoal>
  createShiftPrep(row: Omit<ShiftPrep, 'id'>): Promise<ShiftPrep>
  createActionEvent(row: Omit<ActionEvent, 'id'>): Promise<ActionEvent>
  createEvidence(rows: NewRow<BehaviourEvidence>[]): Promise<BehaviourEvidence[]>
  createReflection(row: NewRow<ShiftReflection>): Promise<ShiftReflection>
  updateAssignmentStatus(id: string, status: ActionAssignment['status']): Promise<void>

  // manager writes ----------------------------------------------------------
  createAssignments(rows: NewRow<ActionAssignment>[]): Promise<ActionAssignment[]>
  /** Upserts on (store_id, outcome_date, user_id) so re-entering a day corrects it. */
  upsertOutcome(row: NewRow<OutcomeEvent>): Promise<OutcomeEvent>

  trackEvent(row: Omit<ProductEvent, 'id'>): Promise<void>

  /** Local adapter only: wipe and re-seed demo data. */
  resetDemoData(): Promise<void>
}

export class RepoError extends Error {
  readonly code: 'auth' | 'network' | 'validation' | 'not_found' | 'unknown'
  constructor(code: RepoError['code'], message: string) {
    super(message)
    this.name = 'RepoError'
    this.code = code
  }
}
