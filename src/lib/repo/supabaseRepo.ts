// Supabase adapter. Activated when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
// are set. Table/column names match src/types/bellatrix.ts and the migration in
// supabase/migrations/. Privacy is enforced server-side by RLS; the filters here
// only narrow the payload.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  Action,
  ActionAssignment,
  ActionEvent,
  BehaviourEvidence,
  Campaign,
  CoachingCard,
  Company,
  ConsentSetting,
  OutcomeEvent,
  PersonalGoal,
  Pilot,
  PilotParticipant,
  ProductEvent,
  Shift,
  ShiftPrep,
  ShiftReflection,
  Store,
  StoreDataset,
  Team,
  TeamMembership,
  User,
} from '../../types/bellatrix'
import { RepoError, type BellatrixRepo, type DatasetWindow, type NewRow, type SignInParams, type SignUpParams } from './types'
import { applyVisibility } from './visibility'

// Interfaces are not assignable to Record<string, unknown>; a mapped type is.
type Plain<T> = { [K in keyof T]: T[K] }
type Tbl<T> = { Row: Plain<T>; Insert: Partial<Plain<T>>; Update: Partial<Plain<T>>; Relationships: [] }

export interface Database {
  public: {
    Tables: {
      companies: Tbl<Company>
      stores: Tbl<Store>
      users: Tbl<User>
      teams: Tbl<Team>
      team_memberships: Tbl<TeamMembership>
      shifts: Tbl<Shift>
      actions: Tbl<Action>
      coaching_cards: Tbl<CoachingCard>
      personal_goals: Tbl<PersonalGoal>
      shift_preps: Tbl<ShiftPrep>
      campaigns: Tbl<Campaign>
      action_assignments: Tbl<ActionAssignment>
      action_events: Tbl<ActionEvent>
      behaviour_evidence: Tbl<BehaviourEvidence>
      outcome_events: Tbl<OutcomeEvent>
      shift_reflections: Tbl<ShiftReflection>
      pilots: Tbl<Pilot>
      pilot_participants: Tbl<PilotParticipant>
      product_events: Tbl<ProductEvent>
    }
    Views: Record<string, never>
    Functions: {
      bx_join_team: { Args: { p_code: string }; Returns: Plain<Team> }
      bx_leave_team: { Args: Record<string, never>; Returns: undefined }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

function mapError(e: { message: string; code?: string } | null, fallback: string): RepoError {
  if (!e) return new RepoError('unknown', fallback)
  const msg = e.message || fallback
  if (/JWT|auth|permission|policy|401|403/i.test(msg)) return new RepoError('auth', '권한이 없거나 로그인이 만료됐어요. 다시 로그인해주세요.')
  if (/fetch|network|Failed to fetch|timeout/i.test(msg)) return new RepoError('network', '네트워크에 연결할 수 없어요. 연결 상태를 확인하고 다시 시도해주세요.')
  return new RepoError('unknown', msg)
}

export class SupabaseRepo implements BellatrixRepo {
  readonly mode = 'supabase' as const
  private client: SupabaseClient<Database>

  constructor(url: string, anonKey: string) {
    this.client = createClient<Database>(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  }

  private async profile(id: string): Promise<User> {
    const { data, error } = await this.client.from('users').select('*').eq('id', id).maybeSingle()
    if (error) throw mapError(error, '사용자 정보를 불러올 수 없어요.')
    if (!data) throw new RepoError('not_found', '계정은 있지만 매장 프로필이 아직 없어요. 매니저에게 초대를 요청해주세요.')
    return data
  }

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await this.client.auth.getSession()
    if (error) throw mapError(error, '세션을 확인할 수 없어요.')
    if (!data.session) return null
    return this.profile(data.session.user.id)
  }

  async signIn({ email, password }: SignInParams): Promise<User> {
    if (!password) throw new RepoError('validation', '비밀번호를 입력해주세요.')
    const { data, error } = await this.client.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      if (/invalid/i.test(error.message)) throw new RepoError('auth', '이메일 또는 비밀번호가 올바르지 않아요.')
      throw mapError(error, '로그인에 실패했어요.')
    }
    return this.profile(data.user.id)
  }

  async signUp(params: SignUpParams): Promise<User> {
    if (!params.password || params.password.length < 8) throw new RepoError('validation', '비밀번호는 8자 이상이어야 해요.')
    const { data, error } = await this.client.auth.signUp({
      email: params.email.trim(),
      password: params.password,
      options: { data: { name: params.name.trim(), role: 'employee', job_category: params.job_category } },
    })
    if (error) throw mapError(error, '가입에 실패했어요.')
    if (!data.user) throw new RepoError('unknown', '가입 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해주세요.')
    // profile row is created by the auth trigger; interests are stored afterwards
    const { error: upErr } = await this.client.from('users').update({ interests: params.interests }).eq('id', data.user.id)
    if (upErr) console.warn('[signUp] interests not saved', upErr.message)
    return this.profile(data.user.id)
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut()
    if (error) throw mapError(error, '로그아웃에 실패했어요.')
  }

  async listDemoAccounts(): Promise<User[]> {
    return []
  }

  async updateConsent(userId: string, consent: ConsentSetting): Promise<User> {
    const { data, error } = await this.client.from('users').update({ consent }).eq('id', userId).select('*').single()
    if (error) throw mapError(error, '설정을 저장할 수 없어요.')
    return data
  }

  async joinTeam(userId: string, code: string): Promise<{ user: User; team: Team }> {
    const { data, error } = await this.client.rpc('bx_join_team', { p_code: code.trim() })
    if (error) {
      if (/invalid_code/.test(error.message)) throw new RepoError('not_found', '코드가 올바르지 않아요. 매니저에게 받은 초대 코드를 확인해주세요.')
      throw mapError(error, '팀에 참여할 수 없어요.')
    }
    return { user: await this.profile(userId), team: data }
  }

  async leaveTeam(userId: string): Promise<User> {
    const { error } = await this.client.rpc('bx_leave_team', {})
    if (error) throw mapError(error, '팀을 떠날 수 없어요.')
    return this.profile(userId)
  }

  async loadDataset(viewer: User, window: DatasetWindow): Promise<StoreDataset> {
    const from = `${window.from}T00:00:00`
    const to = `${window.to}T23:59:59`
    const c = this.client
    const storeId = viewer.store_id

    const [store, team, memberships, users, shifts, actions, cards, goals, preps, campaigns, assignments, events, evidence, outcomes, reflections, pilots, participants] =
      await Promise.all([
        storeId ? c.from('stores').select('*').eq('id', storeId).maybeSingle() : Promise.resolve({ data: null, error: null }),
        viewer.team_id ? c.from('teams').select('*').eq('id', viewer.team_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        c.from('team_memberships').select('*'),
        storeId ? c.from('users').select('*').eq('store_id', storeId) : c.from('users').select('*').eq('id', viewer.id),
        c.from('shifts').select('*').gte('start_at', from).lte('start_at', to),
        c.from('actions').select('*').eq('active', true),
        c.from('coaching_cards').select('*').eq('active', true),
        c.from('personal_goals').select('*'),
        c.from('shift_preps').select('*').gte('shift_date', window.from).lte('shift_date', window.to),
        storeId ? c.from('campaigns').select('*').eq('store_id', storeId) : Promise.resolve({ data: [], error: null }),
        c.from('action_assignments').select('*').gte('assigned_date', window.from).lte('assigned_date', window.to),
        c.from('action_events').select('*').gte('event_at', from).lte('event_at', to),
        c.from('behaviour_evidence').select('*').gte('observed_at', from).lte('observed_at', to),
        c.from('outcome_events').select('*').gte('outcome_date', window.from).lte('outcome_date', window.to),
        c.from('shift_reflections').select('*').gte('shift_date', window.from).lte('shift_date', window.to),
        c.from('pilots').select('*'),
        c.from('pilot_participants').select('*'),
      ])
    const results = [store, team, memberships, users, shifts, actions, cards, goals, preps, campaigns, assignments, events, evidence, outcomes, reflections, pilots, participants]
    const failed = results.find((r) => r.error)
    if (failed?.error) throw mapError(failed.error, '데이터를 불러올 수 없어요.')
    if (storeId && !store.data) throw new RepoError('not_found', '매장 정보를 찾을 수 없어요.')

    const companyRes = store.data ? await c.from('companies').select('*').eq('id', store.data.company_id).maybeSingle() : { data: null }

    const full: StoreDataset = {
      company: companyRes.data ?? null,
      store: store.data ?? null,
      team: team.data ?? null,
      memberships: memberships.data ?? [],
      users: users.data ?? [],
      shifts: shifts.data ?? [],
      actions: actions.data ?? [],
      coaching_cards: cards.data ?? [],
      personal_goals: goals.data ?? [],
      shift_preps: preps.data ?? [],
      campaigns: campaigns.data ?? [],
      assignments: assignments.data ?? [],
      action_events: events.data ?? [],
      evidence: evidence.data ?? [],
      outcomes: outcomes.data ?? [],
      reflections: reflections.data ?? [],
      pilots: pilots.data ?? [],
      pilot_participants: participants.data ?? [],
    }
    // RLS already limits rows; applyVisibility is defence in depth.
    return applyVisibility(full, viewer)
  }

  async createShift(row: NewRow<Shift>): Promise<Shift> {
    const { data, error } = await this.client.from('shifts').insert(row).select('*').single()
    if (error) throw mapError(error, '근무를 저장할 수 없어요.')
    return data
  }

  async createShifts(rows: NewRow<Shift>[]): Promise<Shift[]> {
    const out: Shift[] = []
    for (const row of rows) out.push(await this.createShift(row))
    return out
  }

  async updateShift(id: string, userId: string, patch: Pick<Shift, 'start_at' | 'end_at'>): Promise<Shift> {
    const { data, error } = await this.client.from('shifts').update(patch).eq('id', id).eq('user_id', userId).select('*').single()
    if (error) throw mapError(error, '근무를 수정할 수 없어요.')
    return data
  }

  async deleteShift(id: string, userId: string): Promise<void> {
    const { error } = await this.client.from('shifts').delete().eq('id', id).eq('user_id', userId)
    if (error) throw mapError(error, '근무를 삭제할 수 없어요.')
  }

  async createPersonalGoal(row: NewRow<PersonalGoal>): Promise<PersonalGoal> {
    const { data, error } = await this.client.from('personal_goals').insert(row).select('*').single()
    if (error) throw mapError(error, '목표를 저장할 수 없어요.')
    return data
  }

  async updatePersonalGoal(id: string, patch: Partial<Pick<PersonalGoal, 'active' | 'title' | 'target_count'>>): Promise<PersonalGoal> {
    const { data, error } = await this.client.from('personal_goals').update(patch).eq('id', id).select('*').single()
    if (error) throw mapError(error, '목표를 저장할 수 없어요.')
    return data
  }

  async createShiftPrep(row: Omit<ShiftPrep, 'id'>): Promise<ShiftPrep> {
    const existing = await this.client.from('shift_preps').select('id').eq('user_id', row.user_id).eq('shift_id', row.shift_id).maybeSingle()
    if (existing.error) throw mapError(existing.error, '준비 기록을 저장할 수 없어요.')
    const q = existing.data
      ? this.client.from('shift_preps').update(row).eq('id', existing.data.id).select('*').single()
      : this.client.from('shift_preps').insert(row).select('*').single()
    const { data, error } = await q
    if (error) throw mapError(error, '준비 기록을 저장할 수 없어요.')
    return data
  }

  async setRosterShift(input: { user_id: string; store_id: string; date: string; entry: { start_at: string; end_at: string } | 'off' }): Promise<Shift | null> {
    const existing = await this.client
      .from('shifts')
      .select('*')
      .eq('user_id', input.user_id)
      .gte('start_at', `${input.date}T00:00:00`)
      .lte('start_at', `${input.date}T23:59:59`)
      .neq('status', 'cancelled')
      .maybeSingle()
    if (existing.error) throw mapError(existing.error, '근무표를 저장할 수 없어요.')
    if (input.entry === 'off') {
      if (existing.data) {
        const { error } = await this.client.from('shifts').update({ status: 'cancelled' }).eq('id', existing.data.id)
        if (error) throw mapError(error, '근무표를 저장할 수 없어요.')
      }
      return null
    }
    const patch = { start_at: input.entry.start_at, end_at: input.entry.end_at, store_id: input.store_id, source: 'roster' as const, status: 'scheduled' as const }
    if (existing.data) {
      const { data, error } = await this.client.from('shifts').update(patch).eq('id', existing.data.id).select('*').single()
      if (error) throw mapError(error, '근무표를 저장할 수 없어요.')
      return data
    }
    const { data, error } = await this.client.from('shifts').insert({ user_id: input.user_id, ...patch }).select('*').single()
    if (error) throw mapError(error, '근무표를 저장할 수 없어요.')
    return data
  }

  async createAssignments(rows: NewRow<ActionAssignment>[]): Promise<ActionAssignment[]> {
    const { data, error } = await this.client.from('action_assignments').insert(rows).select('*')
    if (error) throw mapError(error, '액션을 배정할 수 없어요.')
    return data ?? []
  }

  async updateAssignmentStatus(id: string, status: ActionAssignment['status']): Promise<void> {
    const { error } = await this.client.from('action_assignments').update({ status }).eq('id', id)
    if (error) throw mapError(error, '액션 상태를 저장할 수 없어요.')
  }

  async createActionEvent(row: Omit<ActionEvent, 'id'>): Promise<ActionEvent> {
    const { data, error } = await this.client.from('action_events').insert(row).select('*').single()
    if (error) throw mapError(error, '진행 기록을 저장할 수 없어요.')
    return data
  }

  async createEvidence(rows: NewRow<BehaviourEvidence>[]): Promise<BehaviourEvidence[]> {
    const { data, error } = await this.client.from('behaviour_evidence').insert(rows).select('*')
    if (error) throw mapError(error, '체크인을 저장할 수 없어요.')
    return data ?? []
  }

  async upsertOutcome(row: NewRow<OutcomeEvent>): Promise<OutcomeEvent> {
    let q = this.client.from('outcome_events').select('id').eq('store_id', row.store_id).eq('outcome_date', row.outcome_date)
    q = row.user_id ? q.eq('user_id', row.user_id) : q.is('user_id', null)
    const existing = await q.maybeSingle()
    if (existing.error) throw mapError(existing.error, 'KPI를 저장할 수 없어요.')
    if (existing.data) {
      const { data, error } = await this.client.from('outcome_events').update(row).eq('id', existing.data.id).select('*').single()
      if (error) throw mapError(error, 'KPI를 저장할 수 없어요.')
      return data
    }
    const { data, error } = await this.client.from('outcome_events').insert(row).select('*').single()
    if (error) throw mapError(error, 'KPI를 저장할 수 없어요.')
    return data
  }

  async createReflection(row: NewRow<ShiftReflection>): Promise<ShiftReflection> {
    const { data, error } = await this.client.from('shift_reflections').insert(row).select('*').single()
    if (error) throw mapError(error, '회고를 저장할 수 없어요.')
    return data
  }

  async trackEvent(row: Omit<ProductEvent, 'id'>): Promise<void> {
    const { error } = await this.client.from('product_events').insert(row)
    if (error) console.warn('[tracking] failed', error.message)
  }

  async resetDemoData(): Promise<void> {
    throw new RepoError('validation', '실서버 모드에서는 데모 데이터를 초기화할 수 없어요.')
  }
}
