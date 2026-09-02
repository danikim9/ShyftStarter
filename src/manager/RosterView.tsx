import { useState } from 'react'
import { ChevronLeft, ChevronRight, Users, X, ArrowLeftRight, Crown } from 'lucide-react'
import { Card, PrimaryButton, SecondaryButton, Badge } from '../components/ui'
import { ROSTER_WEEKS, ROSTER_MEMBERS, TODAY, fmtRosterDate, type RosterEntry } from '../data/roster'
import { useAppState } from '../lib/store'

function ShiftPill({ entry }: { entry: RosterEntry }) {
  if (entry === 'off') {
    return <span className="text-[11px] font-medium text-white/30">휴무</span>
  }
  return (
    <span className="text-[11px] font-medium text-brand-200 tabular-nums">
      {entry.start}–{entry.end}
    </span>
  )
}

export interface EditTarget {
  memberId: string
  memberName: string
  date: string
}

export function EditShiftModal({
  target,
  current,
  onClose,
  onSave,
}: {
  target: EditTarget | null
  current: RosterEntry | null
  onClose: () => void
  onSave: (entry: RosterEntry) => void
}) {
  const open = !!target
  const [isOff, setIsOff] = useState(current === 'off')
  const [start, setStart] = useState(current && current !== 'off' ? current.start : '10:00')
  const [end, setEnd] = useState(current && current !== 'off' ? current.end : '18:00')

  // reset local edit state whenever a new cell is opened
  const key = target ? `${target.memberId}_${target.date}` : ''
  const [lastKey, setLastKey] = useState(key)
  if (key !== lastKey) {
    setLastKey(key)
    setIsOff(current === 'off')
    setStart(current && current !== 'off' ? current.start : '10:00')
    setEnd(current && current !== 'off' ? current.end : '18:00')
  }

  if (!target) return null
  const { md, dow } = fmtRosterDate(target.date)

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-ink-900 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8">
          <div>
            <h3 className="text-sm font-semibold text-white">근무 배정</h3>
            <p className="text-xs text-white/40 mt-0.5">
              {target.memberName} · {md} ({dow})
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 text-white/60">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <button
            onClick={() => setIsOff((v) => !v)}
            className="w-full flex items-center justify-between rounded-lg bg-white/6 border border-white/10 px-3 py-2.5"
          >
            <span className="text-sm text-white/80">휴무로 표시</span>
            <span className={`w-9 h-5 rounded-full relative transition-colors ${isOff ? 'bg-brand-500' : 'bg-white/15'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isOff ? 'left-4' : 'left-0.5'}`} />
            </span>
          </button>

          <div className={`grid grid-cols-2 gap-3 transition-opacity ${isOff ? 'opacity-30 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-[11px] font-semibold text-white/40 tracking-wide mb-1.5">시작</label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-lg bg-white/6 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-400/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/40 tracking-wide mb-1.5">종료</label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-lg bg-white/6 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-400/50"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/8 flex gap-2">
          <SecondaryButton onClick={onClose} className="flex-1">
            취소
          </SecondaryButton>
          <PrimaryButton
            className="flex-1"
            onClick={() => {
              onSave(isOff ? 'off' : { start, end })
              onClose()
            }}
          >
            저장
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

function swapStatusMeta(status: 'pending' | 'approved' | 'rejected') {
  if (status === 'pending') return { label: '상대방 승인 대기 중', tone: 'amber' as const }
  if (status === 'approved') return { label: '교대 완료 · 자동 반영됨', tone: 'emerald' as const }
  return { label: '거절됨', tone: 'rose' as const }
}

// 16차 개편: 매니저는 더 이상 교대를 승인/거절하지 않는다 — 요청을 받은
// 팀원이 직접 승인하면 그 즉시 근무가 교환되고, 매니저에게는 이 카드로
// "이미 정해진 교대"를 알려주는 알림(FYI)만 온다.
function SwapRequestsCard() {
  const { swapRequests } = useAppState()
  const recent = swapRequests.filter((r) => r.status !== 'rejected').slice(0, 6)
  if (recent.length === 0) return null

  return (
    <Card className="space-y-3 border-brand-400/20 bg-brand-500/[0.04]">
      <div className="flex items-center gap-2">
        <ArrowLeftRight size={14} className="text-brand-300" />
        <h3 className="text-sm font-semibold text-white">근무 교대 알림</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-signal/15 text-amber-300 text-[10px] font-bold px-2 py-0.5">
          <Crown size={10} /> PRO
        </span>
      </div>
      <p className="text-[11px] text-white/35 leading-relaxed -mt-1">
        팀원끼리 직접 요청하고 승인해요 — 승인되면 여기로 자동 알림이 와요.
      </p>
      <div className="space-y-2">
        {recent.map((r) => {
          const req = fmtRosterDate(r.requesterShiftDate)
          const tgt = fmtRosterDate(r.targetShiftDate)
          const meta = swapStatusMeta(r.status)
          return (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/8 px-3.5 py-3">
              <div className="min-w-0">
                <div className="text-sm text-white/85">
                  <span className="font-semibold">{r.requesterName}</span>
                  <span className="text-white/40"> · {req.md}({req.dow}) 근무</span>
                  <ArrowLeftRight size={11} className="inline mx-1.5 text-white/30" />
                  <span className="font-semibold">{r.targetMemberName}</span>
                  <span className="text-white/40"> · {tgt.md}({tgt.dow}) 근무</span>
                </div>
                {r.note && <p className="text-xs text-white/40 mt-1 leading-relaxed">"{r.note}"</p>}
              </div>
              <Badge tone={meta.tone}>{meta.label}</Badge>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function RosterView() {
  const { roster, updateRosterEntry, showToast } = useAppState()
  const [weekIndex, setWeekIndex] = useState(0)
  const [editing, setEditing] = useState<EditTarget | null>(null)

  const week = ROSTER_WEEKS[weekIndex]

  const handleSave = (entry: RosterEntry) => {
    if (!editing) return
    updateRosterEntry(editing.memberId, editing.date, entry)
    const { md, dow } = fmtRosterDate(editing.date)
    showToast(
      entry === 'off'
        ? `${editing.memberName}님 ${md}(${dow})를 휴무로 표시했어요`
        : `${editing.memberName}님 ${md}(${dow}) 근무를 ${entry.start}–${entry.end}로 반영했어요`
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">근무 일정 관리</h1>
          <p className="text-white/40 text-sm max-w-xl leading-relaxed">
            팀원별 근무를 배정·변경하고 휴무를 한눈에 확인해요. 셀을 클릭하면 시간을 조정하거나 휴무로 바꿀 수 있어요.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1 rounded-full bg-ink-800/90 border border-white/10 p-1">
          <button
            onClick={() => setWeekIndex((i) => Math.max(0, i - 1))}
            disabled={weekIndex === 0}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white/80 disabled:opacity-25 disabled:hover:text-white/50"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-medium text-white/80 px-2 min-w-[52px] text-center">{week.label}</span>
          <button
            onClick={() => setWeekIndex((i) => Math.min(ROSTER_WEEKS.length - 1, i + 1))}
            disabled={weekIndex === ROSTER_WEEKS.length - 1}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white/80 disabled:opacity-25 disabled:hover:text-white/50"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <SwapRequestsCard />

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto app-scroll">
          <table className="w-full border-collapse min-w-[760px]">
            <thead>
              <tr>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-white/40 tracking-wide sticky left-0 bg-ink-800/95 z-10 w-36">
                  팀원
                </th>
                {week.dates.map((d) => {
                  const { md, dow } = fmtRosterDate(d)
                  const isToday = d === TODAY
                  return (
                    <th
                      key={d}
                      className={`px-2 py-3 text-center text-[11px] font-semibold tracking-wide ${
                        isToday ? 'text-brand-200' : 'text-white/40'
                      }`}
                    >
                      <div>{md}</div>
                      <div className={isToday ? 'text-brand-300' : 'text-white/25'}>{dow}{isToday ? ' · 오늘' : ''}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {ROSTER_MEMBERS.map((m) => (
                <tr key={m.id} className="border-t border-white/6">
                  <td className="px-4 py-2.5 sticky left-0 bg-ink-800/95 z-10">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ background: m.avatarColor }}
                      >
                        {m.name[0]}
                      </span>
                      <span className="text-xs font-medium text-white/85 truncate">{m.name}</span>
                    </div>
                  </td>
                  {week.dates.map((d) => {
                    const entry = roster[m.id]?.[d] ?? 'off'
                    const isToday = d === TODAY
                    return (
                      <td key={d} className={`px-1.5 py-2 text-center ${isToday ? 'bg-brand-500/[0.06]' : ''}`}>
                        <button
                          onClick={() => setEditing({ memberId: m.id, memberName: m.name, date: d })}
                          className="w-full rounded-lg py-1.5 hover:bg-white/6 transition"
                        >
                          <ShiftPill entry={entry} />
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/8">
                <td className="px-4 py-2.5 sticky left-0 bg-ink-800/95 z-10">
                  <div className="flex items-center gap-1.5 text-[11px] text-white/35">
                    <Users size={11} /> 근무 인원
                  </div>
                </td>
                {week.dates.map((d) => {
                  const count = ROSTER_MEMBERS.filter((m) => (roster[m.id]?.[d] ?? 'off') !== 'off').length
                  return (
                    <td key={d} className="px-1.5 py-2.5 text-center text-[11px] font-semibold text-white/50 tabular-nums">
                      {count}명
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <EditShiftModal
        target={editing}
        current={editing ? roster[editing.memberId]?.[editing.date] ?? 'off' : null}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />
    </div>
  )
}
