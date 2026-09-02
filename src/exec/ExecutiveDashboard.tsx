import { Building2, LineChart } from 'lucide-react'
import { ExecStateProvider, useExecState, type ExecView } from '../lib/execStore'
import { OrgOverview } from './OrgOverview'
import { RoiAnalysis } from './RoiAnalysis'

const NAV: { id: ExecView; label: string; icon: typeof Building2 }[] = [
  { id: 'overview', label: '조직 현황', icon: Building2 },
  { id: 'roi', label: 'ROI 분석', icon: LineChart },
]

function Sidebar() {
  const { view, setView } = useExecState()
  return (
    <div className="w-56 shrink-0 border-r border-ink-950/8 flex flex-col py-5 px-3">
      <div className="px-2 mb-6">
        <div className="text-ink-950 font-bold text-sm">ShyftStarter</div>
        <div className="text-[11px] text-ink-950/35">Executive Dashboard</div>
      </div>
      <nav className="space-y-1">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active ? 'bg-brand-500/15 text-brand-700' : 'text-ink-950/50 hover:bg-ink-950/5 hover:text-ink-950/80'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          )
        })}
      </nav>
      <div className="mt-auto px-2 pt-4 border-t border-ink-950/8">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-ink-800 border border-ink-950/10 flex items-center justify-center text-xs font-bold text-ink-950">S</span>
          <div>
            <div className="text-xs font-medium text-ink-950/85">Sarah L.</div>
            <div className="text-[10px] text-ink-950/35">VP of Retail Operations</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExecContent() {
  const { view } = useExecState()
  return (
    <div className="flex-1 overflow-y-auto app-scroll px-8 py-8">
      {view === 'overview' ? <OrgOverview /> : <RoiAnalysis />}
    </div>
  )
}

export function ExecutiveDashboard() {
  return (
    <ExecStateProvider>
      <div className="flex h-full w-full">
        <Sidebar />
        <ExecContent />
      </div>
    </ExecStateProvider>
  )
}
