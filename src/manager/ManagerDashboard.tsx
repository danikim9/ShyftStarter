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
// 27차 — iPhone UI 대응: 모바일 하단 탭바에도 이 NAV를 재사용한다. 탭바는
// 폭이 훨씬 좁아서 "근무 일정 관리"/"Will × Capability" 같은 긴 라벨은
// 그대로 못 쓰므로 shortLabel을 별도로 둔다.
const NAV: { id: ManagerView; label: string; shortLabel: string; icon: typeof Users; pro?: boolean }[] = [
  { id: 'actions', label: '팀 액션 · 공지', shortLabel: '공지', icon: Megaphone },
  { id: 'roster', label: '근무 일정 관리', shortLabel: '일정', icon: CalendarDays },
  { id: 'team', label: '팀 현황', shortLabel: '팀 현황', icon: Users },
  { id: 'matrix', label: 'Will × Capability', shortLabel: '분석', icon: Grid3x3, pro: true },
]

// 27차 — 데스크톱 전용 좌측 사이드바. md(768px) 미만에서는 완전히 숨기고
// 대신 MobileTopBar + ManagerBottomNav 조합으로 대체한다 — 224px 고정
// 사이드바가 iPhone 폭(390~430px)에서 콘텐츠 영역을 지나치게 잠식하는 문제라
// "일부만 줄이는" 대신 아예 다른 레이아웃으로 분기했다.
function Sidebar() {
  const { view, setView, selectedStoreId } = useManagerState()
  const currentStore = STORES.find((s) => s.id === selectedStoreId) ?? STORES[0]
  return (
    <div className="hidden md:flex md:w-56 md:shrink-0 border-r border-ink-950/8 flex-col py-5 px-3">
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

// 27차 — 모바일 전용 상단 바. 사이드바 상단에 있던 매장 전환(StoreSwitcher)과
// 매니저 아바타를 한 줄로 옮겼다. 내비게이션은 여기 없음 — 하단 탭바가 담당.
// 28차 후속 — 실기기에서 이 바가 뷰포트 맨 위(y=0)부터 바로 시작해 노치/
// 다이나믹 아일랜드 상태 표시줄과 겹치는 게 확인돼, 위쪽 패딩을
// `max(0.75rem, env(safe-area-inset-top))`로 바꿔 안전 영역만큼 자동으로
// 내려가도록 했다(App.tsx의 StatusBar/LogoutButton과 동일한 패턴).
function MobileTopBar() {
  return (
    <div
      className="md:hidden shrink-0 flex items-center gap-3 px-4 pb-3 border-b border-ink-950/8"
      style={{ paddingTop: 'max(0.75rem, var(--safe-top))' }}
    >
      <div className="flex-1 min-w-0">
        <StoreSwitcher className="" />
      </div>
      <span className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
        K
      </span>
    </div>
  )
}

// 27차 — 모바일 전용 하단 탭바. Employee App의 BottomNav와 같은 패턴(고정
// 하단, 아이콘+짧은 라벨)을 매니저 화면에도 적용해 "iPhone에서 쓰는 느낌"을
// 통일했다. PRO 기능(Will × Capability)은 아이콘 우상단에 작은 점으로만
// 표시 — 탭 하나에 배지 전체를 넣기엔 자리가 부족해서, 데스크톱 사이드바의
// Crown+PRO 배지보다 축약된 신호로 대체했다.
// 28차 후속 — 실기기에서 써보니 Employee BottomNav(아이콘 20px·py-1.5+pt-2)
// 대비 이 탭바(아이콘 18px·py-2.5)가 더 작고 낮게 느껴진다는 피드백 — 아이콘을
// 22px, 텍스트를 11px, 위아래 패딩을 py-3.5로 키워 탭 하나의 터치 영역과
// 시각적 무게감을 Employee 쪽과 비슷하거나 조금 더 넉넉하게 맞췄다.
function ManagerBottomNav() {
  const { view, setView } = useManagerState()
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-paper border-t border-ink-950/8"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-4">
        {NAV.map(({ id, shortLabel, icon: Icon, pro }) => {
          const active = view === id
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex flex-col items-center justify-center gap-1 py-3.5 transition ${
                active ? 'text-brand-600' : 'text-ink-950/40'
              }`}
            >
              <span className="relative">
                <Icon size={22} />
                {pro && <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-amber-signal" />}
              </span>
              <span className="text-[11px] font-medium leading-none">{shortLabel}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function StorePlaceholder({ storeName }: { storeName: string }) {
  const { setSelectedStoreId } = useManagerState()
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center px-4 py-8 md:px-8">
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
    // 27차 — 모바일에서는 고정 하단 탭바(ManagerBottomNav)에 콘텐츠 마지막
    // 줄이 가리지 않도록 pb-24, md 이상에서는 기존 여백(py-8) 그대로.
    <div className="flex-1 min-h-0 overflow-y-auto app-scroll px-4 pt-5 pb-24 md:px-8 md:py-8">
      {view === 'actions' && <TeamActionsComposer />}
      {view === 'roster' && <RosterView />}
      {view === 'team' && <TeamOverview />}
      {view === 'matrix' && <MatrixView />}
    </div>
  )
}

// 27차 — iPhone UI 친화적으로 만들어달라는 요청 반영: md(768px) 미만에서는
// 좌측 고정 사이드바(224px) 대신 상단 바 + 하단 탭바 조합으로 완전히 다른
// 레이아웃을 쓴다. 셋 다 항상 마운트해두고 Tailwind의 hidden/md:hidden
// 조합으로만 전환하므로, 리사이즈나 회전에도 상태(view 등)가 끊기지 않는다.
// md 이상에서는 MobileTopBar/ManagerBottomNav가 완전히 숨고 예전과 동일한
// 데스크톱 레이아웃이 그대로 렌더링된다.
export function ManagerDashboard() {
  return (
    <ManagerStateProvider>
      <div className="flex flex-col md:flex-row h-full w-full">
        <MobileTopBar />
        <Sidebar />
        <ManagerContent />
      </div>
      <ManagerBottomNav />
      <EmployeeDetailPanel />
      <QuestCreateModal />
      <CoachingGuideModal />
    </ManagerStateProvider>
  )
}
