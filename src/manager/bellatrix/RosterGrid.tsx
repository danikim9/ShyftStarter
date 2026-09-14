import { useEffect, useMemo, useState } from 'react'
import { useBellatrix, useManagerData } from '../../lib/bellatrixStore'
import { useManagerState } from '../../lib/managerStore'
import { addDays, addDaysISO, dateOf, fmtTimeHM, parseISODate, toISODate, weekKey } from '../../lib/dates'
import type { Shift } from '../../types/bellatrix'
import { Card } from '../../components/ui'

const DOW = ['월', '화', '수', '목', '금', '토', '일']

/** Store roster on real accounts: employees × 7 days, two weeks. Tap a cell to
 * set/clear that person's shift (source = 'roster'). Employees see the result
 * in My Shift as "매장 근무표". */
export function RosterGrid() {
  const ready = useManagerData()
  const { openSheet, today } = useBellatrix()
  const { rosterFocusUserId, showRosterFor } = useManagerState()
  const [week, setWeek] = useState(0)

  useEffect(() => {
    if (!rosterFocusUserId) return
    const t = setTimeout(() => showRosterFor(null), 4000)
    return () => clearTimeout(t)
  }, [rosterFocusUserId, showRosterFor])

  const dates = useMemo(() => {
    const monday = parseISODate(weekKey(today))
    return Array.from({ length: 7 }, (_, i) => toISODate(addDays(monday, week * 7 + i)))
  }, [today, week])

  if (!ready) return null
  const { data } = ready
  const employees = data.users.filter((u) => u.role === 'employee')
  const byKey = new Map<string, Shift>()
  for (const s of data.shifts) if (s.status !== 'cancelled') byKey.set(`${s.user_id}|${dateOf(s.start_at)}`, s)
  const counts = dates.map((d) => employees.filter((u) => byKey.has(`${u.id}|${d}`)).length)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        {['이번 주', '다음 주'].map((label, i) => (
          <button key={label} onClick={() => setWeek(i)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${week === i ? 'bg-white text-ink-950 shadow-sm' : 'bg-ink-950/6 text-ink-950/50'}`}>
            {label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-ink-950/40">
          {dates[0].slice(5).replace('-', '.')} – {dates[6].slice(5).replace('-', '.')}
        </span>
      </div>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-xs min-w-[560px]">
          <thead className="bg-ink-950/4 text-ink-950/50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold w-28">직원</th>
              {dates.map((d, i) => (
                <th key={d} className={`px-1.5 py-2 text-center font-semibold ${d === today ? 'text-brand-700' : ''}`}>
                  <div>{DOW[i]}</div>
                  <div className="text-[10px] font-normal tabular-nums">{d.slice(8)}일</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((u) => {
              const focus = rosterFocusUserId === u.id
              return (
                <tr key={u.id} className={`border-t border-ink-950/6 ${focus ? 'bg-brand-50' : ''}`}>
                  <td className="px-3 py-2">
                    <button onClick={() => openSheet({ kind: 'member', userId: u.id })} className="text-left font-medium text-ink-950/85 hover:text-brand-700">
                      {u.name}
                    </button>
                  </td>
                  {dates.map((d) => {
                    const s = byKey.get(`${u.id}|${d}`)
                    return (
                      <td key={d} className="px-1 py-1.5 text-center">
                        <button
                          onClick={() => openSheet({ kind: 'rosterCell', userId: u.id, date: d })}
                          className={`w-full rounded-lg px-1 py-1.5 text-[11px] tabular-nums transition active:scale-95 ${
                            s ? (s.source === 'self' ? 'bg-ink-950/6 text-ink-950/70' : 'bg-brand-500/12 text-brand-800') : 'text-ink-950/25 hover:bg-ink-950/4'
                          }`}
                          title={s ? (s.source === 'self' ? '직원이 직접 등록' : '매장 근무표') : '휴무'}
                        >
                          {s ? (
                            <>
                              <div>{fmtTimeHM(s.start_at)}</div>
                              <div>{fmtTimeHM(s.end_at)}</div>
                            </>
                          ) : (
                            '휴무'
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            <tr className="border-t border-ink-950/10 bg-ink-950/3 text-ink-950/50">
              <td className="px-3 py-2 font-semibold">근무 인원</td>
              {counts.map((c, i) => (
                <td key={i} className={`px-1 py-2 text-center tabular-nums ${c === 0 ? 'text-rose-600 font-semibold' : ''}`}>
                  {c}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Card>
      <p className="text-[11px] text-ink-950/40">
        보라색은 매장 근무표, 회색은 직원이 직접 등록한 근무예요. 셀을 누르면 시간을 정하거나 휴무로 바꿀 수 있고, "다음 주에도"를 켜면 같은 요일에 반복돼요. 직원 간 근무 교대는 직원 앱의 My Shift에서 서로 승인해요.
      </p>
      <span className="hidden">{addDaysISO(today, 0)}</span>
    </div>
  )
}
