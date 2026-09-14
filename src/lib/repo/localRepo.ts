// Offline / on-device adapter. Persists the whole database as one JSON
// document in storage. Used whenever Supabase env vars are not configured, so
// TestFlight testers get a fully working app with no backend dependency.
//
// Privacy: every read goes through applyVisibility() — the same contract the
// Supabase RLS policies enforce server-side.
import type {
  ActionAssignment,
  ActionEvent,
  BehaviourEvidence,
  ConsentSetting,
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
import { DEFAULT_CONSENT } from '../../types/bellatrix'
import { buildSeed, SEED_VERSION, type SeedDatabase } from '../../data/seed'
import { dateOf } from '../dates'
import { newId, storage } from '../storage'
import { RepoError, type BellatrixRepo, type DatasetWindow, type NewRow, type SignInParams, type SignUpParams } from './types'
import { applyVisibility, isManagerRole } from './visibility'

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

  constructor(initial?: SeedDatabase) {
    this.db = initial ?? loadDb()
  }

  private persist(): void {
    const ok = storage.set(DB_KEY, JSON.stringify(this.db))
    if (!ok) throw new RepoError('unknown', '기기 저장소에 기록할 수 없어요. 저장 공간을 확인해주세요.')
  }

  private user(id: string): User {
    const u = this.db.users.find((x) => x.id === id)
    if (!u) throw new RepoError('not_found', '사용자를 찾을 수 없어요.')
    return u
  }

  // auth ----------------------------------------------------------------------
  async getCurrentUser(): Promise<User | null> {
    const id = storage.get(SESSION_KEY)
    if (!id) return null
    return this.db.users.find((u) => u.id === id) ?? null
  }

  async signIn({ email }: SignInParams): Promise<User> {
    const user = this.db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!user) throw new RepoError('auth', '등록되지 않은 계정이에요. "새로 시작하기"로 계정을 만들어주세요.')
    storage.set(SESSION_KEY, user.id)
    return user
  }

  async signUp(params: SignUpParams): Promise<User> {
    const name = params.name.trim()
    if (!name) throw new RepoError('validation', '이름을 입력해주세요.')
    const email = params.email.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new RepoError('validation', '이메일 형식을 확인해주세요.')
    if (this.db.users.some((u) => u.email.toLowerCase() === email)) throw new RepoError('validation', '이미 사용 중인 이메일이에요. 로그인해주세요.')
    const user: User = {
      id: newId('u'),
      name,
      email,
      role: 'employee',
      store_id: null,
      team_id: null,
      company_id: null,
      job_category: params.job_category,
      interests: params.interests,
      consent: { ...DEFAULT_CONSENT },
      is_demo: false,
      created_at: new Date().toISOString(),
    }
    this.db.users.push(user)
    this.persist()
    storage.set(SESSION_KEY, user.id)
    return user
  }

  async signOut(): Promise<void> {
    storage.remove(SESSION_KEY)
  }

  async listDemoAccounts(): Promise<User[]> {
    return this.db.users.filter((u) => u.is_demo)
  }

  async updateConsent(userId: string, consent: ConsentSetting): Promise<User> {
    const u = this.user(userId)
    u.consent = { ...consent }
    this.persist()
    return u
  }

  // team ----------------------------------------------------------------------
  async joinTeam(userId: string, code: string): Promise<{ user: User; team: Team }> {
    const team = this.db.teams.find((t) => t.join_code.toUpperCase() === code.trim().toUpperCase())
    if (!team) throw new RepoError('not_found', '코드가 올바르지 않아요. 매니저에게 받은 초대 코드를 확인해주세요.')
    const u = this.user(userId)
    u.team_id = team.id
    u.store_id = team.store_id ?? u.store_id
    u.company_id = u.company_id ?? this.db.stores.find((s) => s.id === team.store_id)?.company_id ?? null
    if (!this.db.memberships.some((m) => m.team_id === team.id && m.user_id === u.id)) {
      this.db.memberships.push({ id: newId('mb'), team_id: team.id, user_id: u.id, role: 'member', joined_at: new Date().toISOString() })
    }
    this.persist()
    return { user: u, team }
  }

  async leaveTeam(userId: string): Promise<User> {
    const u = this.user(userId)
    if (isManagerRole(u)) throw new RepoError('validation', '매니저 계정은 팀을 떠날 수 없어요.')
    this.db.memberships = this.db.memberships.filter((m) => m.user_id !== u.id)
    u.team_id = null
    u.store_id = null
    this.persist()
    return u
  }

  // reads ---------------------------------------------------------------------
  async loadDataset(viewer: User, window: DatasetWindow): Promise<StoreDataset> {
    const storeId = viewer.store_id
    const store = storeId ? (this.db.stores.find((s) => s.id === storeId) ?? null) : null
    if (storeId && !store) throw new RepoError('not_found', '매장 정보를 찾을 수 없어요.')
    const team = viewer.team_id ? (this.db.teams.find((t) => t.id === viewer.team_id) ?? null) : null
    const sameScope = (rowStore: string | null, rowUser: string) => rowUser === viewer.id || (storeId !== null && rowStore === storeId)

    const full: StoreDataset = {
      company: store ? (this.db.companies.find((c) => c.id === store.company_id) ?? null) : null,
      store,
      team,
      memberships: team ? this.db.memberships.filter((m) => m.team_id === team.id) : this.db.memberships.filter((m) => m.user_id === viewer.id),
      users: storeId ? this.db.users.filter((u) => u.store_id === storeId) : [viewer],
      shifts: this.db.shifts.filter((s) => sameScope(s.store_id, s.user_id) && inWindow(dateOf(s.start_at), window)),
      actions: this.db.actions.filter((a) => a.active),
      coaching_cards: this.db.coaching_cards.filter((c) => c.active),
      personal_goals: this.db.personal_goals.filter((g) => g.user_id === viewer.id || (storeId !== null && this.db.users.some((u) => u.id === g.user_id && u.store_id === storeId))),
      shift_preps: this.db.shift_preps.filter((p) => inWindow(p.shift_date, window)),
      campaigns: storeId ? this.db.campaigns.filter((c) => c.store_id === storeId) : [],
      assignments: this.db.assignments.filter((a) => sameScope(a.store_id, a.assigned_to_user_id) && inWindow(a.assigned_date, window)),
      action_events: this.db.action_events.filter((e) => sameScope(e.store_id, e.user_id) && inWindow(dateOf(e.event_at), window)),
      evidence: this.db.evidence.filter((e) => sameScope(e.store_id, e.user_id) && inWindow(dateOf(e.observed_at), window)),
      outcomes: this.db.outcomes.filter((o) => (o.user_id === viewer.id || (storeId !== null && o.store_id === storeId)) && inWindow(o.outcome_date, window)),
      reflections: this.db.reflections.filter((r) => inWindow(r.shift_date, window) && (r.user_id === viewer.id || (storeId !== null && this.db.users.some((u) => u.id === r.user_id && u.store_id === storeId)))),
      pilots: storeId ? this.db.pilots.filter((p) => p.store_id === storeId || p.store_id === null) : [],
      pilot_participants: this.db.pilot_participants,
    }
    return applyVisibility(full, viewer)
  }

  // employee writes -----------------------------------------------------------
  async createShift(row: NewRow<Shift>): Promise<Shift> {
    if (new Date(row.end_at) <= new Date(row.start_at)) throw new RepoError('validation', '종료 시각은 시작 시각보다 뒤여야 해요.')
    const dup = this.db.shifts.find((s) => s.user_id === row.user_id && dateOf(s.start_at) === dateOf(row.start_at) && s.status !== 'cancelled')
    if (dup) throw new RepoError('validation', '그 날짜에는 이미 근무가 등록돼 있어요.')
    const created: Shift = { ...row, id: newId('sh'), created_at: new Date().toISOString() }
    this.db.shifts.push(created)
    this.persist()
    return created
  }

  async createShifts(rows: NewRow<Shift>[]): Promise<Shift[]> {
    const out: Shift[] = []
    const now = new Date().toISOString()
    for (const row of rows) {
      if (new Date(row.end_at) <= new Date(row.start_at)) continue
      const existing = this.db.shifts.find((s) => s.user_id === row.user_id && dateOf(s.start_at) === dateOf(row.start_at) && s.status !== 'cancelled')
      if (existing) {
        if (existing.source === 'self') {
          existing.start_at = row.start_at
          existing.end_at = row.end_at
          out.push(existing)
        }
        continue
      }
      const created: Shift = { ...row, id: newId('sh'), created_at: now }
      this.db.shifts.push(created)
      out.push(created)
    }
    this.persist()
    return out
  }

  async updateShift(id: string, userId: string, patch: Pick<Shift, 'start_at' | 'end_at'>): Promise<Shift> {
    const s = this.db.shifts.find((x) => x.id === id)
    if (!s) throw new RepoError('not_found', '근무를 찾을 수 없어요.')
    if (s.user_id !== userId || s.source !== 'self') throw new RepoError('auth', '직접 등록한 근무만 수정할 수 있어요.')
    if (new Date(patch.end_at) <= new Date(patch.start_at)) throw new RepoError('validation', '종료 시각은 시작 시각보다 뒤여야 해요.')
    s.start_at = patch.start_at
    s.end_at = patch.end_at
    this.persist()
    return s
  }

  async deleteShift(id: string, userId: string): Promise<void> {
    const s = this.db.shifts.find((x) => x.id === id)
    if (!s) throw new RepoError('not_found', '근무를 찾을 수 없어요.')
    if (s.user_id !== userId || s.source !== 'self') throw new RepoError('auth', '직접 등록한 근무만 삭제할 수 있어요.')
    this.db.shifts = this.db.shifts.filter((x) => x.id !== id)
    this.persist()
  }

  async createPersonalGoal(row: NewRow<PersonalGoal>): Promise<PersonalGoal> {
    if (!row.title.trim()) throw new RepoError('validation', '목표를 입력해주세요.')
    const created: PersonalGoal = { ...row, title: row.title.trim(), id: newId('pg'), created_at: new Date().toISOString() }
    this.db.personal_goals.push(created)
    this.persist()
    return created
  }

  async updatePersonalGoal(id: string, patch: Partial<Pick<PersonalGoal, 'active' | 'title' | 'target_count'>>): Promise<PersonalGoal> {
    const g = this.db.personal_goals.find((x) => x.id === id)
    if (!g) throw new RepoError('not_found', '목표를 찾을 수 없어요.')
    Object.assign(g, patch)
    this.persist()
    return g
  }

  async createShiftPrep(row: Omit<ShiftPrep, 'id'>): Promise<ShiftPrep> {
    const existing = this.db.shift_preps.find((p) => p.user_id === row.user_id && p.shift_id === row.shift_id)
    if (existing) {
      Object.assign(existing, row)
      this.persist()
      return existing
    }
    const created: ShiftPrep = { ...row, id: newId('prep') }
    this.db.shift_preps.push(created)
    this.persist()
    return created
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

  async createReflection(row: NewRow<ShiftReflection>): Promise<ShiftReflection> {
    const existing = this.db.reflections.find((r) => r.user_id === row.user_id && r.shift_id === row.shift_id)
    if (existing) throw new RepoError('validation', '이 근무의 회고는 이미 남겼어요.')
    const created: ShiftReflection = { ...row, id: newId('refl'), created_at: new Date().toISOString() }
    this.db.reflections.push(created)
    this.persist()
    return created
  }

  async updateAssignmentStatus(id: string, status: ActionAssignment['status']): Promise<void> {
    const a = this.db.assignments.find((x) => x.id === id)
    if (!a) throw new RepoError('not_found', '액션을 찾을 수 없어요.')
    a.status = status
    this.persist()
  }

  // manager writes ------------------------------------------------------------
  async setRosterShift(input: { user_id: string; store_id: string; date: string; entry: { start_at: string; end_at: string } | 'off' }): Promise<Shift | null> {
    const existing = this.db.shifts.find((s) => s.user_id === input.user_id && dateOf(s.start_at) === input.date && s.status !== 'cancelled')
    if (input.entry === 'off') {
      if (existing) {
        if (existing.source === 'roster') this.db.shifts = this.db.shifts.filter((s) => s.id !== existing.id)
        else existing.status = 'cancelled'
        this.persist()
      }
      return null
    }
    if (new Date(input.entry.end_at) <= new Date(input.entry.start_at)) throw new RepoError('validation', '종료 시각은 시작 시각보다 뒤여야 해요.')
    const today = dateOf(new Date().toISOString())
    const status: Shift['status'] = input.date < today ? 'completed' : input.date === today ? 'in_progress' : 'scheduled'
    if (existing) {
      existing.start_at = input.entry.start_at
      existing.end_at = input.entry.end_at
      existing.store_id = input.store_id
      existing.source = 'roster'
      existing.status = status
      this.persist()
      return existing
    }
    const created: Shift = { id: newId('sh'), user_id: input.user_id, store_id: input.store_id, start_at: input.entry.start_at, end_at: input.entry.end_at, status, source: 'roster', created_at: new Date().toISOString() }
    this.db.shifts.push(created)
    this.persist()
    return created
  }

  async createAssignments(rows: NewRow<ActionAssignment>[]): Promise<ActionAssignment[]> {
    const now = new Date().toISOString()
    const created = rows.map((r) => ({ ...r, id: newId('asg'), created_at: now }))
    this.db.assignments.push(...created)
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

  async trackEvent(row: Omit<ProductEvent, 'id'>): Promise<void> {
    this.db.product_events.push({ ...row, id: newId('pe') })
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
