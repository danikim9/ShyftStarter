import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../../lib/bellatrixStore'
import type { ConfidenceFeel, CustomerReaction, TriedLevel } from '../../../types/bellatrix'
import { CONFIDENCE_FEEL_LABEL, REACTION_LABEL, TRIED_LABEL } from '../../../types/bellatrix'
import { cardById, prepForShift } from '../../../lib/selectors'
import { PrimaryButton } from '../../ui'
import { ChoiceChips, Question, TextArea } from '../shared'

const TRIED: { value: TriedLevel; label: string }[] = (['yes', 'partly', 'no'] as TriedLevel[]).map((v) => ({ value: v, label: TRIED_LABEL[v] }))
const REACTION: { value: CustomerReaction; label: string }[] = (['positive', 'neutral', 'negative', 'no_chance'] as CustomerReaction[]).map((v) => ({ value: v, label: REACTION_LABEL[v] }))
const CONF: { value: ConfidenceFeel; label: string }[] = (['low', 'ok', 'high'] as ConfidenceFeel[]).map((v) => ({ value: v, label: CONFIDENCE_FEEL_LABEL[v] }))

/** 5–15 second post-shift reflection: three taps, everything else optional.
 * Private by default — the sheet says so. */
export function ReflectionSheet({ shiftId }: { shiftId: string }) {
  const ready = useReadyData()
  const { submitReflection, closeSheet } = useBellatrix()
  const [tried, setTried] = useState<TriedLevel | null>(null)
  const [reaction, setReaction] = useState<CustomerReaction | null>(null)
  const [tryAgain, setTryAgain] = useState<boolean | null>(null)
  const [tipHelpful, setTipHelpful] = useState<boolean | null>(null)
  const [confidence, setConfidence] = useState<ConfidenceFeel | null>(null)
  const [win, setWin] = useState('')
  const [more, setMore] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!ready) return null
  const { user, data } = ready
  const prep = prepForShift(data, user.id, shiftId)
  const card = cardById(data, prep?.coaching_card_id ?? null)
  const shared = user.consent.share_reflections_with_manager

  const submit = async () => {
    if (!tried || !reaction || tryAgain === null) {
      setError('위 세 가지만 탭해주세요.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await submitReflection({ shiftId, tried, reaction, tryAgain, tipHelpful, confidence, winNote: win })
      closeSheet()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-ink-950/4 px-3.5 py-2.5">
        <div className="text-[10px] font-semibold text-ink-950/40 uppercase tracking-wide">오늘 해보기로 한 행동</div>
        <div className="text-sm font-semibold text-ink-950 mt-0.5">{card ? card.headline : '오늘의 응대'}</div>
      </div>
      <Question n={1} text="시도했나요?">
        <ChoiceChips options={TRIED} value={tried} onChange={setTried} columns={3} />
      </Question>
      <Question n={2} text="고객 반응은?">
        <ChoiceChips options={REACTION} value={reaction} onChange={setReaction} columns={2} />
      </Question>
      <Question n={3} text="다음 근무에도 해볼까요?">
        <ChoiceChips
          options={[
            { value: 'yes', label: '네, 다시 해볼게요' },
            { value: 'no', label: '다른 걸 해볼게요' },
          ]}
          value={tryAgain === null ? null : tryAgain ? 'yes' : 'no'}
          onChange={(v) => setTryAgain(v === 'yes')}
          columns={2}
        />
      </Question>

      {!more ? (
        <button type="button" onClick={() => setMore(true)} className="text-xs text-brand-700 font-medium">
          + 10초 더: 팁이 도움됐는지 · 자신감 · 오늘 잘한 점
        </button>
      ) : (
        <div className="space-y-4">
          {card && (
            <Question text="이 팁이 도움됐나요?">
              <ChoiceChips
                options={[
                  { value: 'yes', label: '도움됐어요' },
                  { value: 'no', label: '별로였어요' },
                ]}
                value={tipHelpful === null ? null : tipHelpful ? 'yes' : 'no'}
                onChange={(v) => setTipHelpful(v === 'yes')}
                columns={2}
              />
            </Question>
          )}
          <Question text="지금 이 행동, 얼마나 자신 있어요?">
            <ChoiceChips options={CONF} value={confidence} onChange={setConfidence} columns={3} />
          </Question>
          <Question text="오늘 잘한 점 한 줄">
            <TextArea value={win} onChange={setWin} placeholder="예: 케이스 제안했더니 한 분이 바로 사셨어요" />
          </Question>
        </div>
      )}

      <div className="flex items-start gap-1.5 text-[11px] text-ink-950/45">
        <Lock size={12} className="shrink-0 mt-0.5" />
        {shared ? '프로필 설정에 따라 이 회고는 매니저에게도 보여요.' : '이 회고는 나만 볼 수 있어요. 매니저에게는 보이지 않아요.'}
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <PrimaryButton disabled={busy} onClick={submit}>
        {busy ? '저장 중…' : '기록 끝'}
      </PrimaryButton>
    </div>
  )
}
