import { useState } from 'react'
import { Crown, ArrowLeftRight, ChevronRight } from 'lucide-react'
import { useAppState } from '../../lib/store'
import { CURRENT_EMPLOYEE_ID } from '../../data/mockData'
import { ROSTER_WEEKS, ROSTER_MEMBERS, TODAY, fmtRosterDate, type RosterEntry } from '../../data/roster'
import { Badge, PrimaryButton, SecondaryButton } from '../ui'

function isUpcoming(date: string) {
  return date >= TODAY
}

function ShiftText({ entry }: { entry: RosterEntry }) {
  if (entry === 'off') return <span className="text-white/30">휴무</span>
  return (
    <span className="text-white/70 tabular-nums">
      {entry.start}–{entry.end}
    </span>
  )
}

function statusBadge(status: 'pending' | 'approved' | 'rejected') {
  if (status === 'pending') return <Badge tone="amber">대기 중</Badge>
  if (status === 'approved') return <Badge tone="emerald">승인됨</Badge>
  return <Badge tone="rose">거절됨</Badge>
}

// Step 2/3 — pick a teammate, then one of their upcoming shifts, to propose a swap with.
function SwapForm({ requesterShiftDate, onDone, onCancel }: { requesterShiftDate: string; onDone: () => void; onCancel: () => void }) {
  const { roster, requestSwap } = useAppState()
  const [teammateId, setTeammateId] = useState<string | null>(null)
  const [targetDate, setTargetDate] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const teammates = ROSTER_MEMBERS.filter((m) => m.id !== CURRENT_EMPLOYEE_ID)
  const allDates = ROSTER_WEEKS.flatMap((w) => w.dates)

  const teammateShifts = (memberId: string) =>
    allDates.filter((d) => isUpcoming(d) && (roster[memberId]?.[d] ?? 'off') !== 'off')

  if (!teammateId) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-white/40 leading-relaxed">누구와 근무를 바꾸고 싶으신가요? 예정된 근무가 있는 팀원만 표시돼요.</p>
        <div className="space-y-1.5">
          {teammates.map((m) => {
            const count = teammateShifts(m.id).length
            if (count === 0) return null
            return (
              <button
                key={m.id}
                onClick={() => setTeammateId(m.id)}
                className="w-full flex items-center justify-between gap-2 rounded-xl bg-white/6 hover:bg-white/10 border border-white/8 px-3.5 py-3 transition"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                    style={{ background: m.avatarColor }}
                  >
                    {m.name[0]}
                  </span>
                  <span className="text-sm text-white/85">{m.name}</span>
                </span>
                <ChevronRight size={14} className="text-white/30" />
              </button>
            )
          })}
        </div>
        <SecondaryButton onClick={onCancel}>취소</SecondaryButton>
      </div>
    )
  }

  const teammate = ROSTER_MEMBERS.find((m) => m.id === teammateId)!

  if (!targetDate) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-white/40 leading-relaxed">
          <span className="text-white/70 font-medium">{teammate.name}</span>님의 어떤 근무와 바꿀까요?
        </p>
        <div className="space-y-1.5">
          {teammateShifts(teammateId).map((d) => {
            const { md, dow } = fmtRosterDate(d)
            const entry = roster[teammateId]?.[d]
            return (
              <button
                key={d}
                onClick={() => setTargetDate(d)}
                className="w-full flex items-center justify-between rounded-xl bg-white/6 hover:bg-white/10 border border-white/8 px-3.5 py-3 transition"
              >
                <span className="text-sm text-white/85">
                  {md} ({dow})
                </span>
                <ShiftText entry={entry ?? 'off'} />
              </button>
            )
          })}
        </div>
        <SecondaryButton onClick={() => setTeammateId(null)}>이전으로</SecondaryButton>
      </div>
    )
  }

  const reqFmt = fmtRosterDate(requesterShiftDate)
  const tgtFmt = fmtRosterDate(targetDate)

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-brand-500/10 border border-brand-400/20 px-3.5 py-3 text-xs text-brand-100 leading-relaxed">
        내 {reqFmt.md}({reqFmt.dow}) 근무 <ArrowLeftRight size={11} className="inline mx-1" /> {teammate.name}님 {tgtFmt.md}({tgtFmt.dow})
        근무를 서로 맞바꾸는 요청을 보내요. 매니저가 승인하면 실제로 교대돼요.
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-white/40 tracking-wide mb-1.5">메모 (선택)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="예: 그날 병원 예약이 있어서요"
          rows={2}
          className="w-full rounded-xl bg-white/6 border border-white/10 px-3.5 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-400/50 resize-none"
        />
      </div>
      <div className="flex gap-2">
        <SecondaryButton onClick={() => setTargetDate(null)} className="flex-1">
          이전으로
        </SecondaryButton>
        <PrimaryButton
          className="flex-1"
          onClick={() => {
            requestSwap({ requesterShiftDate, targetMemberId: teammateId, targetShiftDate: targetDate, note })
            onDone()
          }}
        >
          교대 요청 보내기
        </PrimaryButton>
      </div>
    </div>
  )
}

export function TeamScheduleView() {
  const { roster, swapRequests } = useAppState()
  const [weekIndex, setWeekIndex] = useState(0)
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [swapping, setSwapping] = useState(false)

  const week = ROSTER_WEEKS[weekIndex]
  const myEntry = roster[CURRENT_EMPLOYEE_ID]?.[selectedDate] ?? 'off'
  const canSwap = myEntry !== 'off' && isUpcoming(selectedDate)
  const myRequests = swapRequests.filter((r) => r.requesterId === CURRENT_EMPLOYEE_ID)

  if (swapping) {
    return (
      <SwapForm
        requesterShiftDate={selectedDate}
        onDone={() => setSwapping(false)}
        onCancel={() => setSwapping(false)}
      />
    )
  }

  return (
    <div className="space-y-4">
      {myRequests.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-white/40 tracking-wide uppercase">내가 보낸 교대 요청</div>
          {myRequests.map((r) => {
            const tgt = fmtRosterDate(r.targetShiftDate)
            return (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/5 border border-white/8 px-3.5 py-2.5">
                <span className="text-xs text-white/70">
                  {r.targetMemberName}님 · {tgt.md}({tgt.dow})와 교대
                </span>
                {statusBadge(r.status)}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {ROSTER_WEEKS.map((w, i) => (
          <button
            key={w.id}
            onClick={() => setWeekIndex(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              weekIndex === i ? 'bg-white text-ink-950' : 'bg-white/6 text-white/50 hover:text-white/80'
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto app-scroll pb-1 -mx-1 px-1">
        {week.dates.map((d) => {
          const { md, dow } = fmtRosterDate(d)
          const active = d === selectedDate
          return (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`shrink-0 flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition ${
                active ? 'bg-brand-500 text-white' : d === TODAY ? 'bg-white/10 text-white/80' : 'bg-white/5 text-white/50'
              }`}
            >
              <span className="text-[10px] font-medium">{dow}</span>
              <span className="text-xs font-semibold tabular-nums">{md}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-1.5">
        {ROSTER_MEMBERS.map((m) => {
          const entry = roster[m.id]?.[selectedDate] ?? 'off'
          const isMe = m.id === CURRENT_EMPLOYEE_ID
          return (
            <div
              key={m.id}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 ${isMe ? 'bg-brand-500/10 border border-brand-400/20' : 'bg-white/5'}`}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{ background: m.avatarColor }}
                >
                  {m.name[0]}
                </span>
                <span className="text-sm text-white/85">
                  {m.name}
                  {isMe && <span className="text-[10px] text-brand-300 font-medium ml-1.5">나</span>}
                </span>
              </span>
              <span className="text-xs">
                <ShiftText entry={entry} />
              </span>
            </div>
          )
        })}
      </div>

      {canSwap && (
        <button
          onClick={() => setSwapping(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/6 hover:bg-white/10 border border-dashed border-white/15 px-4 py-3 transition"
        >
          <ArrowLeftRight size={14} className="text-white/60" />
          <span className="text-sm font-medium text-white/80">이 근무 교대 요청하기</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-signal/15 text-amber-300 text-[10px] font-bold px-2 py-0.5">
            <Crown size={10} /> PRO
          </span>
        </button>
      )}
    </div>
  )
}
