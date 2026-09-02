// ---------------------------------------------------------------------------
// v2 — Shift Companion MVP seed data: Action(self/manager/AI) · Handover ·
// Announcement. Strategy doc: claude/shyftstarter-v2-strategy-b2c-pivot.md
// ---------------------------------------------------------------------------

import type { Action, Announcement, ExtraPayEntry, HandoverNote, Reminder, WageSettings } from '../types'
import { CURRENT_EMPLOYEE_ID } from './mockData'

export const STORE_ID = 'st_gangnam'
export const STORE_NAME = '강남점'
// 20차 — 참여 코드 커스터마이즈(매니저 PRO)로 이 값은 이제 "초기 시드"일 뿐이다.
// 실제 유효한 매장 코드는 AppStateProvider의 storeCode 상태(src/lib/store.tsx)이고,
// joinTeam()도 그 동적 값을 기준으로 비교한다 — 매니저가 코드를 바꾸면 이 상수값은
// 더 이상 유효하지 않게 된다(단일 코드만 유효 — 신구 코드 동시 허용 없음).
export const STORE_CODE = 'GN-4821'
export const buildStoreJoinLink = (code: string) => `https://shyftstarter.app/join/${code}`

// v2 전략 §9-1 — 동료 그룹(Crew). 매니저 없이 직원끼리 먼저 모이는 시나리오를
// 데모하기 위해 "이미 다른 동료가 만들어 둔 그룹"의 예시 코드를 하나 심어둔다 —
// 직접 새로 만들기(createCrew)와, 이미 있는 그룹에 코드로 참여하기(joinTeam) 양쪽
// 흐름을 모두 지은 한 페르소나로 시연할 수 있게 하기 위함.
export const CREW_DEMO_CODE = 'CREW-9F2Q' // 박준서가 미리 만들어 둔 동료 그룹이라는 설정
export const CREW_DEMO_NAME = '강남점 동료들'

export const INITIAL_ACTIONS: Action[] = [
  {
    id: 'act_1',
    kind: 'checklist',
    title: '오픈 전 카운터 정리',
    createdBy: 'self',
    target: 1,
    progress: 0,
    dueLabel: '오늘 오픈 전',
  },
  {
    id: 'act_2',
    kind: 'quest',
    title: '재고 부족 상품 3개 메모하기',
    createdBy: 'manager',
    createdByName: 'Kim M.',
    target: 3,
    progress: 1,
    dueLabel: '이번 시프트',
    assignedToAll: true,
  },
  {
    id: 'act_3',
    kind: 'checklist',
    title: '마감 전 냉장고 온도 체크',
    createdBy: 'self',
    target: 1,
    progress: 1,
    dueLabel: '마감 전',
    completedAt: '2026-08-30T13:10:00.000Z',
  },
  {
    id: 'act_4',
    kind: 'checklist',
    title: '디스플레이 A 진열 확인',
    createdBy: 'manager',
    createdByName: 'Kim M.',
    target: 1,
    progress: 1,
    dueLabel: '오늘',
    completedAt: '2026-08-28T12:40:00.000Z',
  },
  {
    id: 'act_5',
    kind: 'checklist',
    title: '탈의실 정리',
    createdBy: 'self',
    target: 1,
    progress: 1,
    dueLabel: '지난 시프트',
    completedAt: '2026-08-26T11:20:00.000Z',
  },
]

// 개인 알람/리마인더 — 매니저 없이도(솔로 사용자여도) 바로 쓸 수 있는 셀프 기능이라
// 기본으로 근무 시작 알림 1개를 켜둔 상태로 시드한다.
export const INITIAL_REMINDERS: Reminder[] = [
  {
    id: 'rem_shift_start',
    kind: 'shiftStart',
    label: '근무 시작 알림',
    offsetMinutes: 30,
    enabled: true,
    createdAt: '2026-08-24T09:00:00.000Z',
  },
  {
    id: 'rem_custom_1',
    kind: 'custom',
    label: '마감 전 냉장고 온도 체크하기',
    time: '21:30',
    enabled: true,
    createdAt: '2026-08-26T10:00:00.000Z',
  },
]

export const INITIAL_HANDOVERS: HandoverNote[] = [
  {
    id: 'ho_1',
    shiftId: 'sh_1',
    storeId: STORE_ID,
    fromEmployeeId: 'emp_junseo',
    fromEmployeeName: '박준서',
    message: '재고 입고 3시 예정입니다 — 입고되면 진열대 B부터 채워주세요.',
    createdAt: '2026-08-29T13:55:00.000Z',
  },
  {
    id: 'ho_2',
    shiftId: 'sh_2',
    storeId: STORE_ID,
    fromEmployeeId: CURRENT_EMPLOYEE_ID,
    fromEmployeeName: '지은',
    message: 'POS 2번기 영수증 프린터 용지 부족해요. 여분 창고 하단 서랍에 있습니다.',
    createdAt: '2026-08-27T21:50:00.000Z',
  },
]

// 21차 — 예상 급여 계산기. 실제 최저임금·실급여 수치를 임의로 단정하지 않기
// 위해 시급은 0(미설정)으로 시작 — 사용자가 처음 열었을 때 직접 입력하게
// 유도한다. overtimeMultiplier는 공휴수당/연장수당의 단순화된 가산 배율.
export const INITIAL_WAGE_SETTINGS: WageSettings = { hourlyWage: 0, overtimeMultiplier: 1.5 }
export const INITIAL_EXTRA_PAY: ExtraPayEntry[] = []

// 21차 — My Actions "습관 그래프"용 지난 3주 완료 개수 목업(3주 전 → 지난 주).
// 이번 주는 실시간 weeklyCompletionCount를 그대로 이어 붙여 총 4개 막대를 만든다.
export const ACTION_TREND_HISTORY = [2, 4, 3]

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'an_1',
    storeId: STORE_ID,
    authorName: 'Kim M.',
    authorRole: 'manager',
    message: '오늘 POS 2번 사용하지 마세요 — 점검 중입니다. 1번/3번 이용해주세요.',
    pinned: true,
    createdAt: '2026-08-30T09:00:00.000Z',
    reactions: [{ emoji: '👍', employeeIds: ['emp_junseo', 'emp_seoyeon'] }],
    comments: [
      { id: 'c_1', employeeId: 'emp_somi', employeeName: '한소미', message: '넵 확인했습니다!', createdAt: '2026-08-30T09:05:00.000Z' },
    ],
  },
  {
    id: 'an_2',
    storeId: STORE_ID,
    authorName: 'Kim M.',
    authorRole: 'manager',
    message: '이번 주 신제품 진열 가이드 공유드려요 — 디스플레이 A/B 위주로 배치 부탁드립니다.',
    pinned: false,
    createdAt: '2026-08-28T08:30:00.000Z',
    reactions: [{ emoji: '🙌', employeeIds: [CURRENT_EMPLOYEE_ID] }],
    comments: [],
  },
]
