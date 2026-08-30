import { useState } from 'react'
import { AppStateProvider } from './lib/store'
import { BottomNav, type TabId } from './components/BottomNav'
import { SheetHost } from './components/sheets/SheetHost'
import { Toast } from './components/Toast'
import { Home } from './screens/Home'
import { Schedule } from './screens/Schedule'
import { Quests } from './screens/Quests'
import { Stats } from './screens/Stats'
import { Coach } from './screens/Coach'

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
  }
}

function AppShell() {
  const [tab, setTab] = useState<TabId>('home')

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#1b2140_0%,_#0b0e1a_60%)] flex items-center justify-center py-0 sm:py-8 px-0 sm:px-4">
      <div className="relative w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:rounded-[2.75rem] sm:border sm:border-white/10 overflow-hidden flex flex-col bg-ink-950 sm:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)]">
        <StatusBar />
        <div className="relative grow overflow-y-auto app-scroll">
          <Screen tab={tab} onNavigate={setTab} />
        </div>
        <BottomNav active={tab} onChange={setTab} />
        <SheetHost onNavigate={setTab} />
        <Toast />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  )
}
