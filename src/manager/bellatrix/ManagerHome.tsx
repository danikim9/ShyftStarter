import { useMemo } from 'react'
import { Eye, BarChart3, ListPlus, Users, Check, Sparkles, UserCheck } from 'lucide-react'
import { useBellatrix, useManagerData } from '../../lib/bellatrixStore'
import { shiftsOn, viewAssignments } from '../../lib/selectors'
import { fmtDateKo, fmtTimeHM, dateOf } from '../../lib/dates'
import { BEHAVIOUR_LABEL, METRIC_LABEL } from '../../types/bellatrix'
import { formatMetric } from '../../lib/analytics/metrics'
import { Card, SectionLabel, Badge } from '../../components/ui'
import { EmptyState, ErrorState, LoadingState } from '../../components/bellatrix/shared'
import { DemoBadge } from '../../components/bellatrix/DemoBadge'
import { Lock } from 'lucide-react'

function Cta({ icon, title, sub, onClick, primary = false }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl p-4 border transition active:scale-[0.98] ${primary ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/25' : 'bg-white border-ink-950/8 text-ink-950'}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${primary ? 'bg-white/20' : 'bg-brand-500/10 text-brand-600'}`}>{icon}</div>
      <div className="text-sm font-bold leading-snug">{title}</div>
      <div className={`text-[11px] mt-0.5 ${primary ? 'text-white/75' : 'text-ink-950/45'}`}>{sub}</div>
    </button>
  )
}

export function ManagerHome() {
  const ready = useManagerData()
  const { dataset, reload, openSheet, today } = useBellatrix()

  const model = useMemo(() => {
    if (!ready) return null
    const { data } = ready
    const shifts = shiftsOn(data, today)
    const todayAssign = data.assignments.filter((a) => a.assigned_date === today)
    const team = shifts
      .map((s) => {
        const u = data.users.find((x) => x.id === s.user_id)
        const views = viewAssignments(data, todayAssign.filter((a) => a.assigned_to_user_id === s.user_id))
        const obsToday = data.evidence.filter((e) => e.user_id === s.user_id && e.evidence_source === 'manager_observation' && dateOf(e.observed_at) === today)
        return u ? { user: u, shift: s, views, obsToday } : null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
    const views = viewAssignments(data, todayAssign)
    const kpiToday = data.outcomes.find((o) => o.outcome_date === today && o.user_id === null) ?? null
    const kpiYesterday = data.outcomes.filter((o) => o.user_id === null && o.outcome_date < today).sort((a, b) => b.outcome_date.localeCompare(a.outcome_date))[0] ?? null
    return { team, views, kpiToday, kpiYesterday, store: ready.store }
  }, [ready, today])

  if (dataset.status === 'error') return <ErrorState message={dataset.message} onRetry={dataset.retryable ? reload : undefined} />
  if (!model || !ready) return <LoadingState />
  const { team, views, kpiToday, kpiYesterday, store } = model
  const completed = views.filter((v) => v.isDone).length
  const coaching = views.filter((v) => v.action.intervention_type === 'micro_coaching')

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="text-ink-950/40 text-xs">{fmtDateKo(today)} · {store.name}</div>
        <h1 className="text-2xl font-bold text-ink-950">오늘의 팀</h1>
        <p className="text-sm text-ink-950/45 mt-0.5">
          포커스 지표 <span className="font-semibold text-ink-950/70">{METRIC_LABEL[store.focus_metric]}</span>
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {ready.user.is_demo && <DemoBadge />}
          <Badge>
            <Lock size={10} /> 직원의 개인 목표·회고는 보이지 않아요
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Cta icon={<Eye size={18} />} title="빠른 관찰" sub="10초 · 본 것만 기록" onClick={() => openSheet({ kind: 'observe' })} primary />
        <Cta icon={<BarChart3 size={18} />} title={kpiToday ? '오늘 성과 수정' : '오늘 성과 입력'} sub={kpiToday ? '입력 완료' : '방문자·거래·매출'} onClick={() => openSheet({ kind: 'kpi' })} />
        <Cta icon={<ListPlus size={18} />} title="액션 배정" sub="개인 또는 팀 전체" onClick={() => openSheet({ kind: 'assign' })} />
        <Card className="flex flex-col justify-between">
          <div className="text-[11px] text-ink-950/45">오늘 액션 진행</div>
          <div className="text-2xl font-bold text-ink-950 tabular-nums">
            {completed}
            <span className="text-sm text-ink-950/40 font-medium"> / {views.length}</span>
          </div>
          <div className="text-[11px] text-ink-950/45">코칭 {coaching.filter((c) => c.isDone).length}/{coaching.length} 적용</div>
        </Card>
      </div>

      <div>
        <SectionLabel>오늘 근무 · {team.length}명</SectionLabel>
        <Card className="p-0 overflow-hidden">
          {team.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={<Users size={18} />} title="오늘 근무하는 직원이 없어요" body="근무가 등록되면 여기에 표시돼요." />
            </div>
          ) : (
            team.map(({ user, shift, views: v, obsToday }) => {
              const done = v.filter((x) => x.isDone).length
              return (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3 border-b border-ink-950/6 last:border-0">
                  <span className="w-9 h-9 rounded-full bg-brand-500/15 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">{user.name[0]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink-950">{user.name}</span>
                      <span className="text-[11px] text-ink-950/40 tabular-nums">
                        {fmtTimeHM(shift.start_at)}–{fmtTimeHM(shift.end_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge tone={done === v.length && v.length > 0 ? 'emerald' : 'default'}>
                        <Check size={10} /> 액션 {done}/{v.length}
                      </Badge>
                      {v.some((x) => x.action.intervention_type === 'micro_coaching') && (
                        <Badge tone="brand">
                          <Sparkles size={10} /> 코칭
                        </Badge>
                      )}
                      {obsToday.length > 0 ? (
                        <Badge tone="emerald">
                          <UserCheck size={10} /> 오늘 관찰 {obsToday.filter((o) => o.evidence_value === 'observed').length}/{obsToday.length}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-ink-950/35">아직 관찰 없음</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => openSheet({ kind: 'observe', presetUserId: user.id })} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-brand-500/10 text-brand-700">
                      관찰
                    </button>
                    <button onClick={() => openSheet({ kind: 'assign', presetUserId: user.id })} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-ink-950/6 text-ink-950/70">
                      배정
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </Card>
      </div>

      <div>
        <SectionLabel>오늘 배정된 액션</SectionLabel>
        <Card>
          {views.length === 0 ? (
            <p className="text-xs text-ink-950/35 py-1">아직 배정한 액션이 없어요. 위 "액션 배정"으로 시작해보세요.</p>
          ) : (
            Object.values(
              views.reduce<Record<string, { title: string; behaviour: string; n: number; done: number }>>((acc, v) => {
                const k = v.action.id
                acc[k] ??= { title: v.action.title, behaviour: BEHAVIOUR_LABEL[v.action.behaviour_type], n: 0, done: 0 }
                acc[k].n++
                if (v.isDone) acc[k].done++
                return acc
              }, {})
            ).map((g) => (
              <div key={g.title} className="flex items-center justify-between py-2.5 border-b border-ink-950/6 last:border-0 gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-ink-950/85 truncate">{g.title}</div>
                  <div className="text-[11px] text-ink-950/40">{g.behaviour}</div>
                </div>
                <span className="text-xs font-semibold text-ink-950/60 tabular-nums shrink-0">
                  {g.done}/{g.n} 완료
                </span>
              </div>
            ))
          )}
        </Card>
      </div>

      <div>
        <SectionLabel>최근 성과</SectionLabel>
        <Card>
          {kpiToday || kpiYesterday ? (
            <div className="grid grid-cols-4 gap-2 text-center">
              {(['cvr', 'atv', 'upt', 'attach_rate'] as const).map((m) => {
                const o = kpiToday ?? kpiYesterday!
                return (
                  <div key={m}>
                    <div className="text-[10px] text-ink-950/40">{m === 'attach_rate' ? 'Attach' : m.toUpperCase()}</div>
                    <div className="text-sm font-bold text-ink-950 tabular-nums">{formatMetric(m, o[m])}</div>
                  </div>
                )
              })}
              <div className="col-span-4 text-[10px] text-ink-950/35 pt-1">{kpiToday ? '오늘 입력값' : `${(kpiYesterday as NonNullable<typeof kpiYesterday>).outcome_date} 기준 · 오늘 성과는 아직 미입력`}</div>
            </div>
          ) : (
            <p className="text-xs text-ink-950/35">아직 성과 입력이 없어요.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
