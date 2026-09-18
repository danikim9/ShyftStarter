import { useState } from 'react'
import { Minus, Plus, SkipForward } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../../lib/bellatrixStore'
import { BEHAVIOUR_LABEL, INTERVENTION_LABEL, METRIC_SHORT } from '../../../types/bellatrix'
import { eventsFor, progressOf, hasCheckIn } from '../../../lib/selectors'
import { fmtTimeHM } from '../../../lib/dates'
import { Badge, PrimaryButton, ProgressBar, SecondaryButton } from '../../ui'

const EVENT_LABEL: Record<string, string> = {
  viewed: '확인함',
  accepted: '수락',
  started: '시작',
  progress_updated: '진행 업데이트',
  completed: '완료',
  skipped: '건너뜀',
  expired: '만료',
}

export function ActionDetailSheet({ assignmentId }: { assignmentId: string }) {
  const ready = useReadyData()
  const { logActionEvent, openSheet, closeSheet } = useBellatrix()
  const [busy, setBusy] = useState(false)

  if (!ready) return null
  const { data } = ready
  const assignment = data.assignments.find((a) => a.id === assignmentId)
  const action = assignment && data.actions.find((a) => a.id === assignment.action_id)
  if (!assignment || !action) return <p className="text-sm text-ink-950/50">액션을 찾을 수 없어요.</p>

  const progress = progressOf(data, assignment)
  const target = assignment.target_count ?? 1
  const done = assignment.status === 'completed'
  const skipped = assignment.status === 'skipped' || assignment.status === 'expired'
  const checkedIn = hasCheckIn(data, assignment.id)
  const events = eventsFor(data, assignment.id)

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } catch {
      // toast shown by store
    } finally {
      setBusy(false)
    }
  }

  const bump = (delta: number) =>
    run(async () => {
      const next = Math.max(0, Math.min(target, progress + delta))
      if (next === progress) return
      if (progress === 0 && assignment.status === 'assigned') await logActionEvent(assignment.id, 'started', 0)
      await logActionEvent(assignment.id, 'progress_updated', next)
    })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge tone="brand">{INTERVENTION_LABEL[action.intervention_type]}</Badge>
        <Badge>{BEHAVIOUR_LABEL[action.behaviour_type]}</Badge>
        <Badge>{METRIC_SHORT[action.target_metric]}</Badge>
        {done && <Badge tone="emerald">완료</Badge>}
        {skipped && <Badge>건너뜀</Badge>}
      </div>
      <h4 className="text-lg font-bold text-ink-950 leading-snug">{action.title}</h4>
      <p className="text-sm text-ink-950/70 leading-relaxed">{action.description}</p>
      {action.coaching_text && action.intervention_type !== 'micro_coaching' && (
        <div className="rounded-xl bg-brand-50 border border-brand-200/60 px-4 py-3 text-sm text-brand-800 leading-relaxed">💡 {action.coaching_text}</div>
      )}

      <div>
        <div className="flex justify-between text-xs text-ink-950/50 mb-1.5">
          <span>진행</span>
          <span className="tabular-nums font-semibold text-ink-950">
            {progress} / {target}
          </span>
        </div>
        <ProgressBar value={progress} max={target} colorClass={done ? 'bg-emerald-signal' : 'bg-brand-500'} />
      </div>

      {!done && !skipped && (
        <>
          <div className="flex items-center justify-center gap-3">
            <button
              disabled={busy || progress === 0}
              onClick={() => bump(-1)}
              className="w-12 h-12 rounded-full bg-ink-950/6 flex items-center justify-center text-ink-950/60 disabled:opacity-30 active:scale-95 transition"
              aria-label="하나 줄이기"
            >
              <Minus size={18} />
            </button>
            <div className="text-3xl font-black text-ink-950 tabular-nums w-16 text-center">{progress}</div>
            <button
              disabled={busy || progress >= target}
              onClick={() => bump(1)}
              className="w-12 h-12 rounded-full bg-brand-500 text-ink-950 flex items-center justify-center shadow-md shadow-brand-500/30 disabled:opacity-30 active:scale-95 transition"
              aria-label="하나 더 했어요"
            >
              <Plus size={18} />
            </button>
          </div>
          <p className="text-center text-[11px] text-ink-950/40 -mt-1">시도할 때마다 + 를 눌러주세요</p>
          <PrimaryButton disabled={busy} onClick={() => openSheet({ kind: 'checkin', assignmentId: assignment.id })}>
            {progress >= target ? '완료하기 — 20초 체크인' : '오늘은 여기까지 — 체크인하고 완료'}
          </PrimaryButton>
          <SecondaryButton disabled={busy} onClick={() => run(async () => { await logActionEvent(assignment.id, 'skipped'); closeSheet() })} className="flex items-center justify-center gap-1.5">
            <SkipForward size={14} /> 오늘은 건너뛰기
          </SecondaryButton>
        </>
      )}

      {done && !checkedIn && <PrimaryButton onClick={() => openSheet({ kind: 'checkin', assignmentId: assignment.id })}>체크인 남기기</PrimaryButton>}
      {done && checkedIn && <p className="text-xs text-emerald-700 bg-emerald-signal/10 rounded-xl px-4 py-3">완료 + 체크인 기록됨. "액션 완료"는 참여 기록이고, 행동이 실제로 있었는지는 매니저 관찰로 확인돼요.</p>}

      {events.length > 0 && (
        <div className="pt-2">
          <div className="text-[11px] font-semibold text-ink-950/40 uppercase tracking-wide mb-1.5">기록</div>
          <div className="space-y-1">
            {events.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-xs text-ink-950/55">
                <span>{EVENT_LABEL[e.event_type] ?? e.event_type}{e.progress_value !== null ? ` · ${e.progress_value}` : ''}</span>
                <span className="tabular-nums">{fmtTimeHM(e.event_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
