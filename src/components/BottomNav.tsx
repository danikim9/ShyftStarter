import { Home, CalendarDays, Target, Radar as RadarIcon, Sparkles } from 'lucide-react'

export type TabId = 'home' | 'schedule' | 'quests' | 'stats' | 'coach'

const TABS: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'quests', label: 'Quests', icon: Target },
  { id: 'stats', label: 'Stats', icon: RadarIcon },
  { id: 'coach', label: 'Coach', icon: Sparkles },
]

export function BottomNav({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <nav className="shrink-0 border-t border-white/8 bg-ink-950/95 backdrop-blur-md px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
      <div className="flex items-stretch justify-between">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition"
            >
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} className={isActive ? 'text-brand-300' : 'text-white/40'} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-brand-300' : 'text-white/40'}`}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
