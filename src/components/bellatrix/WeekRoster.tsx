import { useState } from 'react'
import { addDaysISO, dateOf, fmtTimeHM, weekKey } from '../../lib/dates'
import type { Shift, User } from '../../types/bellatrix'

const DOW = ['월', '화', '수', '목', '금', '토', '일']

/** Read-only weekly roster for employees: teammates × 7 days from real shift
 * rows (the same rows the manager edits). The viewer's own row is pinned first. */
export function WeekRoster({ users, shifts, meId, today, onSelectMine }: { users: User[]; shifts: Shift[]; meId: string; today: string; onSelectMine?: (shift: Shift) => void }) {
  const [week, setWeek] = useState(0)
  const monday = addDaysISO(weekKey(today), week * 7)
  const dates = Array.from({ length: 7 }, (_, i) => addDaysISO(monday, i))
  const rows = [...users].sort((a, b) => (a.id === meId ? -1 : b.id === meId ? 1 : a.name.localeCompare(b.name)))
  const byKey = new Map<string, Shift>()
  for (const s of shifts) if (s.status !== 'cancelled') byKey.set(`${s.user_id}|${dateOf(s.start_at)}`, s)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-full bg-ink-950/6 p-0.5">
          {['이번 주', '다음 주'].map((label, i) => (
            <button key={label} onClick={() => setWeek(i)} className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${week === i ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-950/45'}`}>
              {label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-ink-950/40 tabular-nums">
          {dates[0].slice(5).replace('-', '.')} – {dates[6].slice(5).replace('-', '.')}
        </span>
      </div>
      <div className="rounded-xl border border-ink-950/8 bg-white overflow-x-auto">
        <table className="min-w-full text-[11px]">
          <thead>
            <tr className="text-ink-950/45">
              <th className="px-2.5 py-2 text-left font-semibold w-20">직원</th>
              {dates.map((d, i) => (
                <th key={d} className={`px-1 py-2 font-semibold text-center ${d === today ? 'text-brand-700' : ''}`}>
                  <div>{DOW[i]}</div>
                  <div className="text-[10px] font-normal">{d.slice(8)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const me = u.id === meId
              return (
                <tr key={u.id} className={`border-t border-ink-950/6 ${me ? 'bg-brand-50/60' : ''}`}>
                  <td className={`px-2.5 py-1.5 whitespace-nowrap ${me ? 'font-semibold text-brand-800' : 'text-ink-950/75'}`}>{me ? '나' : u.name.split(' ')[0]}</td>
                  {dates.map((d) => {
                    const s = byKey.get(`${u.id}|${d}`)
                    const cell = s ? (
                      <>
                        <div>{fmtTimeHM(s.start_at)}</div>
                        <div>{fmtTimeHM(s.end_at)}</div>
                      </>
                    ) : (
                      <span className="text-ink-950/20">휴무</span>
                    )
                    return (
                      <td key={d} className="px-0.5 py-1 text-center tabular-nums">
                        {me && s && onSelectMine ? (
                          <button onClick={() => onSelectMine(s)} className="w-full rounded-md bg-brand-500/12 text-brand-800 px-0.5 py-1 leading-tight active:scale-95 transition">
                            {cell}
                          </button>
                        ) : (
                          <div className={`w-full rounded-md px-0.5 py-1 leading-tight ${s ? 'bg-ink-950/5 text-ink-950/70' : ''}`}>{cell}</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
