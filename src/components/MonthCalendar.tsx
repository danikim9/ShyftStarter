import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Shift } from '../types'

// 21차 — 솔로 UX 리뷰 피드백 #2: 리스트뷰만 있어서 이번 달에 며칠 일하고
// 며칠 쉬는지 한눈에 보기 어렵다는 지적을 반영한 월간 캘린더 뷰. My Shift의
// "예정된 근무" 섹션에서 리스트뷰와 토글해서 쓴다. mockData.ts의 shifts가
// 실제로 걸쳐 있는 달(들)만 넘나들 수 있다 — 데이터가 없는 달은 만들지 않는다.

const DOW = ['일', '월', '화', '수', '목', '금', '토']

function ymKey(dateStr: string) {
  return dateStr.slice(0, 7) // YYYY-MM
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

const STATUS_DOT: Record<string, string> = {
  completed: 'bg-white/25',
  in_progress: 'bg-brand-400',
  upcoming: 'bg-amber-signal',
}

export function MonthCalendar({
  shifts,
  todayDate,
  onSelectShift,
}: {
  shifts: Shift[]
  todayDate: string
  onSelectShift: (shiftId: string) => void
}) {
  const months = Array.from(new Set(shifts.map((s) => ymKey(s.date)))).sort()
  const initialIdx = Math.max(0, months.indexOf(ymKey(todayDate)))
  const [idx, setIdx] = useState(initialIdx)

  if (months.length === 0) return null
  const [year, monthNum] = months[idx].split('-').map(Number)
  const month = monthNum - 1

  const firstDow = new Date(year, month, 1).getDay()
  const total = daysInMonth(year, month)
  const cells: (string | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: total }, (_, i) => `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`),
  ]

  const byDate = new Map(shifts.map((s) => [s.date, s]))

  return (
    <div className="rounded-2xl border border-white/8 bg-ink-800/70 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white/80 disabled:opacity-20 disabled:hover:text-white/50"
          aria-label="이전 달"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-semibold text-white/85">
          {year}년 {month + 1}월
        </span>
        <button
          onClick={() => setIdx((i) => Math.min(months.length - 1, i + 1))}
          disabled={idx === months.length - 1}
          className="w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white/80 disabled:opacity-20 disabled:hover:text-white/50"
          aria-label="다음 달"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-white/30 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty_${i}`} />
          const shift = byDate.get(date)
          const isOff = !shift || shift.status === 'off'
          const isToday = date === todayDate
          return (
            <button
              key={date}
              onClick={() => shift && !isOff && onSelectShift(shift.id)}
              disabled={isOff}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs transition ${
                shift?.status === 'in_progress'
                  ? 'bg-brand-500/25 text-white font-semibold'
                  : isToday
                    ? 'border border-white/15 text-white/80'
                    : isOff
                      ? 'text-white/20'
                      : 'text-white/65 hover:bg-white/6'
              }`}
            >
              <span>{Number(date.slice(-2))}</span>
              {shift && !isOff && <span className={`w-1 h-1 rounded-full ${STATUS_DOT[shift.status]}`} />}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/8 text-[10px] text-white/35">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
          진행 중
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-signal" />
          예정
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
          완료
        </span>
      </div>
    </div>
  )
}
