import { useMemo } from 'react'
import { BarChart3, Upload, Lock, Lightbulb } from 'lucide-react'
import { useBellatrix, useManagerData } from '../../lib/bellatrixStore'
import { formatMetric } from '../../lib/analytics/metrics'
import { deltaPct, lastNDays, weekComparison } from '../../lib/analytics/kpiSummary'
import { generateWeeklyInsights } from '../../lib/analytics/insights'
import { fmtShortDate } from '../../lib/dates'
import { Card, SectionLabel, Badge, PrimaryButton, SecondaryButton } from '../../components/ui'
import { ErrorState, LoadingState, StrengthBadge } from '../../components/bellatrix/shared'
import { DemoBadge } from '../../components/bellatrix/DemoBadge'
import { FEATURES } from '../../lib/features'
import { useManagerState } from '../../lib/managerStore'

// KPI = three numbers a store manager actually manages: CVR · AOV · UPT.
// Enter four raw totals a day; everything else is derived. Weekly view compares
// Mon–today against the same weekdays last week. Insights stay short and
// labelled — they are signals to check, not results.

function WeekTile({ label, cur, prev, fmt }: { label: string; cur: number | null; prev: number | null; fmt: (v: number | null) => string }) {
  const d = deltaPct(cur, prev)
  const up = d !== null && d > 0
  const down = d !== null && d < 0
  return (
    <Card className="text-center">
      <div className="text-[10px] font-semibold text-ink-950/45">{label}</div>
      <div className="text-xl font-bold text-ink-950 tabular-nums leading-tight mt-0.5">{fmt(cur)}</div>
      <div className={`text-[10px] tabular-nums mt-0.5 ${up ? 'text-emerald-600' : down ? 'text-rose-600' : 'text-ink-950/35'}`}>{d === null ? `지난주 ${fmt(prev)}` : `지난주 대비 ${d > 0 ? '+' : ''}${d.toFixed(1)}%`}</div>
    </Card>
  )
}

export function KpiView() {
  const ready = useManagerData()
  const { dataset, reload, openSheet, today } = useBellatrix()
  const { setView } = useManagerState()

  const model = useMemo(() => {
    if (!ready) return null
    const { data } = ready
    return {
      week: weekComparison(data, today),
      recent: lastNDays(data, today, 7),
      insights: generateWeeklyInsights(data, today).slice(0, 3),
    }
  }, [ready, today])

  if (dataset.status === 'error') return <ErrorState message={dataset.message} onRetry={dataset.retryable ? reload : undefined} />
  if (!model || !ready) return <LoadingState />
  const { week, recent, insights } = model
  const hasToday = recent.some((r) => r.outcome_date === today)
  const cvr = (v: number | null) => formatMetric('cvr', v)
  const aov = (v: number | null) => formatMetric('atv', v)
  const upt = (v: number | null) => formatMetric('upt', v)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-ink-950 mb-1">KPI</h1>
        <p className="text-sm text-ink-950/45">CVR · AOV · UPT. 하루 네 칸만 입력하면 돼요.</p>
        {ready.user.is_demo && (
          <div className="mt-2">
            <DemoBadge label="데모 데이터 — 샘플 KPI" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <PrimaryButton onClick={() => openSheet({ kind: 'kpi' })} className="flex items-center justify-center gap-1.5">
          <BarChart3 size={14} /> {hasToday ? '오늘 성과 수정' : '오늘 성과 입력'}
        </PrimaryButton>
        <SecondaryButton onClick={() => openSheet({ kind: 'csvImport' })} className="flex items-center justify-center gap-1.5 !px-3" aria-label="CSV 가져오기">
          <Upload size={14} /> CSV
        </SecondaryButton>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>이번 주 vs 지난주</SectionLabel>
          <span className="text-[10px] text-ink-950/35 -mt-2 tabular-nums">
            {week.thisWeek.days}일 입력 · 지난주 같은 요일 {week.lastWeek.days}일
          </span>
        </div>
        {week.thisWeek.days === 0 ? (
          <Card>
            <p className="text-xs text-ink-950/45">이번 주 입력이 아직 없어요. 오늘 성과를 넣으면 지난주와 바로 비교돼요.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <WeekTile label="CVR" cur={week.thisWeek.cvr} prev={week.lastWeek.cvr} fmt={cvr} />
            <WeekTile label="AOV" cur={week.thisWeek.aov} prev={week.lastWeek.aov} fmt={aov} />
            <WeekTile label="UPT" cur={week.thisWeek.upt} prev={week.lastWeek.upt} fmt={upt} />
          </div>
        )}
      </div>

      <div>
        <SectionLabel>최근 7일</SectionLabel>
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-ink-950/4 text-ink-950/50">
              <tr>
                {['날짜', 'CVR', 'AOV', 'UPT'].map((h) => (
                  <th key={h} className={`px-3 py-2 font-semibold whitespace-nowrap ${h === '날짜' ? 'text-left' : 'text-right'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-ink-950/35">
                    아직 입력된 KPI가 없어요.
                  </td>
                </tr>
              )}
              {recent.map((o) => (
                <tr key={o.id} className="border-t border-ink-950/6 tabular-nums">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button onClick={() => openSheet({ kind: 'kpi', presetDate: o.outcome_date })} className="text-brand-700 font-medium">
                      {o.outcome_date === today ? '오늘' : fmtShortDate(o.outcome_date)}
                    </button>
                    {o.source === 'csv' && <span className="ml-1 text-[10px] text-ink-950/35">csv</span>}
                  </td>
                  <td className="px-3 py-2 text-right">{cvr(o.cvr)}</td>
                  <td className="px-3 py-2 text-right">{aov(o.atv)}</td>
                  <td className="px-3 py-2 text-right">{upt(o.upt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="text-[10px] text-ink-950/35 mt-1.5">CVR = 거래 ÷ 방문 · AOV = 매출 ÷ 거래 · UPT = 수량 ÷ 거래. 날짜를 누르면 수정할 수 있어요.</p>
      </div>

      {insights.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>이번 주 신호</SectionLabel>
            {FEATURES.managerInsights && (
              <button onClick={() => setView('insights')} className="text-xs text-brand-700 font-medium -mt-2">
                전체 보기
              </button>
            )}
          </div>
          <Card className="p-0 overflow-hidden">
            {insights.map((i) => (
              <div key={i.id} className="px-4 py-3 border-b border-ink-950/6 last:border-0">
                <div className="flex items-start gap-2">
                  <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ink-950/90 leading-snug">{i.title}</div>
                    <div className="text-xs text-ink-950/60 mt-0.5 leading-relaxed">{i.body}</div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <StrengthBadge strength={i.strength} />
                      <span className="text-[10px] text-ink-950/35">{i.sampleNote}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Card>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge>
              <Lock size={10} /> 직원 개인 회고·목표는 포함되지 않아요
            </Badge>
            <span className="text-[10px] text-ink-950/35">상관관계는 인과관계를 증명하지 않아요 · 규칙 기반 신호</span>
          </div>
        </div>
      )}
    </div>
  )
}
