import { describe, expect, it } from 'vitest'
import { aggregate, deltaPct, lastNDays, weekComparison } from '../lib/analytics/kpiSummary'
import { buildSeed, MANAGER_ID } from '../data/seed'
import { LocalRepo } from '../lib/repo/localRepo'
import { addDaysISO, todayISO, weekKey } from '../lib/dates'
import type { OutcomeEvent } from '../types/bellatrix'

const row = (date: string, visitors: number, transactions: number, revenue: number, units: number | null): OutcomeEvent => ({
  id: `o_${date}`,
  company_id: null,
  store_id: 'st',
  user_id: null,
  shift_id: null,
  outcome_date: date,
  visitors,
  transactions,
  revenue,
  units,
  accessory_units: null,
  accessory_transactions: null,
  cvr: transactions / visitors,
  atv: revenue / transactions,
  upt: units === null ? null : units / transactions,
  attach_rate: null,
  source: 'manual',
  created_at: `${date}T00:00:00.000Z`,
})

describe('manager KPI summary (CVR · AOV · UPT)', () => {
  it('aggregates as ratio of sums, not average of ratios', () => {
    const a = aggregate([row('2026-09-07', 100, 10, 1_000_000, 12), row('2026-09-08', 300, 60, 3_000_000, 90)])
    expect(a.cvr).toBeCloseTo(70 / 400)
    expect(a.aov).toBeCloseTo(4_000_000 / 70)
    expect(a.upt).toBeCloseTo(102 / 70)
    expect(a.days).toBe(2)
  })
  it('returns null instead of Infinity/NaN when a denominator is missing', () => {
    const a = aggregate([row('2026-09-07', 0, 0, 0, null)])
    expect(a.cvr).toBeNull()
    expect(a.aov).toBeNull()
    expect(a.upt).toBeNull()
    expect(aggregate([]).cvr).toBeNull()
    expect(deltaPct(1, 0)).toBeNull()
    expect(deltaPct(null, 1)).toBeNull()
    expect(deltaPct(1.1, 1)).toBeCloseTo(10)
  })
  it('compares Mon–today with the same weekdays of last week on seed data', async () => {
    const today = todayISO()
    const r = new LocalRepo(buildSeed(new Date()))
    const manager = (await r.listDemoAccounts()).find((u) => u.id === MANAGER_ID)!
    const ds = await r.loadDataset(manager, { from: addDaysISO(today, -35), to: addDaysISO(today, 14) })
    const { thisWeek, lastWeek } = weekComparison(ds, today)
    const daysSinceMonday = Math.round((Date.parse(today) - Date.parse(weekKey(today))) / 86_400_000) + 1
    expect(thisWeek.days).toBeLessThanOrEqual(daysSinceMonday)
    expect(lastWeek.days).toBeLessThanOrEqual(daysSinceMonday)
    expect(lastNDays(ds, today, 7).length).toBeLessThanOrEqual(7)
    for (const o of lastNDays(ds, today, 7)) expect(o.user_id).toBeNull()
  })
})
