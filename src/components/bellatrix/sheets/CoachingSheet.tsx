import { useEffect, useState } from 'react'
import { Sparkles, Check } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../../lib/bellatrixStore'
import { BEHAVIOUR_LABEL, METRIC_SHORT } from '../../../types/bellatrix'
import { Badge, PrimaryButton, SecondaryButton } from '../../ui'

/** Micro coaching: 5–20 seconds of reading, one CTA. Accepting is a digital
 * signal (engagement), not behaviour evidence — the check-in later asks
 * whether it was actually applied. */
export function CoachingSheet({ assignmentId }: { assignmentId: string }) {
  const ready = useReadyData()
  const { logActionEvent, closeSheet, openSheet, trackEvent } = useBellatrix()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    trackEvent('coaching_viewed', { assignment_id: assignmentId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId])

  if (!ready) return null
  const assignment = ready.data.assignments.find((a) => a.id === assignmentId)
  const action = assignment && ready.data.actions.find((a) => a.id === assignment.action_id)
  if (!assignment || !action) return <p className="text-sm text-ink-950/50">코칭 카드를 찾을 수 없어요.</p>

  const accepted = assignment.status !== 'assigned'
  const done = assignment.status === 'completed'

  const accept = async () => {
    setBusy(true)
    try {
      await logActionEvent(assignment.id, 'accepted')
      await logActionEvent(assignment.id, 'started', 0)
      closeSheet()
    } catch {
      // toast already shown
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge tone="brand">
          <Sparkles size={10} /> 마이크로 코칭
        </Badge>
        <Badge>{BEHAVIOUR_LABEL[action.behaviour_type]}</Badge>
        <Badge>{METRIC_SHORT[action.target_metric]}</Badge>
      </div>
      <h4 className="text-lg font-bold text-ink-950 leading-snug">{action.title}</h4>
      <p className="text-sm text-ink-950/75 leading-relaxed whitespace-pre-line">{action.coaching_text ?? action.description}</p>
      <p className="text-[11px] text-ink-950/40">읽는 데 10초면 충분해요. 오늘 응대에서 한 번만 시도해보세요.</p>

      {done ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-signal/10 px-4 py-3 text-sm text-emerald-700 font-medium">
          <Check size={16} /> 오늘 적용했다고 기록했어요
        </div>
      ) : accepted ? (
        <PrimaryButton onClick={() => openSheet({ kind: 'checkin', assignmentId: assignment.id })}>적용했어요 — 20초 체크인</PrimaryButton>
      ) : (
        <PrimaryButton disabled={busy} onClick={accept}>
          오늘 이걸 써볼게요
        </PrimaryButton>
      )}
      {!done && <SecondaryButton onClick={closeSheet}>나중에 볼게요</SecondaryButton>}
    </div>
  )
}
