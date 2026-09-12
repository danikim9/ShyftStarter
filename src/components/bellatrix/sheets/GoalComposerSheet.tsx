import { useState } from 'react'
import { Lock, Check } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../../lib/bellatrixStore'
import type { BehaviourType } from '../../../types/bellatrix'
import { BEHAVIOUR_LABEL } from '../../../types/bellatrix'
import { GOAL_TEMPLATES } from '../../../data/coachingCards'
import { PrimaryButton } from '../../ui'
import { ChoiceChips, Question, inputClass } from '../shared'

const BEHAVIOURS: BehaviourType[] = ['discovery', 'demo', 'recommendation', 'cross_sell', 'closing']

/** Pick a recommended goal or write your own. Personal goals are private. */
export function GoalComposerSheet({ onDone }: { onDone?: () => void }) {
  const ready = useReadyData()
  const { createGoal, closeSheet } = useBellatrix()
  const [mode, setMode] = useState<'pick' | 'custom'>('pick')
  const [title, setTitle] = useState('')
  const [behaviour, setBehaviour] = useState<BehaviourType | null>(null)
  const [target, setTarget] = useState('2')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!ready) return null
  const existing = new Set(ready.data.personal_goals.filter((g) => g.user_id === ready.user.id && g.active).map((g) => g.title))

  const pick = async (t: (typeof GOAL_TEMPLATES)[number]) => {
    setBusy(t.title)
    setError(null)
    try {
      await createGoal({ title: t.title, behaviour_type: t.behaviour_type, target_count: t.target_count, source: 'recommended', coaching_card_id: t.coaching_card_id })
      onDone?.()
      closeSheet()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했어요.')
    } finally {
      setBusy(null)
    }
  }

  const custom = async () => {
    if (!title.trim()) return setError('목표를 한 줄로 적어주세요.')
    if (!behaviour) return setError('어떤 행동인지 하나 골라주세요.')
    setBusy('custom')
    setError(null)
    try {
      const n = target.trim() === '' ? null : Number(target)
      await createGoal({ title, behaviour_type: behaviour, target_count: n !== null && Number.isFinite(n) && n > 0 ? n : null, source: 'self', coaching_card_id: null })
      onDone?.()
      closeSheet()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했어요.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-full bg-ink-950/6 p-1">
        {(['pick', 'custom'] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${mode === m ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-950/50'}`}>
            {m === 'pick' ? '추천 목표에서 고르기' : '직접 쓰기'}
          </button>
        ))}
      </div>

      {mode === 'pick' ? (
        <div className="space-y-2">
          {GOAL_TEMPLATES.map((t) => {
            const has = existing.has(t.title)
            return (
              <button
                key={t.title}
                type="button"
                disabled={has || busy !== null}
                onClick={() => pick(t)}
                className={`w-full text-left rounded-xl border px-3.5 py-3 transition ${has ? 'border-emerald-signal/30 bg-emerald-signal/5' : 'border-ink-950/10 bg-white active:scale-[0.99]'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink-950/90">{t.title}</span>
                  {has ? <Check size={15} className="text-emerald-600 shrink-0" /> : <span className="text-[11px] text-brand-700 font-semibold shrink-0">{busy === t.title ? '추가 중…' : '추가'}</span>}
                </div>
                <div className="text-[11px] text-ink-950/45 mt-0.5">
                  {BEHAVIOUR_LABEL[t.behaviour_type]}
                  {t.target_count ? ` · 하루 ${t.target_count}회` : ''}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <Question text="오늘 시도할 행동을 한 줄로">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 결제 전에 액세서리 하나 제안하기" className={inputClass} />
          </Question>
          <Question text="어떤 종류의 행동인가요?">
            <ChoiceChips options={BEHAVIOURS.map((b) => ({ value: b, label: BEHAVIOUR_LABEL[b] }))} value={behaviour} onChange={setBehaviour} />
          </Question>
          <Question text="하루 목표 횟수 (선택)">
            <input inputMode="numeric" pattern="[0-9]*" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ''))} placeholder="예: 3" className={inputClass} />
          </Question>
          <PrimaryButton disabled={busy !== null} onClick={custom}>
            {busy === 'custom' ? '저장 중…' : '내 목표로 추가'}
          </PrimaryButton>
        </div>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex items-start gap-1.5 text-[11px] text-ink-950/40">
        <Lock size={12} className="shrink-0 mt-0.5" /> 개인 목표와 시도 기록은 나만 볼 수 있어요. 팀이나 매니저에게 공유되지 않아요.
      </div>
    </div>
  )
}
