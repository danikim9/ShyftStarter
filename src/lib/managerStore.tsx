import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { STORE_ID } from '../data/mvpData'

// Bellatrix manager views first; legacy Shift-Companion views live under 'more'.
export type ManagerView = 'home' | 'insights' | 'kpi' | 'more' | 'actions' | 'roster' | 'team' | 'matrix'
export const LEGACY_MANAGER_VIEWS: ManagerView[] = ['actions', 'roster', 'matrix']
export type TeamSegment = 'members' | 'roster'

interface ManagerStateShape {
  view: ManagerView
  setView: (v: ManagerView) => void
  teamSegment: TeamSegment
  setTeamSegment: (s: TeamSegment) => void
  rosterFocusUserId: string | null
  showRosterFor: (userId: string | null) => void
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
  const [teamSegment, setTeamSegment] = useState<TeamSegment>('members')
  const [rosterFocusUserId, setRosterFocusUserId] = useState<string | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<string>(STORE_ID)
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null)
  const [questModalMemberId, setQuestModalMemberId] = useState<string | null>(null)
  const [coachingGuideMemberId, setCoachingGuideMemberId] = useState<string | null>(null)

  const value = useMemo<ManagerStateShape>(
    () => ({
      view,
      setView,
      teamSegment,
      setTeamSegment,
      rosterFocusUserId,
      showRosterFor: (userId) => {
        setRosterFocusUserId(userId)
        setTeamSegment('roster')
        setView('team')
      },
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
    [view, teamSegment, rosterFocusUserId, selectedStoreId, detailMemberId, questModalMemberId, coachingGuideMemberId]
  )

  return <ManagerStateContext.Provider value={value}>{children}</ManagerStateContext.Provider>
}

export function useManagerState() {
  const ctx = useContext(ManagerStateContext)
  if (!ctx) throw new Error('useManagerState must be used within ManagerStateProvider')
  return ctx
}
