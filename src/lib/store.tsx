import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Action, ActionEvent, Announcement, Comment, HandoverNote, MoodValue, Quest, Reaction, SkillId } from '../types'
import { employee, quests as initialQuests, checklistGroup as initialChecklist, todayShift, CURRENT_EMPLOYEE_ID } from '../data/mockData'
import { INITIAL_ACTIONS, INITIAL_ANNOUNCEMENTS, INITIAL_HANDOVERS, STORE_ID } from '../data/mvpData'

export type SheetKind =
  | 'killerScript'
  | 'checklist'
  | 'questDetail'
  | 'shiftDetail'
  | 'learn'
  | 'rolePlay'
  | 'handoverCompose'
  | 'actionCompose'
  | null

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
    }),
    [quests, checklist, sheet, toast, todayMood, moodCheckedIn, actions, actionEvents, handovers, announcements, weeklyCompletionCount]
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
