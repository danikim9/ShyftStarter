import { useState } from 'react'
import { Minus, Plus, Archive, Lock, Sparkles } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../../lib/bellatrixStore'
import { cardById, goalAttemptsOn } from '../../../lib/selectors'
import { addDaysISO } from '../../../lib/dates'
import { BEHAVIOUR_LABEL } from '../../../types/bellatrix'
import { Badge, SecondaryButton } from '../../ui'

export function GoalDetailSheet({ goalId }: { goalId: string }) {
  const ready = useReadyData()
  const { logGoalAttempt, setGoalActive, closeSheet, today } = useBellatrix()
  const [busy, setBusy] = useState(false)
  if (!ready) return null
  const { data } = ready
  const goal = data.personal_goals.find((g) => g.id === goalId)
  if (!goal) return <p className="text-sm text-ink-950/50">목표를 찾을 수 없어요.</p>
  const count = goalAttemptsOn(data, goal.id, today)
  const card = cardById(data, goal.coaching_card_id)
  const last7 = Array.from({ length: 7 }, (_, i) => addDaysISO(today, -6 + i)).map((d) => ({ d, n: goalAttemptsOn(data, goal.id, d) }))
  const weekTotal = last7.reduce((a, x) => a + x.n, 0)
  const daysTried = last7.filter((x) => x.n > 0).length

  const bump = async (delta: 1 | -1) => {
    setBusy(true)
    try {
      await logGoalAttempt(goal.id, delta)
    } catch {
      // toast
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge>{BEHAVIOUR_LABEL[goal.behaviour_type]}</Badge>
        <Badge tone="brand">{goal.source === 'recommended' ? '추천 목표' : '내가 만든 목표'}</Badge>
        {!goal.active && <Badge>보관됨</Badge>}
      </div>
      <h4 className="text-lg font-bold text-ink-950 leading-snug">{goal.title}</h4>

      <div className="flex items-center justify-center gap-3">
        <button disabled={busy || count === 0} onClick={() => bump(-1)} className="w-12 h-12 rounded-full bg-ink-950/6 flex items-center justify-center text-ink-950/60 disabled:opacity-30 active:scale-95 transition" aria-label="하나 줄이기">
          <Minus size={18} />
        </button>
        <div className="text-center w-20">
          <div className="text-3xl font-black text-ink-950 tabular-nums">{count}</div>
          <div className="text-[10px] text-ink-950/40">오늘{goal.target_count ? ` / ${goal.target_count}` : ''}</div>
        </div>
        <button disabled={busy || !goal.active} onClick={() => bump(1)} className="w-12 h-12 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/30 disabled:opacity-30 active:scale-95 transition" aria-label="한 번 더 시도">
          <Plus size={18} />
        </button>
      </div>

      <div className="rounded-xl bg-ink-950/4 px-3.5 py-3">
        <div className="flex items-center justify-between text-[10px] font-semibold text-ink-950/40 uppercase tracking-wide mb-2">
          <span>최근 7일</span>
          <span className="normal-case tabular-nums">
            {daysTried}일 시도 · {weekTotal}회
          </span>
        </div>
        <div className="flex items-end gap-1 h-10">
          {last7.map((x) => (
            <div key={x.d} className="flex-1 flex flex-col justify-end h-full" title={`${x.d}: ${x.n}회`}>
              <div className="w-full rounded-sm bg-brand-500/30" style={{ height: `${x.n === 0 ? 6 : Math.min(100, 20 + x.n * 27)}%` }} />
            </div>
          ))}
        </div>
      </div>

      {card && (
        <div className="rounded-xl bg-brand-50 border border-brand-200/60 px-3.5 py-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-brand-700 uppercase tracking-wide mb-1">
            <Sparkles size={12} /> 이렇게 말해보기
          </div>
          <div className="text-sm text-brand-900 whitespace-pre-line">{card.script}</div>
        </div>
      )}

      <SecondaryButton
        disabled={busy}
        onClick={async () => {
          await setGoalActive(goal.id, !goal.active)
          closeSheet()
        }}
        className="flex items-center justify-center gap-1.5"
      >
        <Archive size={14} /> {goal.active ? '이 목표 보관하기' : '다시 켜기'}
      </SecondaryButton>
      <div className="flex items-start gap-1.5 text-[11px] text-ink-950/40">
        <Lock size={12} className="shrink-0 mt-0.5" /> 이 목표와 시도 기록은 나만 볼 수 있어요.
      </div>
    </div>
  )
}
