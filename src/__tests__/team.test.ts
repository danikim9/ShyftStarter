import { describe, expect, it } from 'vitest'
import { buildSeed, DANI_ID, MANAGER_ID, STORE_ID } from '../data/seed'
import { LocalRepo } from '../lib/repo/localRepo'
import { addDaysISO, todayISO } from '../lib/dates'
import { buildCoachingGuide, buildTeamProfiles, COACHED_BEHAVIOURS } from '../lib/analytics/team'

const today = todayISO()
const window = { from: addDaysISO(today, -35), to: addDaysISO(today, 14) }

async function managerDataset() {
  const r = new LocalRepo(buildSeed(new Date()))
  const manager = (await r.listDemoAccounts()).find((u) => u.id === MANAGER_ID)!
  return { r, manager, ds: await r.loadDataset(manager, window) }
}

describe('manager team profiles', () => {
  it('builds one profile per employee from manager-visible evidence only', async () => {
    const { ds } = await managerDataset()
    // The dataset the manager receives has no private rows at all.
    expect(ds.personal_goals).toHaveLength(0)
    expect(ds.reflections).toHaveLength(0)
    const profiles = buildTeamProfiles(ds, today)
    expect(profiles.map((p) => p.user.role)).toEqual(profiles.map(() => 'employee'))
    expect(profiles.length).toBe(ds.users.filter((u) => u.role === 'employee').length)
    for (const p of profiles) {
      expect(p.behaviours.map((b) => b.behaviour)).toEqual(COACHED_BEHAVIOURS)
      for (const b of p.behaviours) expect(['strong', 'gap', 'unknown']).toContain(b.reading)
      if (p.gap) expect(p.behaviours.find((b) => b.behaviour === p.gap)?.reading).toBe('gap')
      if (p.strongest) expect(p.behaviours.find((b) => b.behaviour === p.strongest)?.reading).toBe('strong')
    }
  })

  it('sorts by priority so the person who needs attention comes first', async () => {
    const { ds } = await managerDataset()
    const profiles = buildTeamProfiles(ds, today)
    for (let i = 1; i < profiles.length; i++) expect(profiles[i - 1].priority).toBeGreaterThanOrEqual(profiles[i].priority)
    expect(profiles.some((p) => p.signals.length > 0)).toBe(true)
  })

  it('coaching guide has 5 steps, quotes only manager-visible numbers and never judges', async () => {
    const { ds } = await managerDataset()
    const dani = buildTeamProfiles(ds, today).find((p) => p.user.id === DANI_ID)!
    const card = ds.coaching_cards[0] ?? null
    const guide = buildCoachingGuide(dani, card)
    expect(guide).toHaveLength(5)
    const text = guide.map((g) => g.prompt).join('\n')
    expect(text).toContain('본인만 보는 기록')
    expect(text).not.toMatch(/점수|등급|랭킹|못해요|부족한 사람/)
    if (card) expect(text).toContain(card.headline)
  })
})

describe('manager roster editing', () => {
  it('creates, updates and clears a roster shift and the employee sees it as source roster', async () => {
    const { r } = await managerDataset()
    const date = addDaysISO(today, 9)
    const created = await r.setRosterShift({ user_id: DANI_ID, store_id: STORE_ID, date, entry: { start_at: `${date}T10:00:00.000Z`, end_at: `${date}T16:00:00.000Z` } })
    expect(created?.source).toBe('roster')
    expect(created?.status).toBe('scheduled')
    const updated = await r.setRosterShift({ user_id: DANI_ID, store_id: STORE_ID, date, entry: { start_at: `${date}T12:00:00.000Z`, end_at: `${date}T20:00:00.000Z` } })
    expect(updated?.id).toBe(created?.id)
    const dani = (await r.listDemoAccounts()).find((u) => u.id === DANI_ID)!
    const ds = await r.loadDataset(dani, window)
    expect(ds.shifts.filter((s) => s.id === created?.id && s.status !== 'cancelled')).toHaveLength(1)
    await expect(r.setRosterShift({ user_id: DANI_ID, store_id: STORE_ID, date, entry: { start_at: `${date}T12:00:00.000Z`, end_at: `${date}T11:00:00.000Z` } })).rejects.toThrow()
    const off = await r.setRosterShift({ user_id: DANI_ID, store_id: STORE_ID, date, entry: 'off' })
    expect(off).toBeNull()
    const after = await r.loadDataset(dani, window)
    expect(after.shifts.filter((s) => s.id === created?.id && s.status !== 'cancelled')).toHaveLength(0)
  })
})
