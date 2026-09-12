import { describe, expect, it } from 'vitest'
import { deriveKpis, computeAttachRate } from '../lib/analytics/metrics'
import { parseKpiCsv } from '../lib/csvImport'
import { rateStrength } from '../lib/analytics/confidence'
import { generateWeeklyInsights } from '../lib/analytics/insights'
import { recommendNextShiftFocus } from '../lib/analytics/recommendation'
import { buildSeed, DANI_ID, MANAGER_ID } from '../data/seed'
import { LocalRepo } from '../lib/repo/localRepo'
import { addDaysISO, todayISO } from '../lib/dates'

describe('KPI derivation', () => {
  const raw = { visitors: 200, transactions: 50, revenue: 5_000_000, units: 70, accessory_units: 15, accessory_transactions: 12 }
  it('computes CVR / ATV / UPT', () => {
    const k = deriveKpis(raw, 'accessory_units_per_transaction')
    expect(k.cvr).toBeCloseTo(0.25)
    expect(k.atv).toBe(100_000)
    expect(k.upt).toBeCloseTo(1.4)
  })
  it('attach rate follows the store definition instead of a hard-coded formula', () => {
    expect(computeAttachRate(raw, 'accessory_units_per_transaction')).toBeCloseTo(0.3)
    expect(computeAttachRate(raw, 'accessory_transactions_per_transaction')).toBeCloseTo(0.24)
    expect(computeAttachRate(raw, 'accessory_units_per_unit')).toBeCloseTo(15 / 70)
  })
  it('returns null instead of Infinity when the denominator is missing', () => {
    expect(deriveKpis({ ...raw, visitors: 0 }, 'accessory_units_per_transaction').cvr).toBeNull()
    expect(deriveKpis({ ...raw, transactions: null }, 'accessory_units_per_transaction').atv).toBeNull()
  })
})

describe('CSV import validation', () => {
  const ctx = { knownStoreIds: ['st_gangnam'], knownEmployeeIds: ['u_dani'], companyId: 'co', attachRateDefinition: 'accessory_units_per_transaction' as const }
  it('reports missing required columns', () => {
    const r = parseKpiCsv('date,store_id,visitors\n2026-09-01,st_gangnam,10', ctx)
    expect(r.rows).toHaveLength(0)
    expect(r.errors.map((e) => e.column)).toEqual(expect.arrayContaining(['transactions', 'revenue', 'units']))
  })
  it('flags bad dates, unknown stores, non-numeric and impossible values per line', () => {
    const csv = ['date,store_id,visitors,transactions,revenue,units', '2026-13-40,st_nope,abc,5,100,7', '2026-09-01,st_gangnam,100,120,500000,130', '2026-09-02,st_gangnam,100,20,500000,30'].join('\n')
    const r = parseKpiCsv(csv, ctx)
    expect(r.rows).toHaveLength(1)
    expect(r.errors.some((e) => e.line === 2 && e.column === 'date')).toBe(true)
    expect(r.errors.some((e) => e.line === 2 && e.column === 'store_id')).toBe(true)
    expect(r.errors.some((e) => e.line === 2 && e.column === 'visitors')).toBe(true)
    expect(r.errors.some((e) => e.line === 3 && e.column === 'transactions')).toBe(true)
    expect(r.rows[0].cvr).toBeCloseTo(0.2)
    expect(r.rows[0].source).toBe('csv')
  })
  it('handles quoted fields and thousands separators', () => {
    const r = parseKpiCsv('date,store_id,visitors,transactions,revenue,units\n2026-09-03,st_gangnam,"1,200",300,"30,000,000",400', ctx)
    expect(r.errors).toHaveLength(0)
    expect(r.rows[0].visitors).toBe(1200)
  })
})

describe('evidence strength labelling', () => {
  it('never claims correlation on tiny samples', () => {
    expect(rateStrength(2, 10, 20)).toBe('insufficient')
    expect(rateStrength(4, 10, 20)).toBe('building')
    expect(rateStrength(6, 10, 1)).toBe('building')
    expect(rateStrength(6, 10, 8)).toBe('early_signal')
    expect(rateStrength(12, 12, 8)).toBe('correlation')
  })
})

describe('insights and recommendation on seed data', () => {
  const today = todayISO()
  const window = { from: addDaysISO(today, -35), to: addDaysISO(today, 14) }
  it('every insight carries a strength label and correlation caveat when it compares outcomes', async () => {
    const r = new LocalRepo(buildSeed(new Date()))
    const manager = (await r.listDemoAccounts()).find((u) => u.id === MANAGER_ID)!
    const ds = await r.loadDataset(manager, window)
    const insights = generateWeeklyInsights(ds, today)
    expect(insights.length).toBeGreaterThan(0)
    for (const i of insights) {
      expect(i.strength).toBeDefined()
      if ((i.kind === 'action_outcome' || i.kind === 'observation_outcome') && i.strength !== 'insufficient') expect(i.caveat).toContain('인과관계')
      expect(i.body).not.toMatch(/증명|입증/)
    }
  })
  it('recommends a behaviour for a personal user with no store', async () => {
    const r = new LocalRepo(buildSeed(new Date()))
    const u = await r.signUp({ name: 'p', email: 'p@example.com', job_category: 'electronics', interests: ['cross_sell'] })
    const ds = await r.loadDataset(u, window)
    const rec = recommendNextShiftFocus({ dataset: ds, userId: u.id, today })
    expect(rec).not.toBeNull()
    expect(rec!.behaviour).toBe('cross_sell')
    expect(rec!.card).not.toBeNull()
  })
  it('recommends for a demo employee inside a store', async () => {
    const r = new LocalRepo(buildSeed(new Date()))
    const dani = (await r.listDemoAccounts()).find((u) => u.id === DANI_ID)!
    const ds = await r.loadDataset(dani, window)
    expect(recommendNextShiftFocus({ dataset: ds, userId: dani.id, today })).not.toBeNull()
  })
})
