// ---------------------------------------------------------------------------
// ShyftStarter — frontline interface of Bellatrix.
// Today → Micro Coaching → Action → Behaviour Evidence → KPI → Insight
//
// Shell responsibilities only: providers, session gate, role-based routing,
// safe-area chrome. Screens live in src/screens/bellatrix and src/manager.
// Legacy Shift-Companion screens stay mounted behind Profile → "팀 · 근무" and
// Manager → "더보기" so nothing working was removed, only de-emphasised.
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react'
import { Smartphone, LayoutDashboard, ArrowLeft } from 'lucide-react'
import { AppStateProvider } from './lib/store'
import { BellatrixProvider, useBellatrix } from './lib/bellatrixStore'
import { storage } from './lib/storage'
import { LoginScreen } from './auth/LoginScreen'
import { OnboardingScreen } from './onboarding/OnboardingScreen'
import { BottomNav, type TabId } from './components/BottomNav'
import { SheetHost } from './components/sheets/SheetHost'
import { BxSheetHost } from './components/bellatrix/BxSheetHost'
import { BxToast } from './components/bellatrix/BxToast'
import { Toast } from './components/Toast'
import { MoodCheckIn } from './components/MoodCheckIn'
import { Today } from './screens/bellatrix/Today'
import { Actions } from './screens/bellatrix/Actions'
import { Growth } from './screens/bellatrix/Growth'
import { Profile } from './screens/bellatrix/Profile'
import { MyShift } from './screens/MyShift'
import { TeamFeed } from './screens/TeamFeed'
import { ManagerDashboard } from './manager/ManagerDashboard'

const ONBOARDED_KEY = 'bellatrix.onboarded'

// Everything "fixed" inside the phone frame must be contained by a transformed
// ancestor, otherwise WKWebView positions it against the layout viewport
// (see build log 32차). Keep this on every shell root.
const FIXED_CONTAINMENT = { transform: 'translateZ(0)' } as const
const APP_BACKDROP = 'bg-[radial-gradient(circle_at_top,_#f3edff_0%,_#ffffff_55%)]'
const PHONE_SHADOW = 'sm:shadow-[0_30px_80px_-20px_rgba(139,92,246,0.25)]'

function ManagerToggleButton({ view, onToggle }: { view: 'employee' | 'manager'; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={view === 'employee' ? '매니저 화면으로 전환' : '직원 화면 미리보기'}
      className="fixed right-4 z-[70] flex items-center gap-1.5 rounded-full bg-ink-950 shadow-lg shadow-ink-950/20 px-3.5 py-2.5 text-xs font-semibold text-white hover:opacity-90 transition"
      style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
    >
      {view === 'employee' ? (
        <>
          <LayoutDashboard size={13} /> 매니저 화면
        </>
      ) : (
        <>
          <Smartphone size={13} /> 직원 화면 보기
        </>
      )}
    </button>
  )
}

function StatusBar() {
  return (
    <div className="shrink-0 flex items-center justify-between px-6 pb-1 text-ink-950 text-[13px] font-semibold" style={{ paddingTop: 'max(0.75rem, var(--safe-top))' }}>
      <span className="text-[10px] tracking-wide text-ink-950/50 font-medium">ShyftStarter</span>
      <span className="text-[10px] tracking-wide text-ink-950/30 font-medium">by Bellatrix</span>
    </div>
  )
}

type LegacyTab = Extract<TabId, 'teamFeed' | 'myShift'>

function EmployeeScreen({ tab, onNavigate }: { tab: TabId; onNavigate: (t: TabId) => void }) {
  switch (tab) {
    case 'today':
      return <Today />
    case 'actions':
      return <Actions />
    case 'growth':
      return <Growth />
    case 'profile':
      return <Profile onOpenLegacy={(s) => onNavigate(s)} />
    case 'teamFeed':
      return <TeamFeed />
    case 'myShift':
      return <MyShift onNavigate={onNavigate} />
    default:
      return <Today />
  }
}

const LEGACY_TITLES: Record<LegacyTab, string> = { teamFeed: '팀 공지 · 인수인계', myShift: '근무 일정' }

function EmployeeAppShell() {
  const [tab, setTab] = useState<TabId>('today')
  const isLegacy = tab === 'teamFeed' || tab === 'myShift'
  const navActive: TabId = isLegacy ? 'profile' : tab

  return (
    <div className={`min-h-screen w-full ${APP_BACKDROP} flex items-center justify-center py-0 sm:py-8 px-0 sm:px-4`}>
      <div className={`relative w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:rounded-[2.75rem] sm:border sm:border-ink-950/8 overflow-hidden flex flex-col bg-paper ${PHONE_SHADOW}`} style={FIXED_CONTAINMENT}>
        <StatusBar />
        {isLegacy && (
          <div className="shrink-0 flex items-center gap-2 px-4 pb-2">
            <button onClick={() => setTab('profile')} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700">
              <ArrowLeft size={14} /> Profile
            </button>
            <span className="text-xs text-ink-950/40">/ {LEGACY_TITLES[tab as LegacyTab]}</span>
          </div>
        )}
        <div className="relative grow overflow-y-auto app-scroll">
          <EmployeeScreen tab={tab} onNavigate={setTab} />
        </div>
        <BottomNav active={navActive} onChange={setTab} />
        <BxSheetHost />
        <SheetHost onNavigate={setTab} />
        <MoodCheckIn />
        <BxToast />
        <Toast />
      </div>
    </div>
  )
}

function ManagerAppShell() {
  return (
    <div className={`h-screen w-full ${APP_BACKDROP} relative overflow-hidden`} style={FIXED_CONTAINMENT}>
      <ManagerDashboard />
      <BxSheetHost />
      <BxToast />
      <Toast />
    </div>
  )
}

function Splash() {
  return (
    <div className="min-h-screen w-full bg-paper flex items-center justify-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-brand-500/30 animate-pulse">S</div>
    </div>
  )
}

function Root() {
  const { session, sheet } = useBellatrix()
  const [onboarded, setOnboarded] = useState<boolean>(() => storage.get(ONBOARDED_KEY) === '1')
  const [managerView, setManagerView] = useState<'employee' | 'manager'>('manager')

  // Reset to the manager's own home whenever a new session starts.
  useEffect(() => {
    if (session.status === 'signed_in') setManagerView('manager')
  }, [session.status])

  if (session.status === 'loading') return <Splash />

  if (session.status === 'signed_out') {
    if (!onboarded) {
      return (
        <OnboardingScreen
          onDone={() => {
            storage.set(ONBOARDED_KEY, '1')
            setOnboarded(true)
          }}
        />
      )
    }
    return <LoginScreen />
  }

  const isManager = session.user.role === 'manager' || session.user.role === 'admin'
  return (
    <div className="relative" style={FIXED_CONTAINMENT}>
      {isManager && sheet === null && <ManagerToggleButton view={managerView} onToggle={() => setManagerView((v) => (v === 'employee' ? 'manager' : 'employee'))} />}
      {isManager && managerView === 'manager' ? <ManagerAppShell /> : <EmployeeAppShell />}
    </div>
  )
}

export default function App() {
  return (
    <BellatrixProvider>
      {/* Legacy Shift-Companion state (announcements, handover, roster…) — still
          powers the de-emphasised screens; will be folded into Bellatrix later. */}
      <AppStateProvider>
        <Root />
      </AppStateProvider>
    </BellatrixProvider>
  )
}
