// Offline / on-device adapter. Persists the whole demo database as one JSON
// document in storage. Used whenever Supabase env vars are not configured, so
// TestFlight testers get a fully working app with no backend dependency.
import type {
  ActionAssignment,
  ActionEvent,
  BehaviourEvidence,
  OutcomeEvent,
  ProductEvent,
  ShiftReflection,
  StoreDataset,
  User,
} from '../../types/bellatrix'
import { buildSeed, SEED_VERSION, type SeedDatabase } from '../../data/seed'
import { dateOf } from '../dates'
import { newId, storage } from '../storage'
import { RepoError, type BellatrixRepo, type DatasetWindow, type NewRow, type SignInParams } from './types'

const DB_KEY = `bellatrix.db.v${SEED_VERSION}`
const SESSION_KEY = 'bellatrix.session.userId'

function loadDb(): SeedDatabase {
  const raw = storage.get(DB_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SeedDatabase
      if (parsed.seed_version === SEED_VERSION) return parsed
    } catch {
      // corrupt — fall through and re-seed
    }
  }
  const fresh = buildSeed(new Date())
  storage.set(DB_KEY, JSON.stringify(fresh))
  return fresh
}

function inWindow(date: string, w: DatasetWindow): boolean {
  return date >= w.from && date <= w.to
}

export class LocalRepo implements BellatrixRepo {
  readonly mode = 'local' as const
  private db: SeedDatabase

  constructor() {
    this.db = loadDb()
  }

  private persist(): void {
    const ok = storage.set(DB_KEY, JSON.stringify(this.db))
    if (!ok) throw new RepoError('unknown', '기기 저장소에 기록할 수 없어요. 저장 공간을 확인해주세요.')
  }

  async getCurrentUser(): Promise<User | null> {
    const id = storage.get(SESSION_KEY)
    if (!id) return null
    return this.db.users.find((u) => u.id === id) ?? null
  }

  async signIn({ email }: SignInParams): Promise<User> {
    const user = this.db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!user) throw new RepoError('auth', '등록되지 않은 데모 계정이에요.')
    storage.set(SESSION_KEY, user.id)
    return user
  }

  async signOut(): Promise<void> {
    storage.remove(SESSION_KEY)
  }

  async listDemoAccounts(): Promise<User[]> {
    return this.db.users
  }

  async loadDataset(storeId: string, viewer: User, window: DatasetWindow): Promise<StoreDataset> {
    const store = this.db.stores.find((s) => s.id === storeId)
    if (!store) throw new RepoError('not_found', '매장 정보를 찾을 수 없어요.')
    if (viewer.store_id !== storeId && viewer.role !== 'admin') throw new RepoError('auth', '이 매장에 접근할 권한이 없어요.')
    const isManager = viewer.role === 'manager' || viewer.role === 'admin'
    const mine = <T extends { user_id: string | null }>(rows: T[]) => (isManager ? rows : rows.filter((r) => r.user_id === viewer.id))

    return {
      company: this.db.companies.find((c) => c.id === store.company_id) ?? null,
      store,
      users: this.db.users.filter((u) => u.store_id === storeId),
      shifts: mine(this.db.shifts.filter((s) => s.store_id === storeId && inWindow(dateOf(s.start_at), window))),
      actions: this.db.actions.filter((a) => a.active),
      assignments: (isManager ? this.db.assignments : this.db.assignments.filter((a) => a.assigned_to_user_id === viewer.id)).filter(
        (a) => a.store_id === storeId && inWindow(a.assigned_date, window)
      ),
      action_events: mine(this.db.action_events.filter((e) => inWindow(dateOf(e.event_at), window))),
      evidence: mine(this.db.evidence.filter((e) => e.store_id === storeId && inWindow(dateOf(e.observed_at), window))),
      // Sales KPIs are store business data — managers only.
      outcomes: isManager ? this.db.outcomes.filter((o) => o.store_id === storeId && inWindow(o.outcome_date, window)) : [],
      reflections: mine(this.db.reflections.filter((r) => inWindow(dateOf(r.created_at), window))),
      pilots: this.db.pilots.filter((p) => p.store_id === storeId || p.store_id === null),
      pilot_participants: isManager ? this.db.pilot_participants : this.db.pilot_participants.filter((p) => p.user_id === viewer.id),
    }
  }

  async createAssignments(rows: NewRow<ActionAssignment>[]): Promise<ActionAssignment[]> {
    const now = new Date().toISOString()
    const created = rows.map((r) => ({ ...r, id: newId('asg'), created_at: now }))
    this.db.assignments.push(...created)
    this.persist()
    return created
  }

  async updateAssignmentStatus(id: string, status: ActionAssignment['status']): Promise<void> {
    const a = this.db.assignments.find((x) => x.id === id)
    if (!a) throw new RepoError('not_found', '액션을 찾을 수 없어요.')
    a.status = status
    this.persist()
  }

  async createActionEvent(row: Omit<ActionEvent, 'id'>): Promise<ActionEvent> {
    const created = { ...row, id: newId('ae') }
    this.db.action_events.push(created)
    this.persist()
    return created
  }

  async createEvidence(rows: NewRow<BehaviourEvidence>[]): Promise<BehaviourEvidence[]> {
    const now = new Date().toISOString()
    const created = rows.map((r) => ({ ...r, id: newId('ev'), created_at: now }))
    this.db.evidence.push(...created)
    this.persist()
    return created
  }

  async upsertOutcome(row: NewRow<OutcomeEvent>): Promise<OutcomeEvent> {
    const idx = this.db.outcomes.findIndex(
      (o) => o.store_id === row.store_id && o.outcome_date === row.outcome_date && (o.user_id ?? null) === (row.user_id ?? null)
    )
    const now = new Date().toISOString()
    if (idx >= 0) {
      const updated: OutcomeEvent = { ...this.db.outcomes[idx], ...row, created_at: now }
      this.db.outcomes[idx] = updated
      this.persist()
      return updated
    }
    const created: OutcomeEvent = { ...row, id: newId('out'), created_at: now }
    this.db.outcomes.push(created)
    this.persist()
    return created
  }

  async createReflection(row: NewRow<ShiftReflection>): Promise<ShiftReflection> {
    const created = { ...row, id: newId('refl'), created_at: new Date().toISOString() }
    this.db.reflections.push(created)
    this.persist()
    return created
  }

  async trackEvent(row: Omit<ProductEvent, 'id'>): Promise<void> {
    this.db.product_events.push({ ...row, id: newId('pe') })
    // Keep the local analytics log bounded.
    if (this.db.product_events.length > 2000) this.db.product_events.splice(0, this.db.product_events.length - 2000)
    try {
      this.persist()
    } catch {
      // analytics must never break the product
    }
  }

  async resetDemoData(): Promise<void> {
    storage.remove(DB_KEY)
    this.db = loadDb()
  }
}
