import { Megaphone, CalendarDays, CalendarPlus } from 'lucide-react'
import { useBellatrix } from '../../lib/bellatrixStore'
import { Team } from './Team'
import { MyShift } from './MyShift'
import type { TabId } from '../../components/BottomNav'

export type TeamSegment = 'news' | 'roster'

/** 팀 tab — the two daily reasons to open the app: 소식 (공지·인수인계) and
 * 근무표. Segment state lives in the tab id ('team' | 'myShift') so deep links
 * from 오늘 land on the right one. */
export function TeamHub({ segment, onSegment, onNavigate }: { segment: TeamSegment; onSegment: (s: TeamSegment) => void; onNavigate: (t: TabId) => void }) {
  const { openSheet } = useBellatrix()
  return (
    <div>
      <div className="px-4 pt-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-xl font-bold text-ink-950">팀</h1>
          {segment === 'roster' && (
            <button onClick={() => openSheet({ kind: 'shiftComposer' })} className="shrink-0 w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center active:scale-95 transition" aria-label="근무 등록">
              <CalendarPlus size={18} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-full bg-ink-950/6 p-1">
          <button onClick={() => onSegment('news')} className={`flex-1 rounded-full py-2 text-xs font-semibold transition inline-flex items-center justify-center gap-1.5 ${segment === 'news' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-950/50'}`}>
            <Megaphone size={13} /> 소식
          </button>
          <button onClick={() => onSegment('roster')} className={`flex-1 rounded-full py-2 text-xs font-semibold transition inline-flex items-center justify-center gap-1.5 ${segment === 'roster' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-950/50'}`}>
            <CalendarDays size={13} /> 근무표
          </button>
        </div>
      </div>
      {segment === 'news' ? <Team onNavigate={onNavigate} embedded /> : <MyShift embedded />}
    </div>
  )
}
