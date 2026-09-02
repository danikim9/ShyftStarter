import { ChevronRight } from 'lucide-react'
import { shifts } from '../data/mockData'
import { useAppState } from '../lib/store'
import { Card, SectionLabel, Badge } from '../components/ui'
import type { Shift } from '../types'

const dow = ['일', '월', '화', '수', '목', '금', '토']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getMonth() + 1}.${dt.getDate()} (${dow[dt.getDay()]})`
}

function ShiftRow({ shift }: { shift: Shift }) {
  const { openSheet } = useAppState()
  const isToday = shift.status === 'in_progress'
  return (
    <button
      onClick={() => openSheet({ kind: 'shiftDetail', shiftId: shift.id })}
      className="w-full flex items-center justify-between py-3 border-b border-white/6 last:border-0 text-left"
    >
      <div>
        <div className="text-sm font-medium text-white/90">{fmtDate(shift.date)}</div>
        <div className="text-xs text-white/40">{shift.start}–{shift.end} · {shift.store}</div>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={isToday ? 'brand' : shift.status === 'completed' ? 'default' : 'amber'}>
          {shift.status === 'completed' ? '완료' : isToday ? '진행 중' : '예정'}
        </Badge>
        <ChevronRight size={15} className="text-white/25" />
      </div>
    </button>
  )
}

export function Schedule() {
  const upcoming = shifts.filter((s) => s.status !== 'completed')
  const past = shifts.filter((s) => s.status === 'completed').slice().reverse()

  return (
    <div className="px-4 pt-5 pb-8 space-y-6">
      <h1 className="text-xl font-bold text-white">Schedule</h1>

      <div>
        <SectionLabel>UPCOMING SHIFTS</SectionLabel>
        <Card>
          {upcoming.map((s) => (
            <ShiftRow key={s.id} shift={s} />
          ))}
        </Card>
      </div>

      <div>
        <SectionLabel>PAST SHIFTS</SectionLabel>
        <Card>
          {past.map((s) => (
            <ShiftRow key={s.id} shift={s} />
          ))}
        </Card>
      </div>
    </div>
  )
}
