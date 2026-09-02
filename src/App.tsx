import { useState } from 'react'
import { Smartphone, LayoutDashboard, LineChart, LogOut } from 'lucide-react'
import { AppStateProvider } from './lib/store'
import { LoginScreen } from './auth/LoginScreen'
import { OnboardingScreen } from './onboarding/OnboardingScreen'
import { BottomNav, type TabId } from './components/BottomNav'
import { SheetHost } from './components/sheets/SheetHost'
import { Toast } from './components/Toast'
import { MoodCheckIn } from './components/MoodCheckIn'
import { Home } from './screens/Home'
import { Schedule } from './screens/Schedule'
import { Quests } from './screens/Quests'
import { Stats } from './screens/Stats'
import { Coach } from './screens/Coach'
import { Progress } from './screens/Progress'
import { Team } from './screens/Team'
import { MyShift } from './screens/MyShift'
import { TeamFeed } from './screens/TeamFeed'
import { MyActions } from './screens/MyActions'
import { ManagerDashboard } from './manager/ManagerDashboard'
import { ExecutiveDashboard } from './exec/ExecutiveDashboard'

type Persona = 'employee' | 'manager' | 'executive'

// 23차 — 라이트 테마 전환. 예전엔 어두운 배경 위 반투명 흰색 pill로 떠 보이게
// 했지만, 이제 배경 자체가 흰색이라 옅은 라벤더 그레이(ink-900) 바탕 +
// 그림자로 떠 보이게 하고, 선택된 항목은 흰 pill(그림자)로 한 단계 더 떠
// 보이게 한다 — iOS 세그먼트 컨트롤과 같은 방식.
function PersonaSwitcher({ persona, onChange }: { persona: Persona; onChange: (p: Persona) => void }) {
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-0.5 rounded-full bg-ink-900 border border-ink-950/8 p-1 shadow-md">
      {(
        [
          { id: 'employee' as const, label: 'Employee App', icon: Smartphone },
          { id: 'manager' as const, label: 'Manager Dashboard', icon: LayoutDashboard },
          { id: 'executive' as const, label: 'Executive Dashboard', icon: LineChart },
        ]
      ).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
            persona === id ? 'bg-white text-brand-600 shadow-sm' : 'text-ink-950/45 hover:text-ink-950/75'
          }`}
        >
          <Icon size={12} />
          {label}
        </button>
      ))}
    </div>
  )
}

function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <button
      onClick={onLogout}
      title="로그아웃 (데모 재시작)"
      className="fixed top-3 right-3 z-[60] w-8 h-8 rounded-full bg-ink-900 border border-ink-950/8 shadow-md flex items-center justify-center text-ink-950/50 hover:text-ink-950/80 transition"
    >
      <LogOut size={13} />
    </button>
  )
}

function StatusBar() {
  return (
    <div className="shrink-0 flex items-center justify-between px-6 pt-3 pb-1 text-ink-950 text-[13px] font-semibold">
      <span>9:41</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] tracking-wide text-ink-950/50 font-medium">ShyftStarter</span>
      </div>
    </div>
  )
}

function Screen({ tab, onNavigate }: { tab: TabId; onNavigate: (t: TabId) => void }) {
  switch (tab) {
    case 'home':
      return <Home onNavigate={onNavigate} />
    case 'schedule':
      return <Schedule />
    case 'quests':
      return <Quests />
    case 'stats':
      return <Stats />
    case 'coach':
      return <Coach />
    case 'progress':
      return <Progress />
    case 'team':
      return <Team />
    case 'myShift':
      return <MyShift onNavigate={onNavigate} />
    case 'teamFeed':
      return <TeamFeed />
    case 'myActions':
      return <MyActions />
  }
}

// 23차 — 밝고 귀여운 라이트 테마. 짙은 남색 라디얼 그라디언트 대신 아주
// 옅은 라벤더 → 흰색으로 은은하게 퍼지는 파스텔 그라디언트를 바깥 배경으로,
// 폰 프레임 안쪽은 순백(--color-paper)으로 채운다. 그림자도 짙은 검정 대신
// 브랜드 컬러가 살짝 배어 나오는 부드러운 그림자로.
const APP_BACKDROP = 'bg-[radial-gradient(circle_at_top,_#f3edff_0%,_#ffffff_55%)]'
const PHONE_SHADOW = 'sm:shadow-[0_30px_80px_-20px_rgba(139,92,246,0.25)]'

function EmployeeAppShell() {
  const [tab, setTab] = useState<TabId>('myShift')

  return (
    <div className={`min-h-screen w-full ${APP_BACKDROP} flex items-center justify-center py-0 sm:py-8 px-0 sm:px-4`}>
      <div className={`relative w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:rounded-[2.75rem] sm:border sm:border-ink-950/8 overflow-hidden flex flex-col bg-paper ${PHONE_SHADOW}`}>
        <StatusBar />
        <div className="relative grow overflow-y-auto app-scroll">
          <Screen tab={tab} onNavigate={setTab} />
        </div>
        <BottomNav active={tab} onChange={setTab} />
        <SheetHost onNavigate={setTab} />
        <MoodCheckIn />
        <Toast />
      </div>
    </div>
  )
}

function ManagerAppShell() {
  return (
    <div className={`h-screen w-full ${APP_BACKDROP} relative overflow-hidden`}>
      <ManagerDashboard />
      <Toast />
    </div>
  )
}

function ExecutiveAppShell() {
  return (
    <div className={`h-screen w-full ${APP_BACKDROP} relative overflow-hidden`}>
      <ExecutiveDashboard />
    </div>
  )
}

// 19차 — 로그인 직후 매장/그룹 코드를 받던 별도 'join' 스테이지를 없앴다.
// 그 온보딩 내용은 Team 탭 안으로 그대로 옮겨졌다(TeamFeed.tsx의
// OnboardingJoinSection 참고) — 로그인하면 바로 앱으로 들어간다.
// 22차 — 로그인 버튼 화면 앞에 붙는 3장짜리 소개 랜딩('onboarding')을
// 새로 추가했다. 처음 앱을 여는 사람만 거치면 되는 화면이라 로그아웃
// 버튼(데모 재시작)은 여기를 건너뛰고 바로 'login'으로 보낸다.
// 24차 — 팀원/매니저/이그제큐티브를 하나의 아티팩트에서 상단 스위처로 넘나들던
// 걸, 세 개의 독립된 아티팩트(개별 링크)로 나눴다. 빌드 시점에 VITE_PERSONA
// 환경 변수로 "이 빌드는 어떤 페르소나 전용인지"를 고정한다 —
//   VITE_PERSONA=employee  → 온보딩→로그인→Employee App만(스위처 없음, 팀원용 링크)
//   VITE_PERSONA=manager   → 로그인 없이 곧장 Manager Dashboard만(관리자용 링크)
//   VITE_PERSONA=executive → 로그인 없이 곧장 Executive Dashboard만(경영진용 링크)
//   (미설정, 즉 `npm run dev` 등 일반 개발 빌드) → 기존처럼 스위처로 세 페르소나를
//   모두 오갈 수 있는 통합 빌드 — 로컬에서 세 화면을 한 번에 확인/디버그할 때 사용.
const PERSONA_LOCK = import.meta.env.VITE_PERSONA

type Stage = 'onboarding' | 'login' | 'app'

export default function App() {
  const [stage, setStage] = useState<Stage>('onboarding')
  const [persona, setPersona] = useState<Persona>(PERSONA_LOCK ?? 'employee')

  if (PERSONA_LOCK === 'manager') {
    return (
      <AppStateProvider>
        <ManagerAppShell />
      </AppStateProvider>
    )
  }
  if (PERSONA_LOCK === 'executive') {
    return (
      <AppStateProvider>
        <ExecutiveAppShell />
      </AppStateProvider>
    )
  }

  return (
    <AppStateProvider>
      {stage === 'onboarding' && <OnboardingScreen onDone={() => setStage('login')} />}
      {stage === 'login' && <LoginScreen onLogin={() => setStage('app')} />}
      {stage === 'app' && (
        <>
          {!PERSONA_LOCK && <PersonaSwitcher persona={persona} onChange={setPersona} />}
          <LogoutButton onLogout={() => setStage('login')} />
          {persona === 'employee' && <EmployeeAppShell />}
          {persona === 'manager' && <ManagerAppShell />}
          {persona === 'executive' && <ExecutiveAppShell />}
        </>
      )}
    </AppStateProvider>
  )
}
