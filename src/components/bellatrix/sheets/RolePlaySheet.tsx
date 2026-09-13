import { useMemo, useState } from 'react'
import { MessageSquareText, Lock, ThumbsUp, Lightbulb, Quote } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../../lib/bellatrixStore'
import { buildScenario, coachReply, type RolePlayFeedback } from '../../../lib/rolePlayCoach'
import { cardById } from '../../../lib/selectors'
import { BEHAVIOUR_LABEL } from '../../../types/bellatrix'
import { Badge, PrimaryButton, SecondaryButton } from '../../ui'
import { inputClass } from '../shared'

/** Two-turn text role-play on today's coaching card. No scores, no voice.
 * Feedback is one thing that worked + one thing to try + the model line. */
export function RolePlaySheet({ cardId, goalId }: { cardId: string; goalId?: string }) {
  const ready = useReadyData()
  const { logCardEvent, closeSheet } = useBellatrix()
  const card = ready ? cardById(ready.data, cardId) : null
  const turns = useMemo(() => (card ? buildScenario(card) : []), [card])
  const [turn, setTurn] = useState(0)
  const [reply, setReply] = useState('')
  const [log, setLog] = useState<{ customer: string; reply: string; feedback: RolePlayFeedback }[]>([])
  const [finished, setFinished] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!ready || !card) return <p className="text-sm text-ink-950/50">연습할 카드를 찾을 수 없어요.</p>

  const current = turns[turn]
  const send = () => {
    if (!reply.trim() || !current) return
    const feedback = coachReply(reply, card, turn)
    setLog((l) => [...l, { customer: current.customer, reply: reply.trim(), feedback }])
    setReply('')
    if (turn + 1 >= turns.length) setFinished(true)
    else setTurn(turn + 1)
  }

  const finish = async () => {
    setBusy(true)
    try {
      await logCardEvent({ cardId, type: 'practiced', goalId: goalId ?? null, metadata: { turns: log.length, chars: log.reduce((a, x) => a + x.reply.length, 0) } })
      closeSheet()
    } catch {
      // toast
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge tone="brand">
          <MessageSquareText size={10} /> 2분 연습 · 텍스트
        </Badge>
        <Badge>{BEHAVIOUR_LABEL[card.behaviour_type]}</Badge>
      </div>
      <div>
        <div className="text-base font-bold text-ink-950 leading-snug">{card.headline}</div>
        <div className="text-[11px] text-ink-950/45 mt-0.5">고객 말에 내 말로 답해보세요. 점수는 없고, 잘된 문장 하나와 고쳐볼 문장 하나만 돌려줘요.</div>
      </div>

      <div className="space-y-3">
        {log.map((l, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ink-950/6 px-3.5 py-2.5 text-sm text-ink-950/85">🧑 {l.customer}</div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-500 text-white px-3.5 py-2.5 text-sm">{l.reply}</div>
            </div>
            <div className="rounded-xl border border-ink-950/8 bg-white px-3.5 py-3 space-y-1.5 text-xs">
              <div className="flex items-start gap-1.5 text-emerald-700">
                <ThumbsUp size={12} className="shrink-0 mt-0.5" /> {l.feedback.good}
              </div>
              <div className="flex items-start gap-1.5 text-amber-700">
                <Lightbulb size={12} className="shrink-0 mt-0.5" /> {l.feedback.improve}
              </div>
              <div className="flex items-start gap-1.5 text-ink-950/60">
                <Quote size={12} className="shrink-0 mt-0.5" /> 예시: {l.feedback.model}
              </div>
            </div>
          </div>
        ))}
        {!finished && current && (
          <>
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ink-950/6 px-3.5 py-2.5 text-sm text-ink-950/85">🧑 {current.customer}</div>
            </div>
            <div className="text-[11px] text-ink-950/40">힌트: {current.hint}</div>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="내가 할 말을 적어보세요" rows={3} className={`${inputClass} resize-none`} autoFocus={log.length === 0} />
            <PrimaryButton disabled={!reply.trim()} onClick={send}>
              {turn + 1 < turns.length ? '이렇게 말할게요' : '이렇게 말할게요 (마지막)'}
            </PrimaryButton>
          </>
        )}
      </div>

      {finished && (
        <PrimaryButton disabled={busy} onClick={() => void finish()}>
          {busy ? '저장 중…' : '연습 끝 — 오늘 매장에서 해볼게요'}
        </PrimaryButton>
      )}
      <SecondaryButton onClick={closeSheet}>{finished ? '기록 없이 닫기' : '나중에'}</SecondaryButton>
      <div className="flex items-start gap-1.5 text-[11px] text-ink-950/40">
        <Lock size={12} className="shrink-0 mt-0.5" /> 연습 내용과 횟수는 나만 볼 수 있어요. 음성은 사용하지 않아요.
      </div>
    </div>
  )
}
