import { useMemo } from 'react'
import { Eye, BarChart3, ListPlus, Users, Lock, ChevronRight, MessageCircleHeart, Pencil } from 'lucide-react'
import { useBellatrix, useManagerData } from '../../lib/bellatrixStore'
import { useManagerState } from '../../lib/managerStore'
import { shiftsOn, viewAssignments } from '../../lib/selectors'
import { fmtDateKo, fmtTimeHM, dateOf } from '../../lib/dates'
import { formatMetric } from '../../lib/analytics/metrics'
import { buildTeamProfiles } from '../../lib/analytics/team'
import { deltaPct } from '../../lib/analytics/kpiSummary'
import { Card, SectionLabel, Badge } from '../../components/ui'
import { EmptyState, ErrorState, LoadingState } from '../../components/bellatrix/shared'
import { DemoBadge } from '../../components/bellatrix/DemoBadge'

// 매니저 오늘 = three things, in the order a store day happens:
//   1. 오늘 근무 — who is in, and one tap to observe
//   2. 오늘 KPI — CVR · AOV · UPT, one tap to enter
//   3. 오늘 코칭 한 사람 — the one person the evidence says to talk to

function KpiTile({ label, value, delta }: { label: string; value: string; delta: number | null }) {
  const up = delta !== null && delta > 0
  const down = delta !== null && delta < 0
  return (
    <div className="rounded-xl bg-ink-950/4 border border-ink-950/8 px-3 py-2.5">
      <div className="text-[10px] font-semibold text-ink-950/45">{label}</div>
      <div className="text-lg font-bold text-ink-950 tabular-nums leading-tight mt-0.5">{value}</div>
      <div className={`text-[10px] tabular-nums ${up ? 'text-emerald-600' : down ? 'text-rose-600' : 'text-ink-950/35'}`}>{delta === null ? '어제 없음' : `어제 대비 ${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`}</div>
    </div>
  )
}

export function ManagerHome() {
  const ready = useManagerData()
  const { dataset, reload, openSheet, today } = useBellatrix()
  const { showRosterFor, setView } = useManagerState()

  const model = useMemo(() => {
    if (!ready) return null
    const { data } = ready
    const shifts = shiftsOn(data, today).sort((a, b) => a.start_at.localeCompare(b.start_at))
    const team = shifts
      .map((s) => {
        const u = data.users.find((x) => x.id === s.user_id && x.role === 'employee')
        const obsToday = data.evidence.filter((e) => e.user_id === s.user_id && e.evidence_source === 'manager_observation' && dateOf(e.observed_at) === today)
        return u ? { user: u, shift: s, obsToday } : null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
    const views = viewAssignments(data, data.assignments.filter((a) => a.assigned_date === today))
    const kpiToday = data.outcomes.find((o) => o.outcome_date === today && o.user_id === null) ?? null
    const kpiPrev = data.outcomes.filter((o) => o.user_id === null && o.outcome_date < today).sort((a, b) => b.outcome_date.localeCompare(a.outcome_date))[0] ?? null
    const pick = buildTeamProfiles(data, today).find((p) => p.priority > 0) ?? null
    return { team, views, kpiToday, kpiPrev, pick, store: ready.store }
  }, [ready, today])

  if (dataset.status === 'error') return <ErrorState message={dataset.message} onRetry={dataset.retryable ? reload : undefined} />
  if (!model || !ready) return <LoadingState />
  const { team, views, kpiToday, kpiPrev, pick, store } = model
  const completed = views.filter((v) => v.isDone).length

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="text-ink-950/40 text-xs">{fmtDateKo(today)} · {store.name}</div>
        <h1 className="text-2xl font-bold text-ink-950">오늘</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {ready.user.is_demo && <DemoBadge />}
          <Badge>
            <Lock size={10} /> 직원의 개인 목표·회고는 보이지 않아요
          </Badge>
        </div>
      </div>

      {/* 1. 오늘 근무 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>오늘 근무 · {team.length}명</SectionLabel>
          <button onClick={() => showRosterFor(null)} className="text-xs text-brand-700 font-medium -mt-2">
            근무표 편집
          </button>
        </div>
        <Card className="p-0 overflow-hidden">
          {team.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={<Users size={18} />} title="오늘 근무하는 직원이 없어요" body="근무표에서 오늘 근무를 넣으면 여기에 보여요." />
            </div>
          ) : (
            team.map(({ user, shift, obsToday }) => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3 border-b border-ink-950/6 last:border-0">
                <button onClick={() => openSheet({ kind: 'member', userId: user.id })} className="min-w-0 flex-1 text-left flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-brand-500/15 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">{user.name[0]}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink-950 truncate">{user.name}</span>
                    <span className="block text-[11px] text-ink-950/45 tabular-nums">
                      {fmtTimeHM(shift.start_at)}–{fmtTimeHM(shift.end_at)}
                      {obsToday.length > 0 ? ` · 오늘 관찰 ${obsToday.length}` : ''}
                    </span>
                  </span>
                </button>
                <button onClick={() => openSheet({ kind: 'observe', presetUserId: user.id })} className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-2 rounded-lg bg-brand-500/10 text-brand-700">
                  <Eye size={12} /> 관찰
                </button>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* 2. 오늘 KPI */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>오늘 KPI</SectionLabel>
          <button onClick={() => setView('kpi')} className="text-xs text-brand-700 font-medium -mt-2">
            주간 보기
          </button>
        </div>
        {kpiToday ? (
          <button onClick={() => openSheet({ kind: 'kpi' })} className="w-full text-left">
            <Card className="space-y-2 active:scale-[0.99] transition">
              <div className="grid grid-cols-3 gap-2">
                <KpiTile label="CVR" value={formatMetric('cvr', kpiToday.cvr)} delta={deltaPct(kpiToday.cvr, kpiPrev?.cvr ?? null)} />
                <KpiTile label="AOV" value={formatMetric('atv', kpiToday.atv)} delta={deltaPct(kpiToday.atv, kpiPrev?.atv ?? null)} />
                <KpiTile label="UPT" value={formatMetric('upt', kpiToday.upt)} delta={deltaPct(kpiToday.upt, kpiPrev?.upt ?? null)} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-ink-950/45">
                <span>
                  방문 {kpiToday.visitors ?? '—'} · 거래 {kpiToday.transactions ?? '—'} · 매출 {kpiToday.revenue === null ? '—' : `${Math.round(kpiToday.revenue / 10000).toLocaleString()}만`}
                </span>
                <span className="inline-flex items-center gap-1 text-brand-700 font-medium">
                  <Pencil size={11} /> 수정
                </span>
              </div>
            </Card>
          </button>
        ) : (
          <button onClick={() => openSheet({ kind: 'kpi' })} className="w-full text-left">
            <Card className="flex items-center gap-3 border-brand-200 bg-brand-50 active:scale-[0.99] transition">
              <div className="w-10 h-10 rounded-xl bg-brand-500 text-ink-950 flex items-center justify-center shrink-0">
                <BarChart3 size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-ink-950">오늘 성과 입력</div>
                <div className="text-[11px] text-ink-950/50">방문 · 거래 · 매출 · 수량 네 칸이면 CVR · AOV · UPT가 나와요{kpiPrev ? ` · 마지막 입력 ${kpiPrev.outcome_date.slice(5).replace('-', '.')}` : ''}</div>
              </div>
              <ChevronRight size={16} className="text-brand-600 shrink-0" />
            </Card>
          </button>
        )}
      </div>

      {/* 3. 오늘 코칭 한 사람 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>오늘 코칭 한 사람</SectionLabel>
          <button onClick={() => setView('team')} className="text-xs text-brand-700 font-medium -mt-2">
            팀 전체
          </button>
        </div>
        {pick ? (
          <Card className="space-y-3">
            <button onClick={() => openSheet({ kind: 'member', userId: pick.user.id })} className="w-full text-left flex items-start gap-3">
              <span className="w-10 h-10 rounded-full bg-amber-signal/20 text-amber-700 flex items-center justify-center text-sm font-bold shrink-0">{pick.user.name[0]}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink-950">{pick.user.name}</span>
                  {pick.workingToday && <Badge tone="brand">오늘 근무</Badge>}
                </span>
                <span className="block text-xs text-ink-950/60 mt-0.5 leading-relaxed">{pick.signals[0] ?? '최근 관찰 근거를 한 번 봐주세요'}</span>
              </span>
              <ChevronRight size={16} className="text-ink-950/25 shrink-0 mt-2" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => openSheet({ kind: 'member', userId: pick.user.id })} className="rounded-lg bg-brand-500 text-ink-950 text-xs font-semibold py-2.5 inline-flex items-center justify-center gap-1.5">
                <MessageCircleHeart size={13} /> 코칭 가이드 · 카드 보내기
              </button>
              <button onClick={() => openSheet({ kind: 'observe', presetUserId: pick.user.id })} className="rounded-lg bg-ink-950/6 text-ink-950/75 text-xs font-semibold py-2.5 inline-flex items-center justify-center gap-1.5">
                <Eye size={13} /> 지금 관찰
              </button>
            </div>
          </Card>
        ) : (
          <Card>
            <p className="text-xs text-ink-950/45">특별히 먼저 볼 사람이 없어요. 관찰이 쌓이면 여기서 한 명을 골라줘요.</p>
          </Card>
        )}
      </div>

      {/* 팀 액션 — one line */}
      <button onClick={() => openSheet({ kind: 'assign' })} className="w-full text-left">
        <Card className="flex items-center gap-3 active:scale-[0.99] transition">
          <div className="w-9 h-9 rounded-xl bg-ink-950/6 text-ink-950/60 flex items-center justify-center shrink-0">
            <ListPlus size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink-950/85">팀 액션 배정</div>
            <div className="text-[11px] text-ink-950/45">{views.length === 0 ? '오늘 배정한 액션이 없어요' : `오늘 ${completed}/${views.length} 완료`}</div>
          </div>
          <ChevronRight size={16} className="text-ink-950/25 shrink-0" />
        </Card>
      </button>
    </div>
  )
}
