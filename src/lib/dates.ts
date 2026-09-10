// Date helpers shared by seed, analytics and UI. Local-time based on purpose:
// a store's "day" is its local calendar day.
import type { ISODate } from '../types/bellatrix'

export function toISODate(d: Date): ISODate {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}

export function addDaysISO(s: ISODate, n: number): ISODate {
  return toISODate(addDays(parseISODate(s), n))
}

export function todayISO(): ISODate {
  return toISODate(new Date())
}

export function atTime(date: ISODate, hour: number, minute = 0): string {
  const d = parseISODate(date)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function dateOf(iso: string): ISODate {
  return toISODate(new Date(iso))
}

export function fmtTimeHM(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const DOW = ['일', '월', '화', '수', '목', '금', '토']
export function fmtDateKo(date: ISODate): string {
  const d = parseISODate(date)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`
}

export function fmtShortDate(date: ISODate): string {
  const d = parseISODate(date)
  return `${d.getMonth() + 1}.${d.getDate()} (${DOW[d.getDay()]})`
}

/** ISO week key 'YYYY-Www' style label for grouping (Monday-based). */
export function weekKey(date: ISODate): string {
  const d = parseISODate(date)
  const day = (d.getDay() + 6) % 7 // Mon=0
  const monday = addDays(d, -day)
  return toISODate(monday)
}

export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86400000)
}
