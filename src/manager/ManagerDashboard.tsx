import { Users, Grid3x3, Megaphone, CalendarDays, Construction } from 'lucide-react'
import { ManagerStateProvider, useManagerState, type ManagerView } from '../lib/managerStore'
import { STORES } from '../data/stores'
import { TeamActionsComposer } from './TeamActionsComposer'
import { RosterView } from './RosterView'
import { StoreSwitcher } from './StoreSwitcher'
import { TeamOverview } from './TeamOverview'
import { MatrixView } from './MatrixView'
import { EmployeeDetailPanel } from './EmployeeDetailPanel'
import { QuestCreateModal } from './QuestCreateModal'
import { CoachingGuideModal } from './CoachingGuideModal'
import { SecondaryButton } from '../components/ui'

const NAV: { id: ManagerView; label: string; icon: typeof Users }[] = [
  { id: 'actions', label: '팀 액션 · 공지', icon: Megaphone },
  { id: 'roster', label: '근무 일정 관리', icon: CalendarDays },
  { id: 'team', label: '팀 현황', icon: Users },
  { id: 'matrix', label: 'Will × Capability (고급)', icon: Grid3x3 },
]

function Sidebar() {
  const { view, setView, selectedStoreId } = useManagerState()
  const currentStore = STORES.find((s) => s.id === selectedStoreId) ?? STORES[0]
  return (
    <div className="w-56 shrink-0 border-r border-white/8 flex flex-col py-5 px-3">
      <div className="px-2 mb-4">
        <div className="text-white font-bold text-sm">ShyftStarter</div>
        <div className="text-[11px] text-white/35">Manager Dashboard</div>
      </div>
      <StoreSwitcher />
      <nav className="space-y-1">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active ? 'bg-brand-500/15 text-brand-200' : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          )
        })}
      </nav>
      <div className="mt-auto px-2 pt-4 border-t border-white/8">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white">K</span>
          <div>
            <div className="text-xs font-medium text-white/85">Kim M.</div>
            <div className="text-[10px] text-white/35">Store Manager · {currentStore.name}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StorePlaceholder({ storeName }: { storeName: string }) {
  const { setSelectedStoreId } = useManagerState()
  return (
    <div className="flex-1 flex items-center justify-center px-8 py-8">
      <div className="max-w-sm text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-white/6 flex items-center justify-center">
          <Construction size={20} className="text-white/40" />
        </div>
        <h2 className="text-white font-semibold">{storeName} 데이터는 아직 준비 중이에요</h2>
        <p className="text-sm text-white/40 leading-relaxed">
          여러 매장을 함께 운영하는 매니저를 위한 매장 전환 UX 예시예요. 지금 데모는 강남점 데이터로만
          구성되어 있고, 실제 매장별 데이터 연동은 다음 단계에서 진행돼요.
        </p>
        <SecondaryButton onClick={() => setSelectedStoreId(STORES[0].id)}>{STORES[0].name}으로 돌아가기</SecondaryButton>
      </div>
    </div>
  )
}

function ManagerContent() {
  const { view, selectedStoreId } = useManagerState()
  const currentStore = STORES.find((s) => s.id === selectedStoreId) ?? STORES[0]

  if (!currentStore.ready) {
    return <StorePlaceholder storeName={currentStore.name} />
  }

  return (
    <div className="flex-1 overflow-y-auto app-scroll px-8 py-8">
      {view === 'actions' && <TeamActionsComposer />}
      {view === 'roster' && <RosterView />}
      {view === 'team' && <TeamOverview />}
      {view === 'matrix' && <MatrixView />}
    </div>
  )
}

export function ManagerDashboard() {
  return (
    <ManagerStateProvider>
      <div className="flex h-full w-full">
        <Sidebar />
        <ManagerContent />
      </div>
      <EmployeeDetailPanel />
      <QuestCreateModal />
      <CoachingGuideModal />
    </ManagerStateProvider>
  )
}
