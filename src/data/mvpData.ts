// ---------------------------------------------------------------------------
// v2 — Shift Companion MVP seed data: Action(self/manager/AI) · Handover ·
// Announcement. Strategy doc: claude/shyftstarter-v2-strategy-b2c-pivot.md
// ---------------------------------------------------------------------------

import type { Action, Announcement, HandoverNote, Reminder } from '../types'
import { CURRENT_EMPLOYEE_ID } from './mockData'

export const STORE_ID = 'st_gangnam'
export const STORE_NAME = '강남점'
export const STORE_CODE = 'GN-4821' // invite code for the "팀 참여" flow — see joinTeam() in lib/store.tsx
export const STORE_JOIN_LINK = `https://shyftstarter.app/join/${STORE_CODE}`

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
