import { useMemo, useState } from 'react'
import { useBellatrix, useManagerData } from '../../lib/bellatrixStore'
import type { BehaviourType, ObservationResult } from '../../types/bellatrix'
import { BEHAVIOUR_LABEL } from '../../types/bellatrix'
import { shiftsOn } from '../../lib/selectors'
import { PrimaryButton } from '../../components/ui'
import { Question, TextArea } from '../../components/bellatrix/shared'

const OBSERVED: BehaviourType[] = ['discovery', 'demo', 'cross_sell']
type Tri = ObservationResult | 'not_checked'

function TriToggle({ value, onChange }: { value: Tri; onChange: (v: Tri) => void }) {
  const opts: { v: Tri; label: string; cls: string }[] = [
    { v: 'observed', label: '관찰함', cls: 'bg-emerald-signal text-white border-emerald-signal' },
    { v: 'not_observed', label: '관찰 안 됨', cls: 'bg-amber-signal text-white border-amber-signal' },
    { v: 'not_checked', label: '확인 안 함', cls: 'bg-ink-950/70 text-white border-ink-950/70' },
  ]
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`rounded-lg border py-2 text-xs font-semibold transition active:scale-[0.97] ${value === o.v ? o.cls : 'bg-white border-ink-950/10 text-ink-950/60'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** 10–20 second sampled observation. Only observed / not_observed rows are
 * stored (high confidence); "not checked" stores nothing — sampling is fine. */
export function ObservationSheet({ presetUserId }: { presetUserId?: string }) {
  const ready = useManagerData()
  const { submitObservation, closeSheet, today } = useBellatrix()
  const [userId, setUserId] = useState<string | null>(presetUserId ?? null)
  const [results, setResults] = useState<Record<BehaviourType, Tri>>({ discovery: 'not_checked', demo: 'not_checked', cross_sell: 'not_checked' } as Record<BehaviourType, Tri>)
  const [coaching, setCoaching] = useState<boolean | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const employees = useMemo(() => {
    if (!ready) return []
    const working = new Set(shiftsOn(ready.data, today).map((s) => s.user_id))
    return ready.data.users.filter((u) => u.role === 'employee').sort((a, b) => Number(working.has(b.id)) - Number(working.has(a.id))).map((u) => ({ ...u, working: working.has(u.id) }))
  }, [ready, today])

  if (!ready) return null

  const submit = async () => {
    if (!userId) return setError('직원을 선택해주세요.')
    const picked: Partial<Record<BehaviourType, ObservationResult>> = {}
    for (const b of OBSERVED) if (results[b] !== 'not_checked') picked[b] = results[b] as ObservationResult
    if (Object.keys(picked).length === 0) return setError('최소 한 가지 행동은 표시해주세요. 나머지는 "확인 안 함"으로 두어도 괜찮아요.')
    setBusy(true)
    setError(null)
    try {
      await submitObservation({ userId, results: picked, coachingNeeded: coaching, note })
      closeSheet()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-ink-950/45">10~20초면 충분해요. 매일 모든 직원을 볼 필요는 없어요 — 본 것만 기록하면 돼요.</p>
      <Question n={1} text="직원">
        <div className="flex flex-wrap gap-2">
          {employees.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setUserId(e.id)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${userId === e.id ? 'bg-brand-500 border-brand-500 text-ink-950' : 'bg-white border-ink-950/10 text-ink-950/75'}`}
            >
              {e.name}
              {e.working && <span className={`ml-1 text-[10px] ${userId === e.id ? 'text-white/70' : 'text-emerald-600'}`}>근무 중</span>}
            </button>
          ))}
        </div>
      </Question>
      <Question n={2} text="관찰한 행동">
        <div className="space-y-3">
          {OBSERVED.map((b) => (
            <div key={b}>
              <div className="text-xs font-medium text-ink-950/70 mb-1">{BEHAVIOUR_LABEL[b]}</div>
              <TriToggle value={results[b]} onChange={(v) => setResults((r) => ({ ...r, [b]: v }))} />
            </div>
          ))}
        </div>
      </Question>
      <Question text="코칭이 필요해 보이나요? (선택)">
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: true, label: '예' },
            { v: false, label: '아니오' },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => setCoaching(coaching === o.v ? null : o.v)}
              className={`rounded-xl border py-2.5 text-sm font-medium ${coaching === o.v ? 'bg-ink-950 border-ink-950 text-white' : 'bg-white border-ink-950/10 text-ink-950/70'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </Question>
      <Question text="메모 (선택)">
        <TextArea value={note} onChange={setNote} placeholder="예: 결정 직후 케이스 제안 자연스러웠음" />
      </Question>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <PrimaryButton disabled={busy} onClick={submit}>
        {busy ? '저장 중…' : '관찰 기록'}
      </PrimaryButton>
    </div>
  )
}
