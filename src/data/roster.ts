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

// "오늘" in the app's narrative is 2026-08-30 (Sun) — see mockData.ts todayShift.
export const TODAY = '2026-08-30'

export const ROSTER_WEEKS: RosterWeek[] = [
  { id: 'wk_a', label: '이번 주', dates: ['2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30'] },
  { id: 'wk_b', label: '다음 주', dates: ['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06'] },
]

const OFF: RosterEntry = 'off'
const OPEN: RosterEntry = { start: '10:00', end: '18:00' }
const CLOSE: RosterEntry = { start: '14:00', end: '22:00' }

// memberId -> date -> entry. Every date in ROSTER_WEEKS is defined for every
// team member (either a shift or 'off') so the grid never has empty cells.
export const INITIAL_ROSTER: Record<string, Record<string, RosterEntry>> = {
  // 지은 — matches mockData.ts `shifts` exactly for 8/24~9/3 (완료/진행중/휴무/예정 그대로)
  emp_jieun: {
    '2026-08-24': CLOSE, '2026-08-25': OFF, '2026-08-26': OPEN, '2026-08-27': OFF,
    '2026-08-28': CLOSE, '2026-08-29': OFF, '2026-08-30': CLOSE,
    '2026-08-31': OFF, '2026-09-01': OPEN, '2026-09-02': OFF, '2026-09-03': CLOSE,
    '2026-09-04': OFF, '2026-09-05': CLOSE, '2026-09-06': OFF,
  },
  emp_junseo: {
    '2026-08-24': OPEN, '2026-08-25': OPEN, '2026-08-26': OFF, '2026-08-27': CLOSE,
    '2026-08-28': OPEN, '2026-08-29': CLOSE, '2026-08-30': OFF,
    '2026-08-31': OPEN, '2026-09-01': OFF, '2026-09-02': CLOSE, '2026-09-03': OPEN,
    '2026-09-04': CLOSE, '2026-09-05': OFF, '2026-09-06': OPEN,
  },
  emp_mingyeong: {
    '2026-08-24': CLOSE, '2026-08-25': OFF, '2026-08-26': CLOSE, '2026-08-27': CLOSE,
    '2026-08-28': OFF, '2026-08-29': OPEN, '2026-08-30': CLOSE,
    '2026-08-31': CLOSE, '2026-09-01': CLOSE, '2026-09-02': OFF, '2026-09-03': CLOSE,
    '2026-09-04': OFF, '2026-09-05': CLOSE, '2026-09-06': CLOSE,
  },
  emp_dohyun: {
    '2026-08-24': OFF, '2026-08-25': OPEN, '2026-08-26': OPEN, '2026-08-27': OFF,
    '2026-08-28': OPEN, '2026-08-29': OPEN, '2026-08-30': OFF,
    '2026-08-31': OPEN, '2026-09-01': OFF, '2026-09-02': OPEN, '2026-09-03': OFF,
    '2026-09-04': OPEN, '2026-09-05': OPEN, '2026-09-06': OFF,
  },
  emp_seoyeon: {
    '2026-08-24': CLOSE, '2026-08-25': CLOSE, '2026-08-26': OFF, '2026-08-27': OPEN,
    '2026-08-28': OFF, '2026-08-29': CLOSE, '2026-08-30': OPEN,
    '2026-08-31': OFF, '2026-09-01': CLOSE, '2026-09-02': OPEN, '2026-09-03': OFF,
    '2026-09-04': CLOSE, '2026-09-05': OPEN, '2026-09-06': OFF,
  },
  emp_somi: {
    '2026-08-24': OFF, '2026-08-25': OFF, '2026-08-26': CLOSE, '2026-08-27': OPEN,
    '2026-08-28': OFF, '2026-08-29': OFF, '2026-08-30': CLOSE,
    '2026-08-31': OFF, '2026-09-01': OFF, '2026-09-02': CLOSE, '2026-09-03': OPEN,
    '2026-09-04': OFF, '2026-09-05': OFF, '2026-09-06': CLOSE,
  },
}

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
    requesterShiftDate: '2026-08-31',
    targetMemberId: 'emp_jieun',
    targetMemberName: '지은',
    targetShiftDate: '2026-09-01',
    note: '그날 가족 행사가 있어서 근무를 바꿀 수 있을까요?',
    status: 'pending',
    createdAt: '2026-08-29T14:20:00.000Z',
  },
]
