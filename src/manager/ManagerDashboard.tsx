import { Users, Grid3x3, Megaphone } from 'lucide-react'
import { ManagerStateProvider, useManagerState, type ManagerView } from '../lib/managerStore'
import { TeamActionsComposer } from './TeamActionsComposer'
import { TeamOverview } from './TeamOverview'
import { MatrixView } from './MatrixView'
import { EmployeeDetailPanel } from './EmployeeDetailPanel'
import { QuestCreateModal } from './QuestCreateModal'
import { CoachingGuideModal } from './CoachingGuideModal'

const NAV: { id: ManagerView; label: string; icon: typeof Users }[] = [
  { id: 'actions', label: '팀 액션 · 공지', icon: Megaphone },
  { id: 'team', label: '팀 현황', icon: Users },
  { id: 'matrix', label: 'Will × Capability (고급)', icon: Grid3x3 },
]

function Sidebar() {
  const { view, setView } = useManagerState()
  return (
    <div className="w-56 shrink-0 border-r border-white/8 flex flex-col py-5 px-3">
      <div className="px-2 mb-6">
        <div className="text-white font-bold text-sm">ShyftStarter</div>
        <div className="text-[11px] text-white/35">Manager Dashboard</div>
      </div>
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
            <div className="text-[10px] text-white/35">Store Manager · Gangnam</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ManagerContent() {
  const { view } = useManagerState()
  return (
    <div className="flex-1 overflow-y-auto app-scroll px-8 py-8">
      {view === 'actions' && <TeamActionsComposer />}
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
