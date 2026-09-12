// ---------------------------------------------------------------------------
// Manager Dashboard — 근무 일정 관리 (Roster). Independent from the Employee
// App's `shifts` array (mockData.ts): that array models only 지은's own
// schedule for the single-persona demo, while this models the whole team
// across two weeks so a manager can see/assign/edit everyone's shifts and
// off-days in one place. Kept as its own mock dataset rather than wired
// live into the Employee App — see build log 12차 for the reasoning.
// ---------------------------------------------------------------------------

import { team } from './team'
import type { SwapRequest } from '../types'

export type RosterEntry = { start: string; end: string } | 'off'

export interface RosterWeek {
  id: string
  label: string
  dates: string[] // 7 ISO dates, Mon → Sun
}

const dow = ['일', '월', '화', '수', '목', '금', '토']
export function fmtRosterDate(d: string) {
  const dt = new Date(d)
  return { md: `${dt.getMonth() + 1}.${dt.getDate()}`, dow: dow[dt.getDay()] }
}

// Roster weeks are generated relative to the real current date (this week +
// next week, Monday-first) so the team schedule / swap demo never goes stale.
import { addDays, toISODate, todayISO, weekKey, parseISODate } from '../lib/dates'
export const TODAY = todayISO()
const thisMonday = parseISODate(weekKey(TODAY))
const weekDates = (offsetWeeks: number) => Array.from({ length: 7 }, (_, i) => toISODate(addDays(thisMonday, offsetWeeks * 7 + i)))

export const ROSTER_WEEKS: RosterWeek[] = [
  { id: 'wk_a', label: '이번 주', dates: weekDates(0) },
  { id: 'wk_b', label: '다음 주', dates: weekDates(1) },
]

const OFF: RosterEntry = 'off'
const OPEN: RosterEntry = { start: '10:00', end: '18:00' }
const CLOSE: RosterEntry = { start: '14:00', end: '22:00' }

// Weekly patterns Mon→Sun for two weeks, per member. 0=off 1=open 2=close.
const PATTERNS: Record<string, number[]> = {
  emp_jieun: [2, 0, 1, 0, 2, 0, 2, 0, 1, 0, 2, 0, 2, 0],
  emp_junseo: [1, 1, 0, 2, 1, 2, 0, 1, 0, 2, 1, 2, 0, 1],
  emp_mingyeong: [2, 0, 2, 2, 0, 1, 2, 2, 2, 0, 2, 0, 2, 2],
  emp_dohyun: [0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0],
  emp_seoyeon: [2, 2, 0, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0],
  emp_somi: [0, 0, 2, 1, 0, 0, 2, 0, 0, 2, 1, 0, 0, 2],
}
const ENTRY = [OFF, OPEN, CLOSE]
const ALL_DATES = ROSTER_WEEKS.flatMap((w) => w.dates)

// memberId -> date -> entry. Every date in ROSTER_WEEKS is defined for every
// team member (either a shift or 'off') so the grid never has empty cells.
export const INITIAL_ROSTER: Record<string, Record<string, RosterEntry>> = Object.fromEntries(
  Object.entries(PATTERNS).map(([memberId, pattern]) => [memberId, Object.fromEntries(ALL_DATES.map((d, i) => [d, ENTRY[pattern[i]]]))])
)

export const ROSTER_MEMBERS = team.map((m) => ({ id: m.id, name: m.name, role: m.role, avatarColor: m.avatarColor, tenure: m.tenure }))

// 16차 — 받은 교대 요청 데모 시드. 단일 페르소나(지은) 제약상 "상대 팀원이
// 승인한다"는 흐름의 수신 쪽을 보여주려면 지은을 대상(target)으로 하는 요청이
// 미리 하나 있어야 한다 — 박준서가 8/31 근무를 지은의 9/1 근무와 바꾸자고
// 요청한 상태로 시작한다. 지은이 이 요청을 열어 직접 승인/거절할 수 있다.
export const INITIAL_SWAP_REQUESTS: SwapRequest[] = [
  {
    id: 'swap_seed_1',
    requesterId: 'emp_junseo',
    requesterName: '박준서',
    requesterShiftDate: ALL_DATES[7],
    targetMemberId: 'emp_jieun',
    targetMemberName: '지은',
    targetShiftDate: ALL_DATES[8],
    note: '그날 가족 행사가 있어서 근무를 바꿀 수 있을까요?',
    status: 'pending',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
]
