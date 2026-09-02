import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAppState } from '../../lib/store'
import { shifts } from '../../data/mockData'
import { Card, SectionLabel } from '../ui'
import { fmtHours, fmtWon, sumExtraPay, sumShiftPay, totalHours } from '../../lib/wageCalc'

// 21차 — 솔로 UX 리뷰 피드백 #1(예상 급여 계산기). 정확한 급여가 아니라
// "대략 이 정도"를 보여주는 추정치라는 걸 문구로 계속 상기시킨다. 공휴수당/
// 연장수당처럼 계산이 복잡해지는 항목은 자동 산출하지 않고, 사용자가 일한
// 시간을 직접 기록하면 시급 × 배율로 단순 가산한다.
export function WageCalculatorView() {
  const { wageSettings, setHourlyWage, extraPayEntries, addExtraPayEntry, removeExtraPayEntry } = useAppState()
  const [wageDraft, setWageDraft] = useState(wageSettings.hourlyWage > 0 ? String(wageSettings.hourlyWage) : '')
  const [label, setLabel] = useState('')
  const [hours, setHours] = useState('')

  const confirmedShifts = shifts.filter((s) => s.status === 'completed' || s.status === 'in_progress')
  const upcomingShifts = shifts.filter((s) => s.status === 'upcoming')
  const confirmedHours = totalHours(confirmedShifts)
  const upcomingHours = totalHours(upcomingShifts)
  const confirmedPay = sumShiftPay(confirmedShifts, wageSettings.hourlyWage)
  const upcomingPay = sumShiftPay(upcomingShifts, wageSettings.hourlyWage)
  const extraPay = sumExtraPay(extraPayEntries, wageSettings.hourlyWage, wageSettings.overtimeMultiplier)
  const total = confirmedPay + upcomingPay + extraPay

  const handleAddEntry = () => {
    const h = Number(hours)
    if (!label.trim() || !h || h <= 0) return
    addExtraPayEntry({ label, hours: h })
    setLabel('')
    setHours('')
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-ink-950/40 leading-relaxed">
        입력한 시급을 기준으로 계산한 <span className="text-ink-950/70 font-medium">예상 금액</span>이에요 — 세금·공제
        전이고 실제 급여와 다를 수 있어요. 정확한 급여는 매니저나 급여명세서로 확인해주세요.
      </p>

      <div>
        <SectionLabel>내 시급</SectionLabel>
        <Card className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={wageDraft}
            onChange={(e) => setWageDraft(e.target.value)}
            placeholder="예: 10000"
            className="flex-1 min-w-0 rounded-lg bg-ink-950/6 border border-ink-950/10 px-3 py-2.5 text-[16px] text-ink-950 placeholder:text-ink-950/25 outline-none focus:border-brand-400/50"
          />
          <span className="text-xs text-ink-950/40 shrink-0">원</span>
          <button
            onClick={() => setHourlyWage(Number(wageDraft) || 0)}
            className="shrink-0 rounded-lg bg-ink-950/10 hover:bg-ink-950/15 transition px-3.5 py-2.5 text-xs font-semibold text-ink-950/80"
          >
            저장
          </button>
        </Card>
      </div>

      <div>
        <SectionLabel>이번 근무 기준 예상 급여</SectionLabel>
        <Card className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-950/60">완료·진행 중 근무 ({fmtHours(confirmedHours)}시간)</span>
            <span className="text-ink-950/85 font-medium tabular-nums">{fmtWon(confirmedPay)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-950/60">예정된 근무 ({fmtHours(upcomingHours)}시간)</span>
            <span className="text-ink-950/85 font-medium tabular-nums">{fmtWon(upcomingPay)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-950/60">추가 수당</span>
            <span className="text-ink-950/85 font-medium tabular-nums">{fmtWon(extraPay)}</span>
          </div>
          <div className="pt-2.5 border-t border-ink-950/8 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-950">예상 총액 (세전)</span>
            <span className="text-lg font-bold text-emerald-600 tabular-nums">{fmtWon(total)}</span>
          </div>
        </Card>
      </div>

      <div>
        <SectionLabel>공휴수당·연장수당 직접 기록</SectionLabel>
        <p className="text-[11px] text-ink-950/35 leading-relaxed -mt-1 mb-2">
          계산이 복잡한 수당은 자동으로 계산하지 않아요 — 일한 시간을 입력하면 시급의 {wageSettings.overtimeMultiplier}배로
          계산해서 더해드려요.
        </p>
        <Card className="space-y-2.5">
          {extraPayEntries.length === 0 ? (
            <p className="text-xs text-ink-950/35 py-1">아직 기록한 추가 수당이 없어요.</p>
          ) : (
            extraPayEntries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-ink-950/6 last:border-0">
                <div className="min-w-0">
                  <div className="text-xs text-ink-950/85 truncate">{e.label}</div>
                  <div className="text-[10px] text-ink-950/35">
                    {fmtHours(e.hours)}시간 · {fmtWon(e.hours * wageSettings.hourlyWage * wageSettings.overtimeMultiplier)}
                  </div>
                </div>
                <button
                  onClick={() => removeExtraPayEntry(e.id)}
                  className="shrink-0 text-ink-950/25 hover:text-rose-600 transition"
                  aria-label="삭제"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
          <div className="flex items-center gap-2 pt-1">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="예: 추석 연휴 근무"
              className="flex-1 min-w-0 rounded-lg bg-ink-950/6 border border-ink-950/10 px-3 py-2 text-[16px] text-ink-950 placeholder:text-ink-950/25 outline-none focus:border-brand-400/50"
            />
            <input
              type="number"
              inputMode="numeric"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="시간"
              className="w-16 shrink-0 rounded-lg bg-ink-950/6 border border-ink-950/10 px-2 py-2 text-[16px] text-ink-950 placeholder:text-ink-950/25 outline-none focus:border-brand-400/50"
            />
            <button
              onClick={handleAddEntry}
              className="shrink-0 w-8 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center active:scale-90 transition"
              aria-label="추가 수당 기록"
            >
              <Plus size={14} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
