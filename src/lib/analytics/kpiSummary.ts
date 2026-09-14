// Store-level KPI summaries for the manager: CVR · AOV · UPT from raw daily
// totals. Weekly figures are ratio-of-sums (not averages of daily ratios) so a
// busy Saturday counts as much as it should.
import type { ISODate, OutcomeEvent, StoreDataset } from '../../types/bellatrix'
import { addDaysISO, weekKey } from '../dates'

export interface KpiTriple {
  cvr: number | null
  aov: number | null
  upt: number | null
  days: number
  visitors: number
  transactions: number
  revenue: number
}

export function storeDays(ds: StoreDataset): OutcomeEvent[] {
  return ds.outcomes.filter((o) => o.user_id === null).sort((a, b) => b.outcome_date.localeCompare(a.outcome_date))
}

function sum(rows: OutcomeEvent[], k: 'visitors' | 'transactions' | 'revenue' | 'units'): number {
  return rows.reduce((n, r) => n + (r[k] ?? 0), 0)
}

export function aggregate(rows: OutcomeEvent[]): KpiTriple {
  const visitors = sum(rows, 'visitors')
  const transactions = sum(rows, 'transactions')
  const revenue = sum(rows, 'revenue')
  const units = sum(rows, 'units')
  const unitsKnown = rows.some((r) => r.units !== null)
  return {
    cvr: visitors > 0 ? transactions / visitors : null,
    aov: transactions > 0 ? revenue / transactions : null,
    upt: transactions > 0 && unitsKnown ? units / transactions : null,
    days: rows.length,
    visitors,
    transactions,
    revenue,
  }
}

/** This week (Mon–today) vs the same weekdays of last week. */
export function weekComparison(ds: StoreDataset, today: ISODate): { thisWeek: KpiTriple; lastWeek: KpiTriple } {
  const rows = storeDays(ds)
  const monday = weekKey(today)
  const thisRows = rows.filter((r) => r.outcome_date >= monday && r.outcome_date <= today)
  const lastMonday = addDaysISO(monday, -7)
  const lastEnd = addDaysISO(today, -7)
  const lastRows = rows.filter((r) => r.outcome_date >= lastMonday && r.outcome_date <= lastEnd)
  return { thisWeek: aggregate(thisRows), lastWeek: aggregate(lastRows) }
}

export function lastNDays(ds: StoreDataset, today: ISODate, n: number): OutcomeEvent[] {
  const from = addDaysISO(today, -(n - 1))
  return storeDays(ds).filter((r) => r.outcome_date >= from && r.outcome_date <= today)
}

/** Relative change as a signed percent string, or null when not comparable. */
export function deltaPct(a: number | null, b: number | null): number | null {
  if (a === null || b === null || b === 0) return null
  return ((a - b) / b) * 100
}
