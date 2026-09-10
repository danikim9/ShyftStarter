import { useMemo } from 'react'
import { Target, Sparkles, ListChecks, Check } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../lib/bellatrixStore'
import { viewAssignments, type AssignmentView } from '../../lib/selectors'
import { addDaysISO, fmtShortDate } from '../../lib/dates'
import { BEHAVIOUR_LABEL, INTERVENTION_LABEL, METRIC_SHORT } from '../../types/bellatrix'
import { Card, SectionLabel, Badge, ProgressBar } from '../../components/ui'
import { EmptyState, ErrorState, LoadingState } from '../../components/bellatrix/shared'

function Row({ v }: { v: AssignmentView }) {
  const { openSheet } = useBellatrix()
  const target = v.target ?? 1
  const isCoaching = v.action.intervention_type === 'micro_coaching'
  return (
    <button
      onClick={() => openSheet(isCoaching ? { kind: 'coaching', assignmentId: v.assignment.id } : { kind: 'actionDetail', assignmentId: v.assignment.id })}
      className="w-full text-left flex items-center gap-3 py-3 border-b border-ink-950/6 last:border-0"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${v.isDone ? 'bg-emerald-signal/15 text-emerald-600' : isCoaching ? 'bg-brand-50 text-brand-600' : 'bg-ink-950/6 text-ink-950/50'}`}>
        {v.isDone ? <Check size={14} strokeWidth={3} /> : isCoaching ? <Sparkles size={14} /> : <Target size={14} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-sm leading-snug ${v.isDone ? 'text-ink-950/45' : 'text-ink-950/90'}`}>{v.action.title}</div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[10px] text-ink-950/40">{INTERVENTION_LABEL[v.action.intervention_type]}</span>
          <Badge>{BEHAVIOUR_LABEL[v.action.behaviour_type]}</Badge>
          <Badge tone="brand">{METRIC_SHORT[v.action.target_metric]}</Badge>
        </div>
      </div>
      {!isCoaching && (
        <div className="w-14 shrink-0 text-right">
          <div className="text-xs font-semibold tabular-nums text-ink-950/70">
            {v.progress}/{target}
          </div>
          {!v.isDone && !v.isSkipped && <ProgressBar value={v.progress} max={target} />}
        </div>
      )}
      {isCoaching && <Badge tone={v.isDone ? 'emerald' : 'default'}>{v.isDone ? '적용함' : '보기'}</Badge>}
    </button>
  )
}

export function Actions() {
  const ready = useReadyData()
  const { dataset, reload, today } = useBellatrix()

  const groups = useMemo(() => {
    if (!ready) return null
    const { data, user } = ready
    const mine = data.assignments.filter((a) => a.assigned_to_user_id === user.id)
    const todayRows = viewAssignments(data, mine.filter((a) => a.assigned_date === today))
    const upcoming = viewAssignments(data, mine.filter((a) => a.assigned_date > today)).sort((a, b) => a.assignment.assigned_date.localeCompare(b.assignment.assigned_date))
    const weekAgo = addDaysISO(today, -7)
    const past = viewAssignments(data, mine.filter((a) => a.assigned_date < today && a.assigned_date >= weekAgo)).sort((a, b) =>
      b.assignment.assigned_date.localeCompare(a.assignment.assigned_date)
    )
    return { todayRows, upcoming, past }
  }, [ready, today])

  if (dataset.status === 'error') return <ErrorState message={dataset.message} onRetry={dataset.retryable ? reload : undefined} />
  if (!groups) return <LoadingState />

  const done = groups.todayRows.filter((v) => v.isDone).length

  return (
    <div className="px-4 pt-4 pb-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-950 mb-1">Actions</h1>
        <p className="text-xs text-ink-950/40">
          오늘 {groups.todayRows.length}개 중 {done}개 완료 · 완료는 참여 기록이고, 행동은 체크인과 매니저 관찰로 확인돼요.
        </p>
      </div>

      <div>
        <SectionLabel>오늘</SectionLabel>
        <Card>
          {groups.todayRows.length === 0 ? (
            <EmptyState icon={<ListChecks size={18} />} title="오늘 배정된 액션이 없어요" body="매니저가 배정하면 여기에 나타나요." />
          ) : (
            groups.todayRows.map((v) => <Row key={v.assignment.id} v={v} />)
          )}
        </Card>
      </div>

      {groups.upcoming.length > 0 && (
        <div>
          <SectionLabel>예정</SectionLabel>
          <Card>
            {groups.upcoming.map((v) => (
              <div key={v.assignment.id} className="flex items-center gap-3 py-2.5 border-b border-ink-950/6 last:border-0">
                <span className="text-[11px] text-ink-950/40 w-16 shrink-0">{fmtShortDate(v.assignment.assigned_date)}</span>
                <span className="text-sm text-ink-950/80 flex-1 min-w-0 truncate">{v.action.title}</span>
                <Badge>{BEHAVIOUR_LABEL[v.action.behaviour_type]}</Badge>
              </div>
            ))}
          </Card>
        </div>
      )}

      <div>
        <SectionLabel>지난 7일</SectionLabel>
        <Card>
          {groups.past.length === 0 ? (
            <p className="text-xs text-ink-950/35 py-2">지난 7일간 기록이 없어요.</p>
          ) : (
            groups.past.map((v) => (
              <div key={v.assignment.id} className="flex items-center gap-3 py-2.5 border-b border-ink-950/6 last:border-0">
                <span className="text-[11px] text-ink-950/40 w-16 shrink-0">{fmtShortDate(v.assignment.assigned_date)}</span>
                <span className={`text-sm flex-1 min-w-0 truncate ${v.isDone ? 'text-ink-950/80' : 'text-ink-950/45'}`}>{v.action.title}</span>
                <Badge tone={v.isDone ? 'emerald' : 'default'}>{v.isDone ? '완료' : v.isSkipped ? '건너뜀' : '미완료'}</Badge>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  )
}
