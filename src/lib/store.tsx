import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { MoodValue, Quest, SkillId } from '../types'
import { employee, quests as initialQuests, checklistGroup as initialChecklist } from '../data/mockData'

export type SheetKind = 'killerScript' | 'checklist' | 'questDetail' | 'shiftDetail' | 'learn' | 'rolePlay' | null

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
}

const AppStateContext = createContext<AppStateShape | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [quests, setQuests] = useState<Quest[]>(initialQuests)
  const [checklist, setChecklist] = useState(initialChecklist)
  const [sheet, setSheet] = useState<SheetState>({ kind: null })
  const [toast, setToast] = useState<string | null>(null)
  const [todayMood, setTodayMood] = useState<MoodValue | null>(null)
  const [moodCheckedIn, setMoodCheckedIn] = useState(false)

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
    }),
    [quests, checklist, sheet, toast, todayMood, moodCheckedIn]
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
