import { useEffect, useMemo } from 'react'
import { Lightbulb, Info } from 'lucide-react'
import { useBellatrix, useManagerData } from '../../lib/bellatrixStore'
import { generateWeeklyInsights } from '../../lib/analytics/insights'
import { getStoreBehaviourTrend, getActionCompletionRate, getBehaviourObservationRate } from '../../lib/analytics/analytics'
import { BEHAVIOUR_LABEL } from '../../types/bellatrix'
import { Card, SectionLabel, Badge } from '../../components/ui'
import { ErrorState, LoadingState, StrengthBadge } from '../../components/bellatrix/shared'
import { DemoBadge } from '../../components/bellatrix/DemoBadge'
import { Lock } from 'lucide-react'
import { addDaysISO } from '../../lib/dates'

export function InsightsView() {
  const ready = useManagerData()
  const { dataset, reload, today, trackEvent } = useBellatrix()

  useEffect(() => {
    if (ready) trackEvent('insight_viewed')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!ready])

  const model = useMemo(() => {
    if (!ready) return null
    const { data } = ready
    const range = { from: addDaysISO(today, -21), to: today }
    return {
      insights: generateWeeklyInsights(data, today),
      trends: getStoreBehaviourTrend(data, today, 3),
      completion: getActionCompletionRate(data, { range }),
      observation: getBehaviourObservationRate(data, { range }),
      outcomeDays: data.outcomes.filter((o) => o.user_id === null).length,
    }
  }, [ready, today])

  if (dataset.status === 'error') return <ErrorState message={dataset.message} onRetry={dataset.retryable ? reload : undefined} />
  if (!model || !ready) return <LoadingState />
  const pct = (r: number | null) => (r === null ? '—' : `${Math.round(r * 100)}%`)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-ink-950 mb-1">주간 인사이트</h1>
        <p className="text-sm text-ink-950/45 leading-relaxed">규칙 기반 비교예요. 인과 AI가 아니라, 개입 → 행동 → 결과가 같은 방향으로 움직이는지 보는 초기 신호 탐지기예요. KPI 개선은 검증해야 할 가설이지 확인된 성과가 아니에요.</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {ready.user.is_demo && <DemoBadge label="데모 데이터 — 실제 성과가 아니에요" />}
          <Badge>
            <Lock size={10} /> 직원 개인 회고·목표는 포함되지 않아요
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card className="text-center">
          <div className="text-[10px] text-ink-950/40">액션 완료율 · 21일</div>
          <div className="text-xl font-bold text-ink-950 tabular-nums">{pct(model.completion.rate)}</div>
          <div className="text-[10px] text-ink-950/35">n={model.completion.denominator}</div>
        </Card>
        <Card className="text-center">
          <div className="text-[10px] text-ink-950/40">관찰됨 비율</div>
          <div className="text-xl font-bold text-ink-950 tabular-nums">{pct(model.observation.rate)}</div>
          <div className="text-[10px] text-ink-950/35">관찰 {model.observation.denominator}회</div>
        </Card>
        <Card className="text-center">
          <div className="text-[10px] text-ink-950/40">KPI 입력일</div>
          <div className="text-xl font-bold text-ink-950 tabular-nums">{model.outcomeDays}</div>
          <div className="text-[10px] text-ink-950/35">일</div>
        </Card>
      </div>

      <div>
        <SectionLabel>이번 주 인사이트</SectionLabel>
        <div className="space-y-3">
          {model.insights.length === 0 && (
            <Card>
              <p className="text-sm text-ink-950/50">아직 비교할 데이터가 부족해요. 액션 배정 · 관찰 · KPI 입력이 며칠 쌓이면 여기에 인사이트가 나타나요.</p>
            </Card>
          )}
          {model.insights.map((ins) => (
            <Card key={ins.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-ink-950 text-sm font-bold leading-snug">
                  <Lightbulb size={14} className="text-amber-500 shrink-0" /> {ins.title}
                </div>
                <StrengthBadge strength={ins.strength} />
              </div>
              <p className="text-sm text-ink-950/75 leading-relaxed">{ins.body}</p>
              <div className="text-[11px] text-ink-950/40">{ins.sampleNote}</div>
              {ins.caveat && (
                <div className="flex items-start gap-1.5 text-[11px] text-ink-950/45 bg-ink-950/4 rounded-lg px-2.5 py-2">
                  <Info size={12} className="shrink-0 mt-0.5" /> {ins.caveat}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>매장 행동 트렌드 · 3주</SectionLabel>
        <Card>
          {model.trends.map((t) => (
            <div key={t.behaviour} className="flex items-center justify-between py-2 border-b border-ink-950/6 last:border-0">
              <span className="text-sm text-ink-950/85">{BEHAVIOUR_LABEL[t.behaviour]}</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-ink-950/40 tabular-nums">{t.weekly.map((w) => w.completed + w.observed).join(' → ')}</span>
                <Badge tone={t.direction === 'up' ? 'emerald' : t.direction === 'down' ? 'amber' : 'default'}>
                  {t.direction === 'up' ? '↑' : t.direction === 'down' ? '↓' : t.direction === 'flat' ? '→' : '데이터 부족'}
                </Badge>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-ink-950/35 pt-2">완료된 액션 + 매니저 관찰됨 건수 합계 (주별)</p>
        </Card>
      </div>
    </div>
  )
}
