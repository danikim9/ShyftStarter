import { useState } from 'react'
import { useBellatrix } from '../../../lib/bellatrixStore'
import type { BehaviourType, CoachingHelpfulness, PerceivedSalesLevel } from '../../../types/bellatrix'
import { BEHAVIOUR_LABEL } from '../../../types/bellatrix'
import { PrimaryButton } from '../../ui'
import { ChoiceChips, Question, TextArea } from '../shared'

const BEHAVIOURS: { value: BehaviourType; label: string }[] = (['discovery', 'demo', 'recommendation', 'cross_sell', 'closing'] as BehaviourType[]).map((b) => ({
  value: b,
  label: BEHAVIOUR_LABEL[b],
}))
const SALES: { value: PerceivedSalesLevel; label: string }[] = [
  { value: 'lower', label: '낮았어요' },
  { value: 'similar', label: '비슷했어요' },
  { value: 'higher', label: '높았어요' },
]

/** End-of-shift reflection: exactly 3 questions, no survey creep. */
export function ReflectionSheet() {
  const { submitReflection, closeSheet } = useBellatrix()
  const [dominant, setDominant] = useState<BehaviourType | null>(null)
  const [perceived, setPerceived] = useState<PerceivedSalesLevel | null>(null)
  const [help, setHelp] = useState<CoachingHelpfulness | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!dominant || !perceived || !help) {
      setError('세 질문에 모두 답해주세요.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await submitReflection({ dominant, perceived, helpfulness: help, note })
      closeSheet()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-ink-950/45">1분이면 끝나요. 오늘 하루를 세 가지만 돌아볼게요.</p>
      <Question n={1} text="오늘 가장 많이 쓴 행동은?">
        <ChoiceChips options={BEHAVIOURS} value={dominant} onChange={setDominant} />
      </Question>
      <Question n={2} text="평소 근무와 비교해 오늘 매출 느낌은?">
        <ChoiceChips options={SALES} value={perceived} onChange={setPerceived} columns={3} />
      </Question>
      <Question n={3} text="오늘 코칭이 도움이 됐나요?">
        <div className="flex items-center justify-between gap-1.5">
          {([1, 2, 3, 4, 5] as CoachingHelpfulness[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setHelp(v)}
              className={`flex-1 h-12 rounded-xl border text-base font-bold transition active:scale-95 ${
                help === v ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-ink-950/10 text-ink-950/60'
              }`}
              aria-label={`${v}점`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-ink-950/35 px-1">
          <span>전혀</span>
          <span>매우</span>
        </div>
      </Question>
      <Question text="한 줄 메모 (선택)">
        <TextArea value={note} onChange={setNote} placeholder="내일 나에게 남길 한 마디" />
      </Question>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <PrimaryButton disabled={busy} onClick={submit}>
        {busy ? '저장 중…' : '회고 남기기'}
      </PrimaryButton>
    </div>
  )
}
