import { useEffect, useMemo } from 'react'
import { ChevronRight, Sparkles, Target, MoonStar, CalendarOff, Check } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../lib/bellatrixStore'
import { assignmentsFor, reflectionForShift, todayShiftFor, todaysFocusMetric, viewAssignments, type AssignmentView } from '../../lib/selectors'
import { fmtDateKo, fmtTimeHM } from '../../lib/dates'
import { BEHAVIOUR_LABEL, METRIC_LABEL, METRIC_SHORT } from '../../types/bellatrix'
import { recommendNextShiftFocus } from '../../lib/analytics/recommendation'
import { Card, SectionLabel, Badge, ProgressBar, PrimaryButton } from '../../components/ui'
import { EmptyState, ErrorState, LoadingState } from '../../components/bellatrix/shared'

function ActionCard({ v }: { v: AssignmentView }) {
  const { openSheet } = useBellatrix()
  const target = v.target ?? 1
  return (
    <button
      onClick={() => openSheet({ kind: 'actionDetail', assignmentId: v.assignment.id })}
      className="w-full text-left flex items-center gap-3 py-3 border-b border-ink-950/6 last:border-0 active:opacity-70 transition"
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          v.isDone ? 'bg-emerald-signal/15 text-emerald-600' : v.isSkipped ? 'bg-ink-950/6 text-ink-950/30' : 'bg-brand-500/12 text-brand-600'
        }`}
      >
        {v.isDone ? <Check size={16} strokeWidth={3} /> : <Target size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium leading-snug ${v.isDone ? 'text-ink-950/50' : 'text-ink-950/90'}`}>{v.action.title}</div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Badge>{BEHAVIOUR_LABEL[v.action.behaviour_type]}</Badge>
          <Badge tone="brand">{METRIC_SHORT[v.action.target_metric]}</Badge>
          {v.isSkipped && <Badge>건너뜀</Badge>}
        </div>
      </div>
      <div className="w-16 shrink-0 text-right">
        <div className={`text-sm font-bold tabular-nums ${v.isDone ? 'text-emerald-600' : 'text-ink-950'}`}>
          {v.progress} / {target}
        </div>
        {!v.isDone && !v.isSkipped && <ProgressBar value={v.progress} max={target} />}
      </div>
    </button>
  )
}

export function Today() {
  const ready = useReadyData()
  const { dataset, reload, openSheet, trackEvent, today } = useBellatrix()

  useEffect(() => {
    if (ready) trackEvent('today_viewed')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!ready])

  const view = useMemo(() => {
    if (!ready) return null
    const { data, user } = ready
    const shift = todayShiftFor(data, user.id, today)
    const views = viewAssignments(data, assignmentsFor(data, user.id, today))
    const coaching = views.find((v) => v.action.intervention_type === 'micro_coaching') ?? null
    const actions = views.filter((v) => v.action.intervention_type !== 'micro_coaching').slice(0, 3)
    const focus = todaysFocusMetric(data, views)
    const reflection = shift ? reflectionForShift(data, shift.id) : null
    const rec = shift ? null : recommendNextShiftFocus({ dataset: data, userId: user.id, today })
    return { shift, coaching, actions, focus, reflection, rec, user, store: data.store }
  }, [ready, today])

  if (dataset.status === 'error') return <ErrorState message={dataset.message} onRetry={dataset.retryable ? reload : undefined} />
  if (!view) return <LoadingState />

  const { shift, coaching, actions, focus, reflection, rec, user, store } = view
  const firstName = user.name.split(' ')[0]
  const allDone = actions.length > 0 && actions.every((a) => a.isDone || a.isSkipped) && (!coaching || coaching.isDone)

  return (
    <div className="px-4 pt-4 pb-8 space-y-5">
      <div>
        <div className="text-ink-950/40 text-xs">{fmtDateKo(today)}</div>
        <h1 className="text-xl font-bold text-ink-950">{firstName}님, 오늘 하나만 해봐요</h1>
      </div>

      {/* Today's shift */}
      {shift ? (
        <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 p-5 shadow-lg shadow-brand-900/30 text-white">
          <div className="text-[11px] font-semibold text-white/75 tracking-wide">오늘 근무</div>
          <div className="text-2xl font-bold mt-1 tabular-nums">
            {fmtTimeHM(shift.start_at)} – {fmtTimeHM(shift.end_at)}
          </div>
          <div className="text-white/85 text-sm mt-1">{store.name}</div>
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-white/70">오늘의 포커스</div>
              <div className="text-base font-bold">{METRIC_LABEL[focus]}</div>
            </div>
            <Target size={22} className="text-white/70" />
          </div>
        </div>
      ) : (
        <Card className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ink-950/6 flex items-center justify-center text-ink-950/40 shrink-0">
            <CalendarOff size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-ink-950/85">오늘은 근무가 없어요</div>
            <div className="text-xs text-ink-950/40 mt-0.5">다음 근무의 포커스를 아래에서 미리 볼 수 있어요.</div>
          </div>
        </Card>
      )}

      {/* Micro coaching */}
      <div>
        <SectionLabel>마이크로 코칭</SectionLabel>
        {coaching ? (
          <button
            onClick={() => openSheet({ kind: 'coaching', assignmentId: coaching.assignment.id })}
            className="w-full text-left rounded-2xl border border-brand-200 bg-brand-50 p-4 active:scale-[0.99] transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-brand-700 text-[11px] font-semibold">
                  <Sparkles size={12} /> {BEHAVIOUR_LABEL[coaching.action.behaviour_type]} · 10초
                </div>
                <div className="text-base font-bold text-ink-950 mt-1 leading-snug">{coaching.action.title}</div>
                <p className="text-sm text-ink-950/65 mt-1 leading-relaxed line-clamp-2">{coaching.action.description}</p>
              </div>
              <ChevronRight size={18} className="text-brand-500 shrink-0 mt-1" />
            </div>
            <div className="mt-3">
              {coaching.isDone ? (
                <Badge tone="emerald">
                  <Check size={10} /> 오늘 적용함
                </Badge>
              ) : coaching.assignment.status !== 'assigned' ? (
                <Badge tone="brand">오늘 써보기로 했어요 — 끝나면 체크인</Badge>
              ) : (
                <span className="inline-flex items-center rounded-full bg-brand-500 text-white text-xs font-semibold px-3 py-1.5">오늘 이걸 써볼게요</span>
              )}
            </div>
          </button>
        ) : rec ? (
          <Card>
            <div className="flex items-center gap-1.5 text-brand-700 text-[11px] font-semibold mb-1">
              <Sparkles size={12} /> 다음 근무 추천 포커스
            </div>
            <div className="text-base font-bold text-ink-950 leading-snug">{rec.headline}</div>
            <p className="text-xs text-ink-950/55 mt-1.5 leading-relaxed">{rec.reason}</p>
          </Card>
        ) : (
          <Card>
            <EmptyState icon={<Sparkles size={18} />} title="오늘 배정된 코칭이 없어요" body="매니저가 코칭을 배정하면 여기서 바로 볼 수 있어요." />
          </Card>
        )}
      </div>

      {/* Today's actions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>오늘의 액션</SectionLabel>
          <span className="text-[10px] text-ink-950/30 -mt-2">최대 3개</span>
        </div>
        <Card>
          {actions.length === 0 ? (
            <EmptyState icon={<Target size={18} />} title="오늘 액션이 없어요" body="배정된 액션이 생기면 여기 표시돼요. 진행할 때마다 +로 기록해요." />
          ) : (
            actions.map((v) => <ActionCard key={v.assignment.id} v={v} />)
          )}
        </Card>
      </div>

      {/* Shift reflection */}
      {shift && (
        <div>
          <SectionLabel>근무 마무리</SectionLabel>
          {reflection ? (
            <Card className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-signal/15 flex items-center justify-center text-emerald-600 shrink-0">
                <Check size={16} strokeWidth={3} />
              </div>
              <div className="text-sm text-ink-950/75">
                오늘 회고 완료 · 가장 많이 쓴 행동 <span className="font-semibold text-ink-950">{BEHAVIOUR_LABEL[reflection.dominant_behaviour]}</span>
              </div>
            </Card>
          ) : (
            <Card className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-ink-950/6 flex items-center justify-center text-ink-950/50 shrink-0">
                  <MoonStar size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink-950/85">{allDone ? '오늘 액션을 다 봤어요 — 1분 회고로 마무리해요' : '근무가 끝나면 1분 회고'}</div>
                  <div className="text-xs text-ink-950/40 mt-0.5">질문 3개 · 코칭이 도움이 됐는지 기록해요</div>
                </div>
              </div>
              <PrimaryButton onClick={() => openSheet({ kind: 'reflection' })}>회고 남기기</PrimaryButton>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
