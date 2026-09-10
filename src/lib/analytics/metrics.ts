// KPI derivation. Pure functions — no React, no I/O.
import type { AttachRateDefinition, OutcomeEvent, TargetMetric } from '../../types/bellatrix'

export interface RawKpiInput {
  visitors: number | null
  transactions: number | null
  revenue: number | null
  units: number | null
  accessory_units: number | null
  accessory_transactions: number | null
}

export interface DerivedKpis {
  cvr: number | null
  atv: number | null
  upt: number | null
  attach_rate: number | null
}

function ratio(num: number | null, den: number | null): number | null {
  if (num === null || den === null || !Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return null
  return num / den
}

export function computeAttachRate(input: RawKpiInput, definition: AttachRateDefinition): number | null {
  switch (definition) {
    case 'accessory_units_per_transaction':
      return ratio(input.accessory_units, input.transactions)
    case 'accessory_transactions_per_transaction':
      return ratio(input.accessory_transactions, input.transactions)
    case 'accessory_units_per_unit':
      return ratio(input.accessory_units, input.units)
  }
}

export function deriveKpis(input: RawKpiInput, definition: AttachRateDefinition): DerivedKpis {
  return {
    cvr: ratio(input.transactions, input.visitors),
    atv: ratio(input.revenue, input.transactions),
    upt: ratio(input.units, input.transactions),
    attach_rate: computeAttachRate(input, definition),
  }
}

export const ATTACH_RATE_DEFINITION_LABEL: Record<AttachRateDefinition, string> = {
  accessory_units_per_transaction: '부가상품 수량 ÷ 거래 건수',
  accessory_transactions_per_transaction: '부가상품 포함 거래 ÷ 전체 거래',
  accessory_units_per_unit: '부가상품 수량 ÷ 전체 판매 수량',
}

export function metricValue(o: OutcomeEvent, metric: TargetMetric): number | null {
  switch (metric) {
    case 'cvr':
      return o.cvr
    case 'atv':
      return o.atv
    case 'upt':
      return o.upt
    case 'attach_rate':
      return o.attach_rate
    case 'revenue':
      return o.revenue
    case 'none':
      return null
  }
}

export function formatMetric(metric: TargetMetric, value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  switch (metric) {
    case 'cvr':
    case 'attach_rate':
      return `${(value * 100).toFixed(1)}%`
    case 'atv':
    case 'revenue':
      return `₩${Math.round(value).toLocaleString('ko-KR')}`
    case 'upt':
      return value.toFixed(2)
    case 'none':
      return '—'
  }
}

export function formatPercentDelta(a: number, b: number): string {
  if (b === 0) return '—'
  const pct = ((a - b) / b) * 100
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}
