import { useState } from 'react'
import { Sparkles, MoonStar, Trash2, Lock, Check } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../../lib/bellatrixStore'
import { cardById, prepForShift, reflectionForShift } from '../../../lib/selectors'
import { fmtDateKo, fmtTimeHM, dateOf } from '../../../lib/dates'
import { CONFIDENCE_FEEL_LABEL, REACTION_LABEL, TRIED_LABEL } from '../../../types/bellatrix'
import { Badge, PrimaryButton, SecondaryButton } from '../../ui'

export function ShiftDetailSheet({ shiftId }: { shiftId: string }) {
  const ready = useReadyData()
  const { openSheet, deleteShift, closeSheet, today } = useBellatrix()
  const [confirm, setConfirm] = useState(false)
  if (!ready) return null
  const { user, data } = ready
  const shift = data.shifts.find((s) => s.id === shiftId)
  if (!shift) return <p className="text-sm text-ink-950/50">근무를 찾을 수 없어요.</p>
  const date = dateOf(shift.start_at)
  const prep = prepForShift(data, user.id, shift.id)
  const card = cardById(data, prep?.coaching_card_id ?? null)
  const reflection = reflectionForShift(data, shift.id)
  const isPast = date < today
  const isFuture = date > today

  return (
    <div className="space-y-4">
      <div>
        <div className="text-base font-bold text-ink-950">{fmtDateKo(date)}</div>
        <div className="text-sm text-ink-950/50 tabular-nums">
          {fmtTimeHM(shift.start_at)} – {fmtTimeHM(shift.end_at)}
          {data.store ? ` · ${data.store.name}` : ''}
        </div>
      </div>

      <div className="rounded-xl border border-ink-950/8 bg-white p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-950/40 uppercase tracking-wide">
            <Sparkles size={12} /> 준비
          </div>
          {prep && (
            <Badge tone="brand">
              <Check size={10} /> 준비함
            </Badge>
          )}
        </div>
        {card ? (
          <div>
            <div className="text-sm font-semibold text-ink-950">{card.headline}</div>
            <div className="text-xs text-ink-950/55 mt-0.5 whitespace-pre-line">{card.script}</div>
          </div>
        ) : (
          <div className="text-xs text-ink-950/45">{isPast ? '이 근무는 준비 없이 지나갔어요.' : '아직 준비하지 않았어요.'}</div>
        )}
        {!isPast && <SecondaryButton onClick={() => openSheet({ kind: 'shiftPrep', shiftId: shift.id })}>{prep ? '준비 내용 다시 보기' : 'Shift Prep 30초'}</SecondaryButton>}
      </div>

      {!isFuture && (
        <div className="rounded-xl border border-ink-950/8 bg-white p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-950/40 uppercase tracking-wide">
              <MoonStar size={12} /> 회고
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-ink-950/35">
              <Lock size={10} /> 나만 보기
            </span>
          </div>
          {reflection ? (
            <div className="space-y-1 text-sm text-ink-950/80">
              <div>
                시도: <span className="font-medium">{TRIED_LABEL[reflection.tried]}</span> · 고객 반응: <span className="font-medium">{REACTION_LABEL[reflection.customer_reaction]}</span>
              </div>
              <div>
                다음에도: <span className="font-medium">{reflection.try_again ? '다시 해볼게요' : '다른 걸 해볼게요'}</span>
                {reflection.confidence && <> · 자신감: <span className="font-medium">{CONFIDENCE_FEEL_LABEL[reflection.confidence]}</span></>}
              </div>
              {reflection.win_note && <div className="text-xs text-ink-950/60 bg-ink-950/4 rounded-lg px-3 py-2 mt-1">"{reflection.win_note}"</div>}
            </div>
          ) : (
            <>
              <div className="text-xs text-ink-950/45">아직 회고를 남기지 않았어요.</div>
              <PrimaryButton onClick={() => openSheet({ kind: 'reflection', shiftId: shift.id })}>5초 회고</PrimaryButton>
            </>
          )}
        </div>
      )}

      {shift.source === 'self' &&
        !isPast &&
        (confirm ? (
          <div className="grid grid-cols-2 gap-2">
            <SecondaryButton onClick={() => setConfirm(false)}>취소</SecondaryButton>
            <button
              onClick={async () => {
                await deleteShift(shift.id)
                closeSheet()
              }}
              className="rounded-xl bg-rose-600 text-white text-sm font-semibold py-3"
            >
              삭제
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className="w-full text-xs text-ink-950/40 py-1 inline-flex items-center justify-center gap-1">
            <Trash2 size={12} /> 이 근무 삭제
          </button>
        ))}
    </div>
  )
}
