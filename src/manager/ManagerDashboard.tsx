import { Users, Grid3x3, Megaphone, CalendarDays, Construction, Crown } from 'lucide-react'
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

// 26차 — "(고급)"이 사이드바 폭(224px)에서 한글 단어 단위로 줄바꿈되지 않고
// 글자 중간에서 잘려 보이던 문제 수정: 라벨에서 괄호 표기를 떼어내고, 다른
// PRO 기능들(TeamInvite/RosterView/TeamScheduleView)과 동일한 Crown+PRO
// 배지로 별도 표시. 라벨 자체도 break-keep으로 감싸 혹시 두 줄로 넘어가도
// 한글 단어 중간이 아니라 단어 경계에서만 줄바꿈되도록 함.
const NAV: { id: ManagerView; label: string; icon: typeof Users; pro?: boolean }[] = [
  { id: 'actions', label: '팀 액션 · 공지', icon: Megaphone },
  { id: 'roster', label: '근무 일정 관리', icon: CalendarDays },
  { id: 'team', label: '팀 현황', icon: Users },
  { id: 'matrix', label: 'Will × Capability', icon: Grid3x3, pro: true },
]

function Sidebar() {
  const { view, setView, selectedStoreId } = useManagerState()
  const currentStore = STORES.find((s) => s.id === selectedStoreId) ?? STORES[0]
  return (
    <div className="w-56 shrink-0 border-r border-ink-950/8 flex flex-col py-5 px-3">
      <div className="px-2 mb-4">
        <div className="text-ink-950 font-bold text-sm">ShyftStarter</div>
        <div className="text-[11px] text-ink-950/35">Manager Dashboard</div>
      </div>
      <StoreSwitcher />
      <nav className="space-y-1">
        {NAV.map(({ id, label, icon: Icon, pro }) => {
          const active = view === id
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active ? 'bg-brand-500/15 text-brand-700' : 'text-ink-950/50 hover:bg-ink-950/5 hover:text-ink-950/80'
              }`}
            >
              <Icon size={16} className="mt-0.5 shrink-0" />
              <span className="flex flex-col items-start gap-1 min-w-0">
                <span className="break-keep leading-snug text-left">{label}</span>
                {pro && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-signal/15 text-amber-600 text-[10px] font-bold px-2 py-0.5">
                    <Crown size={10} /> PRO
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </nav>
      <div className="mt-auto px-2 pt-4 border-t border-ink-950/8">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white">K</span>
          <div>
            <div className="text-xs font-medium text-ink-950/85">Kim M.</div>
            <div className="text-[10px] text-ink-950/35">Store Manager · {currentStore.name}</div>
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
        <div className="w-12 h-12 mx-auto rounded-2xl bg-ink-950/6 flex items-center justify-center">
          <Construction size={20} className="text-ink-950/40" />
        </div>
        <h2 className="text-ink-950 font-semibold">{storeName} 데이터는 아직 준비 중이에요</h2>
        <p className="text-sm text-ink-950/40 leading-relaxed">
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
