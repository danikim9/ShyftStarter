import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Action, ActionEvent, Announcement, Comment, ExtraPayEntry, HandoverNote, MoodValue, Quest, Reaction, Reminder, SkillId, SwapRequest, TeamMembership, WageSettings } from '../types'
import { employee, quests as initialQuests, checklistGroup as initialChecklist, todayShift, CURRENT_EMPLOYEE_ID } from '../data/mockData'
import {
  INITIAL_ACTIONS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_HANDOVERS,
  INITIAL_REMINDERS,
  INITIAL_WAGE_SETTINGS,
  INITIAL_EXTRA_PAY,
  ACTION_TREND_HISTORY,
  STORE_ID,
  STORE_NAME,
  STORE_CODE,
  CREW_DEMO_CODE,
  buildStoreJoinLink,
} from '../data/mvpData'
import { INITIAL_ROSTER, INITIAL_SWAP_REQUESTS, ROSTER_MEMBERS, type RosterEntry } from '../data/roster'
import { PROGRESS_SUMMARY } from '../data/progressData'

export type SheetKind =
  | 'killerScript'
  | 'checklist'
  | 'questDetail'
  | 'shiftDetail'
  | 'learn'
  | 'rolePlay'
  | 'handoverCompose'
  | 'actionCompose'
  | 'announcementCompose'
  | 'joinTeam'
  | 'teamSchedule'
  | 'reminderCompose'
  | 'wageCalculator'
  | null

type RosterState = Record<string, Record<string, RosterEntry>>

function cloneRoster(r: RosterState): RosterState {
  const out: RosterState = {}
  for (const memberId of Object.keys(r)) out[memberId] = { ...r[memberId] }
  return out
}

export interface SheetState {
  kind: SheetKind
  skillId?: SkillId
  questId?: string
  shiftId?: string
}

interface AppStateShape {
  employee: typeof employee
  quests: Quest[]
  markQuestProgress: (questId: string) => void
  checklist: typeof initialChecklist
  toggleChecklistItem: (itemId: string) => void
  sheet: SheetState
  openSheet: (s: SheetState) => void
  closeSheet: () => void
  toast: string | null
  showToast: (msg: string) => void
  todayMood: MoodValue | null
  moodCheckedIn: boolean
  // 21차 — 컨디션 체크인을 로그인 직후가 아니라 "오늘 근무 상세"를 열 때(하루를
  // 실제로 시작하는 순간)까지 미룬다. moodPromptOpen이 실제 모달 노출 여부다.
  moodPromptOpen: boolean
  submitMood: (v: MoodValue) => void
  skipMoodCheckIn: () => void
  // v2 — Shift Companion MVP
  actions: Action[]
  addAction: (a: Pick<Action, 'title' | 'kind' | 'target'> & Partial<Action>) => void
  completeAction: (id: string) => void
  uncompleteAction: (id: string) => void
  weeklyCompletionCount: number
  currentStreakDays: number
  actionEvents: ActionEvent[] // silent log — not rendered, see types.ts ActionEvent
  // 21차 — My Actions "습관 그래프" 미니 트렌드: 지난 3주 목업 + 이번 주 실시간 값
  weeklyActionTrend: number[]
  // 21차 — 예상 급여 계산기(정확한 급여가 아니라 대략적인 추정치)
  wageSettings: WageSettings
  setHourlyWage: (won: number) => void
  extraPayEntries: ExtraPayEntry[]
  addExtraPayEntry: (input: { label: string; hours: number }) => void
  removeExtraPayEntry: (id: string) => void
  // 개인 알람/리마인더 — 솔로 사용자도 매니저 없이 바로 쓸 수 있는 셀프 기능
  reminders: Reminder[]
  addReminder: (input: { label: string; time: string }) => void
  toggleReminder: (id: string) => void
  removeReminder: (id: string) => void
  setShiftReminderOffset: (offsetMinutes: number) => void
  fireReminderNow: (id: string) => void
  handovers: HandoverNote[]
  addHandover: (message: string) => void
  announcements: Announcement[]
  addAnnouncement: (message: string, pinned?: boolean) => void
  addTeamPost: (message: string) => void
  toggleReaction: (announcementId: string, emoji: string) => void
  addComment: (announcementId: string, message: string) => void
  // v2 — team join (invite code / link, QR gated to Business tier — see manager side)
  // §9-1: membership이 'crew'/'store' 두 갈래로 나뉜다 — 매니저 매장 코드로
  // 참여하면 'store'(Team 티어, 공지·인수인계까지 전부), 직원이 스스로 만들거나
  // 동료 코드로 참여하면 'crew'(Free, 일정 공유·근무 교대까지만).
  membership: TeamMembership
  crewCode: string | null
  joinTeam: (code: string) => boolean
  createCrew: () => string
  // 20차 — 매니저 PRO: 참여 코드 커스터마이즈. storeCode는 이제 mvpData.ts의
  // 고정 상수가 아니라 공유 상태 — 매니저가 바꾸면 joinTeam()도 즉시 새 코드
  // 기준으로 비교하고, 기존 코드는 그 순간부터 유효하지 않다.
  storeCode: string
  storeJoinLink: string
  setStoreCode: (code: string) => { ok: true } | { ok: false; reason: string }
  // 팀 근무 일정 (Manager Dashboard 근무 일정 관리와 공유하는 단일 소스) + PRO — 근무 교대 요청
  roster: RosterState
  updateRosterEntry: (memberId: string, date: string, entry: RosterEntry) => void
  swapRequests: SwapRequest[]
  requestSwap: (params: { requesterShiftDate: string; targetMemberId: string; targetShiftDate: string; note?: string }) => void
  approveSwap: (id: string) => void
  rejectSwap: (id: string) => void
}

const AppStateContext = createContext<AppStateShape | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [quests, setQuests] = useState<Quest[]>(initialQuests)
  const [checklist, setChecklist] = useState(initialChecklist)
  const [sheet, setSheet] = useState<SheetState>({ kind: null })
  const [toast, setToast] = useState<string | null>(null)
  const [todayMood, setTodayMood] = useState<MoodValue | null>(null)
  const [moodCheckedIn, setMoodCheckedIn] = useState(false)
  // 21차 — moodPromptOpen이 실제 노출 트리거다(더 이상 로그인 즉시 열리지 않음).
  // pendingSheetAfterMood는 컨디션 체크인을 마친 뒤 원래 열려던 시트(오늘 근무
  // 상세)를 이어서 열기 위한 대기열.
  const [moodPromptOpen, setMoodPromptOpen] = useState(false)
  const [pendingSheetAfterMood, setPendingSheetAfterMood] = useState<SheetState | null>(null)

  // v2 — Shift Companion MVP state
  const [actions, setActions] = useState<Action[]>(INITIAL_ACTIONS)
  const [actionEvents, setActionEvents] = useState<ActionEvent[]>([])
  const [handovers, setHandovers] = useState<HandoverNote[]>(INITIAL_HANDOVERS)
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS)
  const [membership, setMembership] = useState<TeamMembership>('none')
  const [crewCode, setCrewCode] = useState<string | null>(null)
  const [storeCode, setStoreCodeState] = useState<string>(STORE_CODE)
  const [roster, setRoster] = useState<RosterState>(() => cloneRoster(INITIAL_ROSTER))
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(INITIAL_SWAP_REQUESTS)
  const [reminders, setReminders] = useState<Reminder[]>(INITIAL_REMINDERS)
  const [wageSettings, setWageSettingsState] = useState<WageSettings>(INITIAL_WAGE_SETTINGS)
  const [extraPayEntries, setExtraPayEntries] = useState<ExtraPayEntry[]>(INITIAL_EXTRA_PAY)

  const markQuestProgress = (questId: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id !== questId || q.status === 'completed') return q
        const nextProgress = Math.min(q.progress + 1, q.target)
        const completed = nextProgress >= q.target
        if (completed) {
          setTimeout(() => setToast(`퀘스트 완료! +${q.rewardXp} XP`), 0)
        }
        return { ...q, progress: nextProgress, status: completed ? 'completed' : 'active' }
      })
    )
  }

  const toggleChecklistItem = (itemId: string) => {
    setChecklist((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)),
    }))
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  // 21차 — 컨디션 체크인 타이밍 재검토(솔로 UX 리뷰 피드백). 로그인 직후
  // 앱을 한 번도 못 본 상태에서 바로 묻던 것을, "오늘 근무 상세"를 여는
  // 순간(하루를 실제로 시작하는 자연스러운 지점)까지 미룬다. openSheet가
  // 오늘 시프트의 shiftDetail을 요청하면 실제 시트를 열기 전에 먼저 체크인을
  // 띄우고, 체크인이 끝나면 원래 열려던 시트를 이어서 연다.
  const openSheet = (s: SheetState) => {
    const isTodayShiftDetail = s.kind === 'shiftDetail' && s.shiftId === todayShift.id
    if (isTodayShiftDetail && !moodCheckedIn) {
      setPendingSheetAfterMood(s)
      setMoodPromptOpen(true)
      return
    }
    setSheet(s)
  }

  const proceedAfterMood = () => {
    setMoodPromptOpen(false)
    if (pendingSheetAfterMood) {
      setSheet(pendingSheetAfterMood)
      setPendingSheetAfterMood(null)
    }
  }

  const submitMood = (v: MoodValue) => {
    setTodayMood(v)
    setMoodCheckedIn(true)
    showToast('오늘 컨디션 체크인 완료')
    proceedAfterMood()
  }

  const skipMoodCheckIn = () => {
    setMoodCheckedIn(true)
    proceedAfterMood()
  }

  // v2 — Shift Companion MVP actions
  const addAction: AppStateShape['addAction'] = (a) => {
    const action: Action = {
      id: `act_${Date.now()}`,
      createdBy: 'self',
      progress: 0,
      ...a,
    }
    setActions((prev) => [action, ...prev])
    showToast('할 일을 추가했어요')
  }

  const completeAction = (id: string) => {
    const now = new Date().toISOString()
    setActions((prev) =>
      prev.map((a) => {
        if (a.id !== id || a.completedAt) return a
        const nextProgress = Math.min(a.progress + 1, a.target)
        const done = nextProgress >= a.target
        if (done) {
          setActionEvents((events) => [
            ...events,
            { actionId: a.id, employeeId: CURRENT_EMPLOYEE_ID, shiftId: todayShift.id, kind: a.kind, completedAt: now },
          ])
          setTimeout(() => showToast('완료했어요 🎉'), 0)
        }
        return { ...a, progress: nextProgress, completedAt: done ? now : a.completedAt }
      })
    )
  }

  // 실수로 탭했을 때를 대비한 되돌리기 — 완료 표시를 다시 탭하면 완료를
  // 취소하고 목록 위쪽(진행 중)으로 되돌린다. progress를 1 되돌리고
  // completedAt을 지우며, 완료 시 남겼던 실적 로그(actionEvents)도 함께
  // 지워서 나중에 실제 통계를 낼 때 "취소된 완료"가 섞이지 않게 한다.
  const uncompleteAction = (id: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id && a.completedAt ? { ...a, progress: Math.max(a.progress - 1, 0), completedAt: undefined } : a))
    )
    setActionEvents((prev) => {
      const lastIndex = [...prev].map((e) => e.actionId).lastIndexOf(id)
      if (lastIndex === -1) return prev
      return prev.filter((_, i) => i !== lastIndex)
    })
    showToast('완료를 취소했어요')
  }

  const weeklyCompletionCount = actions.filter((a) => {
    if (!a.completedAt) return false
    const days = (Date.now() - new Date(a.completedAt).getTime()) / (1000 * 60 * 60 * 24)
    return days <= 7
  }).length

  // 솔로 리텐션 갭 보완 — My Actions의 완료 피드백이 "이번 주 N회"뿐이면 "성장하고
  // 있다"는 감각이 약하다는 판단으로 연속 활동 스트릭을 함께 노출한다. 실제 완료
  // 시각(completedAt)은 데모가 실행되는 실제 접속일 기준이라 내러티브상의 "오늘"
  // (mockData.ts TODAY=2026-08-30)과 어긋날 수 있어, Progress 화면(P1)이 이미
  // 쓰고 있는 동일한 스트릭 수치(PROGRESS_SUMMARY)를 그대로 재사용해 두 화면의
  // 숫자가 서로 어긋나지 않게 했다 — 지금 막 완료한 항목은 이번 주 카운터에 바로
  // 반영되므로 "방금 한 게 반영 안 된다"는 느낌은 없다.
  const currentStreakDays = PROGRESS_SUMMARY.currentStreakDays

  // 21차 — My Actions "습관 그래프". 지난 3주는 목업(ACTION_TREND_HISTORY),
  // 마지막 막대(이번 주)만 실시간 weeklyCompletionCount로 채워 지금 막 완료한
  // 항목이 바로 반영되게 한다.
  const weeklyActionTrend = [...ACTION_TREND_HISTORY, weeklyCompletionCount]

  const addHandover = (message: string) => {
    if (!message.trim()) return
    const note: HandoverNote = {
      id: `ho_${Date.now()}`,
      shiftId: todayShift.id,
      storeId: STORE_ID,
      fromEmployeeId: CURRENT_EMPLOYEE_ID,
      fromEmployeeName: employee.name,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    }
    setHandovers((prev) => [note, ...prev])
    showToast('인수인계를 남겼어요')
  }

  const addAnnouncement = (message: string, pinned = false) => {
    if (!message.trim()) return
    const post: Announcement = {
      id: `an_${Date.now()}`,
      storeId: STORE_ID,
      authorName: employee.managerName,
      authorRole: 'manager',
      message: message.trim(),
      pinned,
      createdAt: new Date().toISOString(),
      reactions: [],
      comments: [],
    }
    setAnnouncements((prev) => [post, ...prev])
    showToast('공지를 등록했어요')
  }

  // 19차 — 공지는 이제 매니저 전용이 아니다. 팀원 누구나 남길 수 있고,
  // authorRole: 'employee'로 기록되어 피드 카드에서 매니저 공지("관리자 공지"
  // 배지)와 시각적으로 구분된다. 상단 고정(pinned)은 여전히 매니저만 — 그건
  // 권위 있는 행동이라 별도로 addAnnouncement에만 남겨뒀다.
  const addTeamPost = (message: string) => {
    if (!message.trim()) return
    const post: Announcement = {
      id: `an_${Date.now()}`,
      storeId: STORE_ID,
      authorName: employee.name,
      authorRole: 'employee',
      message: message.trim(),
      pinned: false,
      createdAt: new Date().toISOString(),
      reactions: [],
      comments: [],
    }
    setAnnouncements((prev) => [post, ...prev])
    showToast('공지를 등록했어요')
  }

  const toggleReaction = (announcementId: string, emoji: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id !== announcementId) return a
        const existing = a.reactions.find((r) => r.emoji === emoji)
        const already = existing?.employeeIds.includes(CURRENT_EMPLOYEE_ID)
        let reactions: Reaction[]
        if (existing) {
          reactions = a.reactions
            .map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    employeeIds: already
                      ? r.employeeIds.filter((id) => id !== CURRENT_EMPLOYEE_ID)
                      : [...r.employeeIds, CURRENT_EMPLOYEE_ID],
                  }
                : r
            )
            .filter((r) => r.employeeIds.length > 0)
        } else {
          reactions = [...a.reactions, { emoji, employeeIds: [CURRENT_EMPLOYEE_ID] }]
        }
        return { ...a, reactions }
      })
    )
  }

  const addComment = (announcementId: string, message: string) => {
    if (!message.trim()) return
    const comment: Comment = {
      id: `c_${Date.now()}`,
      employeeId: CURRENT_EMPLOYEE_ID,
      employeeName: employee.name,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    }
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === announcementId ? { ...a, comments: [...a.comments, comment] } : a))
    )
  }

  // §9-1 — 매장 코드(매니저 발급)와 동료 그룹 코드를 같은 입력창에서 함께
  // 받는다. 매장 코드면 'store'(Team 티어 전체 기능), 동료 그룹 코드면
  // 'crew'(Free, 일정 공유·근무 교대까지만)로 참여 상태가 갈린다.
  const joinTeam = (code: string): boolean => {
    const normalized = code.trim().toUpperCase()
    if (normalized === storeCode) {
      setMembership('store')
      setCrewCode(null)
      showToast(`${STORE_NAME} 팀에 참여했어요`)
      return true
    }
    if (normalized === CREW_DEMO_CODE) {
      setMembership('crew')
      setCrewCode(CREW_DEMO_CODE)
      showToast('동료 그룹에 참여했어요')
      return true
    }
    return false
  }

  // 매니저가 아직 매장을 개설하지 않았어도, 직원이 스스로 동료 그룹을 만들 수
  // 있다 — 코드를 발급하고 즉시 'crew'로 참여시킨다. 실제로는 매 호출마다
  // 새 코드를 발급하지만(백엔드 붙으면 서버에서 유니크하게 발급), 데모에서는
  // 매번 새로 만들어도 매번 같은 지은 계정 하나로만 확인 가능.
  const createCrew = (): string => {
    const code = `CREW-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    setMembership('crew')
    setCrewCode(code)
    showToast('동료 그룹을 만들었어요 — 코드를 동료에게 공유해보세요')
    return code
  }

  // 20차 — 매니저 PRO: 참여 코드 커스터마이즈. 랜덤 발급 코드(GN-4821) 대신
  // 매장 브랜드가 드러나는 코드(예: GANGNAM2026)를 직접 정할 수 있게 한다.
  // 'CREW-' 접두사는 createCrew()가 발급하는 동료 그룹 코드 전용으로 예약돼
  // 있어, 매장 코드가 그 접두사를 쓰면 joinTeam()에서 두 코드 종류가 뒤섞일
  // 수 있으므로 거부한다. 코드를 바꾸면 그 순간부터 이전 코드는 더 이상
  // 유효하지 않다 — 이미 참여한 직원의 membership에는 영향 없음(그건 별도
  // 상태), 앞으로 "새로 참여하려는" 사람만 새 코드를 써야 한다.
  const setStoreCode: AppStateShape['setStoreCode'] = (code) => {
    const normalized = code.trim().toUpperCase()
    if (!normalized) return { ok: false, reason: '코드를 입력해주세요' }
    if (normalized.length < 3 || normalized.length > 20) {
      return { ok: false, reason: '3~20자 사이로 입력해주세요' }
    }
    if (!/^[A-Z0-9-]+$/.test(normalized)) {
      return { ok: false, reason: '영문 대문자·숫자·하이픈(-)만 사용할 수 있어요' }
    }
    if (normalized.startsWith('CREW-')) {
      return { ok: false, reason: "'CREW-'로 시작하는 코드는 동료 그룹 전용이라 쓸 수 없어요" }
    }
    setStoreCodeState(normalized)
    showToast('참여 코드를 변경했어요 — 이전 코드는 더 이상 사용할 수 없어요')
    return { ok: true }
  }

  // 21차 — 예상 급여 계산기. "정확한 급여"라고 주장하지 않기 위해 시급은
  // 사용자가 직접 입력하고, 공휴수당/연장수당처럼 계산이 복잡해지는 항목은
  // 자동 산출하지 않는 대신 시간을 직접 기록하면 배율(overtimeMultiplier)로
  // 단순 가산한다.
  const setHourlyWage: AppStateShape['setHourlyWage'] = (won) => {
    const clamped = Math.max(0, Math.round(won) || 0)
    setWageSettingsState((prev) => ({ ...prev, hourlyWage: clamped }))
    showToast(clamped > 0 ? '시급을 저장했어요' : '시급을 초기화했어요')
  }

  const addExtraPayEntry: AppStateShape['addExtraPayEntry'] = ({ label, hours }) => {
    if (!label.trim() || !hours || hours <= 0) return
    const entry: ExtraPayEntry = {
      id: `pay_${Date.now()}`,
      label: label.trim(),
      hours,
      createdAt: new Date().toISOString(),
    }
    setExtraPayEntries((prev) => [entry, ...prev])
    showToast('추가 수당을 기록했어요')
  }

  const removeExtraPayEntry = (id: string) => {
    setExtraPayEntries((prev) => prev.filter((e) => e.id !== id))
    showToast('기록을 삭제했어요')
  }

  const updateRosterEntry = (memberId: string, date: string, entry: RosterEntry) => {
    setRoster((prev) => ({ ...prev, [memberId]: { ...prev[memberId], [date]: entry } }))
  }

  const nameOf = (memberId: string) => ROSTER_MEMBERS.find((m) => m.id === memberId)?.name ?? memberId

  // PRO — 근무 교대 요청. 16차 개편: 매니저가 아니라 "상대 팀원"이 승인 주체다.
  // 요청을 보내면 상대 팀원에게 승인 알람이 가고, 상대가 직접 승인하면 그
  // 즉시 두 사람의 근무가 실제로 교환되며, 그 순간 매니저에게는 승인 권한이
  // 아니라 "이미 정해진 교대" 알림만 간다(FYI). 실제 프로덕트에서는 유료
  // 티어 기능이지만, 여기서는 진짜로 동작하는 데모로 구현했다 — UI에는 PRO
  // 배지로 표시. 단일 페르소나(지은) 제약상 "상대가 승인" 쪽은 지은을
  // target으로 하는 시드 요청(INITIAL_SWAP_REQUESTS)으로 함께 데모한다.
  const requestSwap: AppStateShape['requestSwap'] = ({ requesterShiftDate, targetMemberId, targetShiftDate, note }) => {
    const req: SwapRequest = {
      id: `swap_${Date.now()}`,
      requesterId: CURRENT_EMPLOYEE_ID,
      requesterName: nameOf(CURRENT_EMPLOYEE_ID),
      requesterShiftDate,
      targetMemberId,
      targetMemberName: nameOf(targetMemberId),
      targetShiftDate,
      note: note?.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    setSwapRequests((prev) => [req, ...prev])
    showToast(`${nameOf(targetMemberId)}님에게 승인 알람을 보냈어요`)
  }

  // 상대 팀원이 승인 — 즉시 두 근무를 교환하고, 매니저에게 알림을 보낸다(승인 X, FYI).
  const approveSwap = (id: string) => {
    setSwapRequests((prev) => {
      const req = prev.find((r) => r.id === id)
      if (!req || req.status !== 'pending') return prev
      const now = new Date().toISOString()
      setRoster((prevRoster) => {
        const requesterEntry = prevRoster[req.requesterId]?.[req.requesterShiftDate] ?? 'off'
        const targetEntry = prevRoster[req.targetMemberId]?.[req.targetShiftDate] ?? 'off'
        return {
          ...prevRoster,
          [req.requesterId]: {
            ...prevRoster[req.requesterId],
            [req.requesterShiftDate]: 'off',
            [req.targetShiftDate]: targetEntry,
          },
          [req.targetMemberId]: {
            ...prevRoster[req.targetMemberId],
            [req.targetShiftDate]: 'off',
            [req.requesterShiftDate]: requesterEntry,
          },
        }
      })
      showToast(`${req.requesterName}님과 근무를 맞바꿨어요 — 매니저에게 알림을 보냈어요`)
      return prev.map((r) => (r.id === id ? { ...r, status: 'approved', respondedAt: now, managerNotifiedAt: now } : r))
    })
  }

  const rejectSwap = (id: string) => {
    setSwapRequests((prev) => {
      const req = prev.find((r) => r.id === id)
      if (!req || req.status !== 'pending') return prev
      showToast('교대 요청을 거절했어요')
      return prev.map((r) => (r.id === id ? { ...r, status: 'rejected', respondedAt: new Date().toISOString() } : r))
    })
  }

  // 개인 알람/리마인더 — 매니저가 아직 앱을 쓰지 않는 상태에서도 솔로 사용자가
  // 바로 켤 수 있는 셀프 기능. 커스텀 리마인더는 실제 현재 시각과 비교해서 정말로
  // 울리고(아래 useEffect), 근무 시작 알림은 설정/문구는 실제로 저장되지만 데모의
  // 내러티브 "오늘"과 실제 접속일이 다를 수 있어 fireReminderNow로 즉시 확인할 수
  // 있게 했다 — 실제 백엔드가 붙으면 offsetMinutes 그대로 진짜 예약 푸시에 쓴다.
  const requestNotifyPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }

  const fireBrowserNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body })
      } catch {
        // 알림 API가 막혀 있어도 토스트로는 이미 보여줬으니 조용히 무시
      }
    }
  }

  const addReminder: AppStateShape['addReminder'] = ({ label, time }) => {
    if (!label.trim() || !time) return
    const reminder: Reminder = {
      id: `rem_${Date.now()}`,
      kind: 'custom',
      label: label.trim(),
      time,
      enabled: true,
      createdAt: new Date().toISOString(),
    }
    setReminders((prev) => [reminder, ...prev])
    requestNotifyPermission()
    showToast('리마인더를 추가했어요')
  }

  const toggleReminder = (id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
    requestNotifyPermission()
  }

  const removeReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id))
    showToast('리마인더를 삭제했어요')
  }

  const setShiftReminderOffset = (offsetMinutes: number) => {
    setReminders((prev) => prev.map((r) => (r.kind === 'shiftStart' ? { ...r, offsetMinutes } : r)))
  }

  const fireReminderNow = (id: string) => {
    const target = reminders.find((r) => r.id === id)
    if (!target) return
    const body =
      target.kind === 'shiftStart'
        ? `${target.offsetMinutes}분 뒤 근무가 시작돼요 — 오늘 근무 준비를 확인해보세요`
        : target.label
    showToast(`🔔 ${target.kind === 'shiftStart' ? target.label : target.label}`)
    fireBrowserNotification('ShyftStarter', body)
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, lastFiredAt: new Date().toISOString() } : r)))
  }

  // 커스텀 리마인더 실시간 체크 — 탭이 열려 있는 동안 20초마다 현재 실제 시각(HH:MM)과
  // 비교해서 일치하면 정말로 토스트 + (권한 허용 시) 브라우저 알림을 띄운다.
  useEffect(() => {
    const check = () => {
      const now = new Date()
      const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const todayKey = now.toISOString().slice(0, 10)
      setReminders((prev) =>
        prev.map((r) => {
          if (r.kind !== 'custom' || !r.enabled || !r.time) return r
          const alreadyFiredToday = r.lastFiredAt && r.lastFiredAt.slice(0, 10) === todayKey
          if (r.time === nowHHMM && !alreadyFiredToday) {
            setTimeout(() => {
              showToast(`🔔 ${r.label}`)
              fireBrowserNotification('ShyftStarter', r.label)
            }, 0)
            return { ...r, lastFiredAt: now.toISOString() }
          }
          return r
        })
      )
    }
    const interval = setInterval(check, 20000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<AppStateShape>(
    () => ({
      employee,
      quests,
      markQuestProgress,
      checklist,
      toggleChecklistItem,
      sheet,
      openSheet,
      closeSheet: () => setSheet({ kind: null }),
      toast,
      showToast,
      todayMood,
      moodCheckedIn,
      moodPromptOpen,
      submitMood,
      skipMoodCheckIn,
      actions,
      addAction,
      completeAction,
      uncompleteAction,
      weeklyCompletionCount,
      currentStreakDays,
      actionEvents,
      weeklyActionTrend,
      wageSettings,
      setHourlyWage,
      extraPayEntries,
      addExtraPayEntry,
      removeExtraPayEntry,
      reminders,
      addReminder,
      toggleReminder,
      removeReminder,
      setShiftReminderOffset,
      fireReminderNow,
      handovers,
      addHandover,
      announcements,
      addAnnouncement,
      addTeamPost,
      toggleReaction,
      addComment,
      membership,
      crewCode,
      joinTeam,
      createCrew,
      storeCode,
      storeJoinLink: buildStoreJoinLink(storeCode),
      setStoreCode,
      roster,
      updateRosterEntry,
      swapRequests,
      requestSwap,
      approveSwap,
      rejectSwap,
    }),
    [
      quests,
      checklist,
      sheet,
      toast,
      todayMood,
      moodCheckedIn,
      moodPromptOpen,
      actions,
      actionEvents,
      weeklyActionTrend,
      wageSettings,
      extraPayEntries,
      reminders,
      handovers,
      announcements,
      weeklyCompletionCount,
      currentStreakDays,
      membership,
      crewCode,
      storeCode,
      roster,
      swapRequests,
    ]
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
