import { Home, CalendarDays, Target, Radar as RadarIcon, Sparkles, TrendingUp, Trophy, CalendarClock, Megaphone, ListChecks } from 'lucide-react'

// v2 — Shift Companion MVP: only 3 tabs are wired into the bottom nav
// (myShift / teamFeed / myActions). The older P0~P2 tab ids are kept in this
// union — and their screens left compiling — purely so the hidden Business+
// screens (Stats/Coach/Progress/old Team leaderboard, reachable via a future
// tier gate) still type-check. See claude/shyftstarter-v2-strategy-b2c-pivot.md.
export type TabId = 'home' | 'schedule' | 'quests' | 'stats' | 'coach' | 'progress' | 'team' | 'myShift' | 'teamFeed' | 'myActions'

// 22차 — 솔로 UX 피드백: My Actions를 My Shift 바로 다음 순서로, 그리고
// 하단 내비게이션 정중앙에 오도록 재배치했다(3탭 구조라 가운데 자리 = 정중앙).
const TABS: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'myShift', label: 'My Shift', icon: CalendarClock },
  { id: 'myActions', label: 'My Actions', icon: ListChecks },
  { id: 'teamFeed', label: 'Team', icon: Megaphone },
]

// Kept for reference by hidden Business+ screens — not rendered in MVP nav.
export const LEGACY_TABS: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'quests', label: 'Quests', icon: Target },
  { id: 'stats', label: 'Stats', icon: RadarIcon },
  { id: 'coach', label: 'Coach', icon: Sparkles },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'team', label: 'Team', icon: Trophy },
]

export function BottomNav({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <nav className="shrink-0 border-t border-ink-950/8 bg-paper/95 backdrop-blur-md px-1 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
      <div className="flex items-stretch justify-between">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition min-w-0"
            >
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} className={isActive ? 'text-brand-600' : 'text-ink-950/40'} />
              <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-brand-600' : 'text-ink-950/40'}`}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
