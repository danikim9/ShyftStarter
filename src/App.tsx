import { useState } from 'react'
import { Smartphone, LayoutDashboard, LineChart, LogOut } from 'lucide-react'
import { AppStateProvider } from './lib/store'
import { LoginScreen } from './auth/LoginScreen'
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

function PersonaSwitcher({ persona, onChange }: { persona: Persona; onChange: (p: Persona) => void }) {
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-0.5 rounded-full bg-ink-800/90 border border-white/10 p-1 shadow-lg backdrop-blur-sm">
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
            persona === id ? 'bg-white text-ink-950' : 'text-white/50 hover:text-white/80'
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
      className="fixed top-3 right-3 z-[60] w-8 h-8 rounded-full bg-ink-800/90 border border-white/10 shadow-lg backdrop-blur-sm flex items-center justify-center text-white/50 hover:text-white/80 transition"
    >
      <LogOut size={13} />
    </button>
  )
}

function StatusBar() {
  return (
    <div className="shrink-0 flex items-center justify-between px-6 pt-3 pb-1 text-white text-[13px] font-semibold">
      <span>9:41</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] tracking-wide text-white/50 font-medium">ShyftStarter</span>
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

function EmployeeAppShell() {
  const [tab, setTab] = useState<TabId>('myShift')

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#1b2140_0%,_#0b0e1a_60%)] flex items-center justify-center py-0 sm:py-8 px-0 sm:px-4">
      <div className="relative w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:rounded-[2.75rem] sm:border sm:border-white/10 overflow-hidden flex flex-col bg-ink-950 sm:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)]">
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
    <div className="h-screen w-full bg-[radial-gradient(circle_at_top,_#1b2140_0%,_#0b0e1a_60%)] relative overflow-hidden">
      <ManagerDashboard />
      <Toast />
    </div>
  )
}

function ExecutiveAppShell() {
  return (
    <div className="h-screen w-full bg-[radial-gradient(circle_at_top,_#1b2140_0%,_#0b0e1a_60%)] relative overflow-hidden">
      <ExecutiveDashboard />
    </div>
  )
}

// 19차 — 로그인 직후 매장/그룹 코드를 받던 별도 'join' 스테이지를 없앴다.
// 그 온보딩 내용은 Team 탭 안으로 그대로 옮겨졌다(TeamFeed.tsx의
// OnboardingJoinSection 참고) — 로그인하면 바로 앱으로 들어간다.
type Stage = 'login' | 'app'

export default function App() {
  const [stage, setStage] = useState<Stage>('login')
  const [persona, setPersona] = useState<Persona>('employee')

  return (
    <AppStateProvider>
      {stage === 'login' && <LoginScreen onLogin={() => setStage('app')} />}
      {stage === 'app' && (
        <>
          <PersonaSwitcher persona={persona} onChange={setPersona} />
          <LogoutButton onLogout={() => setStage('login')} />
          {persona === 'employee' && <EmployeeAppShell />}
          {persona === 'manager' && <ManagerAppShell />}
          {persona === 'executive' && <ExecutiveAppShell />}
        </>
      )}
    </AppStateProvider>
  )
}
