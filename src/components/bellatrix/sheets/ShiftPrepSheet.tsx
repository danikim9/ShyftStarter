import { useEffect, useMemo, useState } from 'react'
import { Sparkles, MessageSquareQuote, Package, ShieldQuestion, PlusCircle, Check, Lock } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../../lib/bellatrixStore'
import { BEHAVIOUR_LABEL } from '../../../types/bellatrix'
import { cardById, pickPrepCard, prepForShift } from '../../../lib/selectors'
import { Badge, PrimaryButton, SecondaryButton } from '../../ui'
import { buildPrepQuiz } from '../../../lib/prepQuiz'
import { PrepQuiz } from '../PrepQuiz'
import { FEATURES } from '../../../lib/features'

function Block({ icon, label, children, tone = 'default' }: { icon: React.ReactNode; label: string; children: React.ReactNode; tone?: 'default' | 'brand' }) {
  return (
    <div className={`rounded-xl px-3.5 py-3 ${tone === 'brand' ? 'bg-brand-50 border border-brand-200/70' : 'bg-white border border-ink-950/8'}`}>
      <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide mb-1 ${tone === 'brand' ? 'text-brand-700' : 'text-ink-950/40'}`}>
        {icon} {label}
      </div>
      <div className="text-sm text-ink-950/85 leading-relaxed">{children}</div>
    </div>
  )
}

/** 30-second Shift Prep: one behaviour, one script, one product point, one
 * objection, one cross-sell tip, one CTA. */
export function ShiftPrepSheet({ shiftId }: { shiftId: string }) {
  const ready = useReadyData()
  const { acceptShiftPrep, logCardEvent, closeSheet, trackEvent, today } = useBellatrix()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    trackEvent('shift_prep_viewed', { shift_id: shiftId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftId])

  const model = useMemo(() => {
    if (!ready) return null
    const { user, data } = ready
    const shift = data.shifts.find((s) => s.id === shiftId) ?? null
    const existing = prepForShift(data, user.id, shiftId)
    if (existing) {
      const card = cardById(data, existing.coaching_card_id)
      return card ? { shift, card, goal: data.personal_goals.find((g) => g.id === existing.personal_goal_id) ?? null, assignment: data.assignments.find((a) => a.id === existing.action_assignment_id) ?? null, accepted: true } : null
    }
    const picked = pickPrepCard(data, user, shift ? shift.start_at.slice(0, 10) : today)
    return picked ? { shift, ...picked, accepted: false } : null
  }, [ready, shiftId, today])

  if (!ready) return null
  if (!model) return <p className="text-sm text-ink-950/50">아직 준비할 콘텐츠가 없어요. 목표를 하나 골라보세요.</p>
  const { card, goal, assignment, accepted } = model
  const quiz = buildPrepQuiz(card, ready.data.coaching_cards)
  const answeredEvent = ready.data.action_events.find((e) => e.event_type === 'quiz_answered' && e.coaching_card_id === card.id && e.shift_id === shiftId)
  const answered = answeredEvent ? { correct: answeredEvent.metadata?.correct === true } : null

  const accept = async () => {
    setBusy(true)
    try {
      await acceptShiftPrep({ shiftId, coachingCardId: card.id, personalGoalId: goal?.id ?? null, assignmentId: assignment?.id ?? null })
      closeSheet()
    } catch {
      // toast shown
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge tone="brand">
          <Sparkles size={10} /> {BEHAVIOUR_LABEL[card.behaviour_type]}
        </Badge>
        {assignment ? <Badge tone="amber">팀에서 받은 행동</Badge> : goal ? <Badge>내 목표</Badge> : <Badge>추천</Badge>}
        <span className="text-[10px] text-ink-950/35 ml-auto">30초</span>
      </div>
      <h4 className="text-lg font-bold text-ink-950 leading-snug">{card.headline}</h4>

      <Block icon={<MessageSquareQuote size={12} />} label="오늘 이렇게 말해보기" tone="brand">
        <span className="font-medium whitespace-pre-line">{card.script}</span>
      </Block>
      <Block icon={<Package size={12} />} label="오늘의 제품 포인트">
        {card.product_point}
      </Block>
      <Block icon={<ShieldQuestion size={12} />} label="이런 반응이 오면">
        <div className="text-ink-950/55 italic mb-1">{card.objection}</div>
        <div>→ {card.objection_response}</div>
      </Block>
      <Block icon={<PlusCircle size={12} />} label="한 번 더 제안하기">
        {card.cross_sell_tip}
      </Block>

      {FEATURES.prepQuiz && quiz && <PrepQuiz quiz={quiz} answered={answered} onAnswer={(index, correct) => void logCardEvent({ cardId: card.id, type: 'quiz_answered', shiftId, metadata: { correct, index, context: 'prep' } })} />}

      {accepted ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-signal/10 px-4 py-3 text-sm text-emerald-700 font-medium">
          <Check size={16} /> 오늘 해보기로 정했어요. 근무 후 5초 회고에서 만나요.
        </div>
      ) : (
        <>
          <PrimaryButton disabled={busy} onClick={accept}>
            오늘 해볼게요
          </PrimaryButton>
          <SecondaryButton onClick={closeSheet}>나중에</SecondaryButton>
        </>
      )}
      <div className="flex items-start gap-1.5 text-[11px] text-ink-950/40">
        <Lock size={12} className="shrink-0 mt-0.5" /> 준비 기록은 나만 볼 수 있어요.
      </div>
    </div>
  )
}
