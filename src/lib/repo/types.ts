import type {
  ActionAssignment,
  ActionEvent,
  BehaviourEvidence,
  ISODate,
  OutcomeEvent,
  ProductEvent,
  ShiftReflection,
  StoreDataset,
  User,
} from '../../types/bellatrix'

export type RepoMode = 'local' | 'supabase'

export interface SignInParams {
  email: string
  password?: string
}

export interface DatasetWindow {
  from: ISODate
  to: ISODate
}

export type NewRow<T extends { id: string; created_at: string }> = Omit<T, 'id' | 'created_at'>

/** Repository contract. UI code depends on this only — never on Supabase or
 * localStorage directly. Every method is async so the offline adapter and the
 * network adapter are interchangeable. */
export interface BellatrixRepo {
  readonly mode: RepoMode

  // auth --------------------------------------------------------------------
  getCurrentUser(): Promise<User | null>
  signIn(params: SignInParams): Promise<User>
  signOut(): Promise<void>
  /** Local adapter only: the demo accounts a tester can pick from. */
  listDemoAccounts(): Promise<User[]>

  // reads -------------------------------------------------------------------
  loadDataset(storeId: string, viewer: User, window: DatasetWindow): Promise<StoreDataset>

  // writes ------------------------------------------------------------------
  createAssignments(rows: NewRow<ActionAssignment>[]): Promise<ActionAssignment[]>
  updateAssignmentStatus(id: string, status: ActionAssignment['status']): Promise<void>
  createActionEvent(row: Omit<ActionEvent, 'id'>): Promise<ActionEvent>
  createEvidence(rows: NewRow<BehaviourEvidence>[]): Promise<BehaviourEvidence[]>
  /** Upserts on (store_id, outcome_date, user_id) so re-entering a day corrects it. */
  upsertOutcome(row: NewRow<OutcomeEvent>): Promise<OutcomeEvent>
  createReflection(row: NewRow<ShiftReflection>): Promise<ShiftReflection>
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
