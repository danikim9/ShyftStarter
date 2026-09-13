import { describe, expect, it } from 'vitest'
import { LocalRepo } from '../lib/repo/localRepo'
import { buildSeed, DANI_ID, MANAGER_ID, TEAM_JOIN_CODE } from '../data/seed'
import { applyVisibility } from '../lib/repo/visibility'
import { addDaysISO, todayISO } from '../lib/dates'

const today = todayISO()
const window = { from: addDaysISO(today, -35), to: addDaysISO(today, 14) }

function repo() {
  return new LocalRepo(buildSeed(new Date()))
}

describe('privacy: what a manager can see', () => {
  it('never returns private reflections, personal goals or personal-goal events to a manager', async () => {
    const r = repo()
    const manager = (await r.listDemoAccounts()).find((u) => u.id === MANAGER_ID)!
    const ds = await r.loadDataset(manager, window)
    expect(ds.reflections.filter((x) => x.user_id !== manager.id && x.visibility === 'private')).toHaveLength(0)
    expect(ds.personal_goals.filter((g) => g.user_id !== manager.id)).toHaveLength(0)
    expect(ds.action_events.filter((e) => e.user_id !== manager.id && e.visibility === 'private')).toHaveLength(0)
    expect(ds.shift_preps.filter((p) => p.user_id !== manager.id && p.visibility === 'private')).toHaveLength(0)
  })

  it('still lets the manager see team-action execution status and observations', async () => {
    const r = repo()
    const manager = (await r.listDemoAccounts()).find((u) => u.id === MANAGER_ID)!
    const ds = await r.loadDataset(manager, window)
    expect(ds.action_events.some((e) => e.action_kind === 'team_action' && e.user_id === DANI_ID)).toBe(true)
    expect(ds.evidence.some((e) => e.evidence_source === 'manager_observation')).toBe(true)
    expect(ds.outcomes.length).toBeGreaterThan(0)
  })

  it('employees receive only their own rows and no store KPIs', async () => {
    const r = repo()
    const dani = (await r.listDemoAccounts()).find((u) => u.id === DANI_ID)!
    const ds = await r.loadDataset(dani, window)
    expect(ds.reflections.every((x) => x.user_id === DANI_ID)).toBe(true)
    expect(ds.personal_goals.every((g) => g.user_id === DANI_ID)).toBe(true)
    expect(ds.shifts.every((s) => s.user_id === DANI_ID)).toBe(true)
    // Only rows carrying the employee's own id (POS/CSV per-employee sales); never store totals.
    expect(ds.outcomes.length).toBeGreaterThan(0)
    expect(ds.outcomes.every((o) => o.user_id === DANI_ID)).toBe(true)
    expect(ds.reflections.length).toBeGreaterThan(0)
  })

  it('applyVisibility is a pure function of viewer role', () => {
    const seed = buildSeed(new Date())
    const manager = seed.users.find((u) => u.id === MANAGER_ID)!
    const ds = applyVisibility(
      {
        company: null,
        store: seed.stores[0],
        team: seed.teams[0],
        memberships: seed.memberships,
        users: seed.users,
        shifts: seed.shifts,
        actions: seed.actions,
        coaching_cards: seed.coaching_cards,
        personal_goals: seed.personal_goals,
        shift_preps: seed.shift_preps,
        campaigns: seed.campaigns,
        assignments: seed.assignments,
        action_events: seed.action_events,
        evidence: seed.evidence,
        outcomes: seed.outcomes,
        reflections: seed.reflections,
        pilots: seed.pilots,
        pilot_participants: seed.pilot_participants,
      },
      manager
    )
    expect(ds.personal_goals).toHaveLength(0)
    expect(ds.reflections).toHaveLength(0)
  })
})

describe('personal mode without a team', () => {
  it('signs up, stores shifts and goals, and loads a dataset with no store', async () => {
    const r = repo()
    const u = await r.signUp({ name: '테스트', email: 'test@example.com', job_category: 'electronics', interests: ['discovery'] })
    expect(u.store_id).toBeNull()
    expect(u.team_id).toBeNull()
    const shift = await r.createShift({ user_id: u.id, store_id: null, start_at: `${today}T13:00:00.000Z`, end_at: `${today}T21:00:00.000Z`, status: 'in_progress', source: 'self' })
    const goal = await r.createPersonalGoal({ user_id: u.id, title: '니즈 질문 3번', behaviour_type: 'discovery', target_count: 3, source: 'self', coaching_card_id: null, active: true, visibility: 'private' })
    const ds = await r.loadDataset(u, window)
    expect(ds.store).toBeNull()
    expect(ds.shifts.map((s) => s.id)).toContain(shift.id)
    expect(ds.personal_goals.map((g) => g.id)).toContain(goal.id)
    expect(ds.coaching_cards.length).toBeGreaterThan(0)
    expect(ds.assignments).toHaveLength(0)
  })

  it('rejects a second shift on the same day and an unknown join code, and joins with a valid code', async () => {
    const r = repo()
    const u = await r.signUp({ name: '테스트', email: 'test2@example.com', job_category: 'beauty', interests: [] })
    await r.createShift({ user_id: u.id, store_id: null, start_at: `${today}T10:00:00.000Z`, end_at: `${today}T18:00:00.000Z`, status: 'in_progress', source: 'self' })
    await expect(r.createShift({ user_id: u.id, store_id: null, start_at: `${today}T13:00:00.000Z`, end_at: `${today}T21:00:00.000Z`, status: 'in_progress', source: 'self' })).rejects.toThrow()
    await expect(r.joinTeam(u.id, 'NOPE-0000')).rejects.toThrow()
    const { user, team } = await r.joinTeam(u.id, TEAM_JOIN_CODE.toLowerCase())
    expect(user.team_id).toBe(team.id)
    expect(user.store_id).toBe(team.store_id)
    const left = await r.leaveTeam(u.id)
    expect(left.team_id).toBeNull()
  })

  it('does not let a manager account be created through sign-up', async () => {
    const r = repo()
    const u = await r.signUp({ name: 'x', email: 'x@example.com', job_category: 'other', interests: [] })
    expect(u.role).toBe('employee')
  })
})
