import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Action, ActionEvent, Announcement, Comment, HandoverNote, MoodValue, Quest, Reaction, SkillId, SwapRequest } from '../types'
import { employee, quests as initialQuests, checklistGroup as initialChecklist, todayShift, CURRENT_EMPLOYEE_ID } from '../data/mockData'
import { INITIAL_ACTIONS, INITIAL_ANNOUNCEMENTS, INITIAL_HANDOVERS, STORE_ID, STORE_NAME, STORE_CODE } from '../data/mvpData'
import { INITIAL_ROSTER, ROSTER_MEMBERS, type RosterEntry } from '../data/roster'

export type SheetKind =
  | 'killerScript'
  | 'checklist'
  | 'questDetail'
  | 'shiftDetail'
  | 'learn'
  | 'rolePlay'
  | 'handoverCompose'
  | 'actionCompose'
  | 'joinTeam'
  | 'teamSchedule'
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
  submitMood: (v: MoodValue) => void
  skipMoodCheckIn: () => void
  // v2 — Shift Companion MVP
  actions: Action[]
  addAction: (a: Pick<Action, 'title' | 'kind' | 'target'> & Partial<Action>) => void
  completeAction: (id: string) => void
  weeklyCompletionCount: number
  actionEvents: ActionEvent[] // silent log — not rendered, see types.ts ActionEvent
  handovers: HandoverNote[]
  addHandover: (message: string) => void
  announcements: Announcement[]
  addAnnouncement: (message: string, pinned?: boolean) => void
  toggleReaction: (announcementId: string, emoji: string) => void
  addComment: (announcementId: string, message: string) => void
  // v2 — team join (invite code / link, QR gated to Business tier — see manager side)
  hasJoinedTeam: boolean
  joinTeam: (code: string) => boolean
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

  // v2 — Shift Companion MVP state
  const [actions, setActions] = useState<Action[]>(INITIAL_ACTIONS)
  const [actionEvents, setActionEvents] = useState<ActionEvent[]>([])
  const [handovers, setHandovers] = useState<HandoverNote[]>(INITIAL_HANDOVERS)
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS)
  const [hasJoinedTeam, setHasJoinedTeam] = useState(false)
  const [roster, setRoster] = useState<RosterState>(() => cloneRoster(INITIAL_ROSTER))
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([])

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

  const submitMood = (v: MoodValue) => {
    setTodayMood(v)
    setMoodCheckedIn(true)
    showToast('오늘 컨디션 체크인 완료')
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

  const weeklyCompletionCount = actions.filter((a) => {
    if (!a.completedAt) return false
    const days = (Date.now() - new Date(a.completedAt).getTime()) / (1000 * 60 * 60 * 24)
    return days <= 7
  }).length

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

  const joinTeam = (code: string): boolean => {
    const ok = code.trim().toUpperCase() === STORE_CODE
    if (ok) {
      setHasJoinedTeam(true)
      showToast(`${STORE_NAME} 팀에 참여했어요`)
    }
    return ok
  }

  const updateRosterEntry = (memberId: string, date: string, entry: RosterEntry) => {
    setRoster((prev) => ({ ...prev, [memberId]: { ...prev[memberId], [date]: entry } }))
  }

  const nameOf = (memberId: string) => ROSTER_MEMBERS.find((m) => m.id === memberId)?.name ?? memberId

  // PRO — 근무 교대 요청. 지은(CURRENT_EMPLOYEE_ID)이 자신의 예정 근무를 팀원의
  // 예정 근무와 맞바꾸자고 요청하면, 매니저가 승인/거절한다. 실제 프로덕트에서는
  // 유료 티어 기능이지만, 여기서는 진짜로 동작하는 데모로 구현해 매니저 승인
  // 워크플로 자체를 보여준다 — UI에는 PRO 배지로 표시.
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
    showToast('교대 요청을 보냈어요 — 매니저 승인을 기다려주세요')
  }

  const approveSwap = (id: string) => {
    setSwapRequests((prev) => {
      const req = prev.find((r) => r.id === id)
      if (!req || req.status !== 'pending') return prev
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
      showToast(`${req.requesterName}님 ↔ ${req.targetMemberName}님 교대를 승인했어요`)
      return prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
    })
  }

  const rejectSwap = (id: string) => {
    setSwapRequests((prev) => {
      const req = prev.find((r) => r.id === id)
      if (!req || req.status !== 'pending') return prev
      showToast('교대 요청을 거절했어요')
      return prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r))
    })
  }

  const value = useMemo<AppStateShape>(
    () => ({
      employee,
      quests,
      markQuestProgress,
      checklist,
      toggleChecklistItem,
      sheet,
      openSheet: setSheet,
      closeSheet: () => setSheet({ kind: null }),
      toast,
      showToast,
      todayMood,
      moodCheckedIn,
      submitMood,
      skipMoodCheckIn: () => setMoodCheckedIn(true),
      actions,
      addAction,
      completeAction,
      weeklyCompletionCount,
      actionEvents,
      handovers,
      addHandover,
      announcements,
      addAnnouncement,
      toggleReaction,
      addComment,
      hasJoinedTeam,
      joinTeam,
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
      actions,
      actionEvents,
      handovers,
      announcements,
      weeklyCompletionCount,
      hasJoinedTeam,
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
