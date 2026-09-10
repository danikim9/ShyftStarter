import { Home, CalendarDays, Target, Radar as RadarIcon, Sparkles, TrendingUp, Trophy, CalendarClock, Megaphone, ListChecks, Sun, User } from 'lucide-react'

// Bellatrix MVP: Today → Actions → Growth → Profile. The legacy tab ids stay in
// the union so the hidden Shift-Companion screens (team feed, schedule, wage
// calculator, …) keep compiling and remain reachable from Profile → "팀 · 근무".
export type TabId =
  | 'today'
  | 'actions'
  | 'growth'
  | 'profile'
  | 'home'
  | 'schedule'
  | 'quests'
  | 'stats'
  | 'coach'
  | 'progress'
  | 'team'
  | 'myShift'
  | 'teamFeed'
  | 'myActions'

const TABS: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'today', label: 'Today', icon: Sun },
  { id: 'actions', label: 'Actions', icon: Target },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'profile', label: 'Profile', icon: User },
]

// Kept for reference by hidden legacy screens — not rendered in the MVP nav.
export const LEGACY_TABS: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'quests', label: 'Quests', icon: Target },
  { id: 'stats', label: 'Stats', icon: RadarIcon },
  { id: 'coach', label: 'Coach', icon: Sparkles },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'team', label: 'Team', icon: Trophy },
  { id: 'myShift', label: 'My Shift', icon: CalendarClock },
  { id: 'myActions', label: 'My Actions', icon: ListChecks },
  { id: 'teamFeed', label: 'Team', icon: Megaphone },
]

export function BottomNav({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <nav className="shrink-0 border-t border-ink-950/8 bg-paper/95 backdrop-blur-md px-1 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
      <div className="flex items-stretch justify-between">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button key={id} onClick={() => onChange(id)} className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition min-w-0" aria-current={isActive ? 'page' : undefined}>
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} className={isActive ? 'text-brand-600' : 'text-ink-950/40'} />
              <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-brand-600' : 'text-ink-950/40'}`}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
