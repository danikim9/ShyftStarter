// ---------------------------------------------------------------------------
// 21차 — 예상 급여 계산기 순수 함수. UI에서 분리해 어디서든(미리보기 카드,
// 상세 시트) 같은 계산 로직을 재사용한다. "정확한 급여"가 아니라 사용자가
// 직접 입력한 시급 기준의 추정치라는 전제를 계속 유지한다.
// ---------------------------------------------------------------------------

import type { ExtraPayEntry, Shift } from '../types'

/** 시프트 하나의 근무 시간(시간 단위). 'off'거나 시간이 없으면 0. 종료 시각이
 * 시작 시각보다 이르면(자정을 넘기는 근무) 24시간을 더해 처리한다. */
export function shiftHours(shift: Shift): number {
  if (shift.status === 'off' || !shift.start || !shift.end) return 0
  const [sh, sm] = shift.start.split(':').map(Number)
  const [eh, em] = shift.end.split(':').map(Number)
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0
  const startMin = sh * 60 + sm
  let endMin = eh * 60 + em
  if (endMin <= startMin) endMin += 24 * 60
  return (endMin - startMin) / 60
}

export function totalHours(shifts: Shift[]): number {
  return shifts.reduce((sum, s) => sum + shiftHours(s), 0)
}

export function sumShiftPay(shifts: Shift[], hourlyWage: number): number {
  return Math.round(totalHours(shifts) * hourlyWage)
}

export function sumExtraPay(entries: ExtraPayEntry[], hourlyWage: number, multiplier: number): number {
  const hours = entries.reduce((sum, e) => sum + e.hours, 0)
  return Math.round(hours * hourlyWage * multiplier)
}

export function fmtHours(h: number): string {
  return Number.isInteger(h) ? `${h}` : h.toFixed(1)
}

export function fmtWon(n: number): string {
  return `${Math.round(n).toLocaleString('ko-KR')}원`
}
