import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { STORE_ID } from '../data/mvpData'

// Bellatrix manager views first; legacy Shift-Companion views live under 'more'.
export type ManagerView = 'home' | 'insights' | 'kpi' | 'more' | 'actions' | 'roster' | 'team' | 'matrix'
export const LEGACY_MANAGER_VIEWS: ManagerView[] = ['actions', 'roster', 'team', 'matrix']

interface ManagerStateShape {
  view: ManagerView
  setView: (v: ManagerView) => void
  selectedStoreId: string
  setSelectedStoreId: (id: string) => void
  detailMemberId: string | null
  openDetail: (id: string) => void
  closeDetail: () => void
  questModalMemberId: string | null
  openQuestModal: (id: string) => void
  closeQuestModal: () => void
  coachingGuideMemberId: string | null
  openCoachingGuide: (id: string) => void
  closeCoachingGuide: () => void
}

const ManagerStateContext = createContext<ManagerStateShape | null>(null)

export function ManagerStateProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ManagerView>('home')
  const [selectedStoreId, setSelectedStoreId] = useState<string>(STORE_ID)
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null)
  const [questModalMemberId, setQuestModalMemberId] = useState<string | null>(null)
  const [coachingGuideMemberId, setCoachingGuideMemberId] = useState<string | null>(null)

  const value = useMemo<ManagerStateShape>(
    () => ({
      view,
      setView,
      selectedStoreId,
      setSelectedStoreId,
      detailMemberId,
      openDetail: setDetailMemberId,
      closeDetail: () => setDetailMemberId(null),
      questModalMemberId,
      openQuestModal: setQuestModalMemberId,
      closeQuestModal: () => setQuestModalMemberId(null),
      coachingGuideMemberId,
      openCoachingGuide: setCoachingGuideMemberId,
      closeCoachingGuide: () => setCoachingGuideMemberId(null),
    }),
    [view, selectedStoreId, detailMemberId, questModalMemberId, coachingGuideMemberId]
  )

  return <ManagerStateContext.Provider value={value}>{children}</ManagerStateContext.Provider>
}

export function useManagerState() {
  const ctx = useContext(ManagerStateContext)
  if (!ctx) throw new Error('useManagerState must be used within ManagerStateProvider')
  return ctx
}
