// CSV import for store KPI data. Validates required columns, numeric values,
// date format and store/employee ids; returns row-level errors for the UI.
import type { AttachRateDefinition, ISODate, OutcomeEvent } from '../types/bellatrix'
import { deriveKpis } from './analytics/metrics'
import type { NewRow } from './repo/types'

export const REQUIRED_COLUMNS = ['date', 'store_id', 'visitors', 'transactions', 'revenue', 'units'] as const
export const OPTIONAL_COLUMNS = ['employee_id', 'accessory_units', 'accessory_transactions'] as const

export interface CsvImportError {
  line: number // 1-based line in the file (header = 1)
  column: string | null
  message: string
}

export interface CsvParseResult {
  rows: NewRow<OutcomeEvent>[]
  errors: CsvImportError[]
  totalDataLines: number
}

export interface CsvContext {
  knownStoreIds: string[]
  knownEmployeeIds: string[]
  companyId: string | null
  attachRateDefinition: AttachRateDefinition
}

/** Minimal RFC4180-ish parser: handles quoted fields, escaped quotes, CRLF. */
export function parseCsvText(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += ch
      continue
    }
    if (ch === '"') inQuotes = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      rows.push(row)
      row = []
    } else field += ch
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''))
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function parseNumber(raw: string): number | null | 'invalid' {
  const t = raw.trim().replace(/[,₩\s]/g, '')
  if (t === '') return null
  const n = Number(t)
  if (!Number.isFinite(n) || n < 0) return 'invalid'
  return n
}

export function parseKpiCsv(text: string, ctx: CsvContext): CsvParseResult {
  const errors: CsvImportError[] = []
  const table = parseCsvText(text.replace(/^﻿/, ''))
  if (table.length === 0) return { rows: [], errors: [{ line: 1, column: null, message: '파일이 비어 있어요.' }], totalDataLines: 0 }

  const header = table[0].map((h) => h.trim().toLowerCase())
  for (const col of REQUIRED_COLUMNS) {
    if (!header.includes(col)) errors.push({ line: 1, column: col, message: `필수 컬럼 "${col}"이 없어요.` })
  }
  if (errors.length > 0) return { rows: [], errors, totalDataLines: table.length - 1 }

  const idx = (name: string) => header.indexOf(name)
  const rows: NewRow<OutcomeEvent>[] = []
  const seen = new Set<string>()

  for (let r = 1; r < table.length; r++) {
    const line = r + 1
    const cells = table[r]
    const get = (name: string) => {
      const i = idx(name)
      return i >= 0 ? (cells[i] ?? '') : ''
    }
    let rowOk = true
    const fail = (column: string | null, message: string) => {
      errors.push({ line, column, message })
      rowOk = false
    }

    const date = get('date').trim() as ISODate
    if (!DATE_RE.test(date) || Number.isNaN(new Date(`${date}T00:00:00`).getTime())) fail('date', `날짜 형식이 올바르지 않아요 (YYYY-MM-DD): "${date}"`)

    const storeId = get('store_id').trim()
    if (!storeId) fail('store_id', 'store_id가 비어 있어요.')
    else if (!ctx.knownStoreIds.includes(storeId)) fail('store_id', `알 수 없는 매장 ID: "${storeId}"`)

    const employeeRaw = get('employee_id').trim()
    const employeeId = employeeRaw === '' ? null : employeeRaw
    if (employeeId && !ctx.knownEmployeeIds.includes(employeeId)) fail('employee_id', `알 수 없는 직원 ID: "${employeeId}"`)

    const nums: Record<string, number | null> = {}
    for (const col of ['visitors', 'transactions', 'revenue', 'units', 'accessory_units', 'accessory_transactions']) {
      const v = parseNumber(get(col))
      if (v === 'invalid') fail(col, `"${col}" 값이 숫자가 아니에요: "${get(col)}"`)
      else nums[col] = v
    }
    for (const col of ['visitors', 'transactions', 'revenue', 'units']) {
      if (rowOk && nums[col] === null) fail(col, `"${col}" 값이 비어 있어요.`)
    }
    if (rowOk && (nums.transactions ?? 0) > (nums.visitors ?? 0)) fail('transactions', '거래 건수가 방문자 수보다 많아요.')

    const key = `${storeId}|${date}|${employeeId ?? ''}`
    if (rowOk && seen.has(key)) fail(null, '같은 매장·날짜·직원 조합이 파일 안에 두 번 있어요.')
    seen.add(key)

    if (!rowOk) continue
    const raw = {
      visitors: nums.visitors,
      transactions: nums.transactions,
      revenue: nums.revenue,
      units: nums.units,
      accessory_units: nums.accessory_units,
      accessory_transactions: nums.accessory_transactions,
    }
    rows.push({
      company_id: ctx.companyId,
      store_id: storeId,
      user_id: employeeId,
      shift_id: null,
      outcome_date: date,
      ...raw,
      ...deriveKpis(raw, ctx.attachRateDefinition),
      source: 'csv',
    })
  }
  return { rows, errors, totalDataLines: table.length - 1 }
}

export const CSV_TEMPLATE = `date,store_id,employee_id,visitors,transactions,revenue,units,accessory_units
2026-09-01,st_gangnam,,214,52,5460000,71,16
2026-09-02,st_gangnam,,198,47,4890000,63,13`
