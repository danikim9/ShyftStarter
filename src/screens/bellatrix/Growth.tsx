import { useEffect, useMemo } from 'react'
import { TrendingUp, ArrowUpRight, ArrowRight, ArrowDownRight, Eye, UserCheck, Sparkles, CheckCircle2 } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../lib/bellatrixStore'
import { getEmployeeBehaviourTrend, getWeeklySummary, type TrendDirection } from '../../lib/analytics/analytics'
import { recommendNextShiftFocus } from '../../lib/analytics/recommendation'
import { BEHAVIOUR_LABEL, METRIC_SHORT } from '../../types/bellatrix'
import { Card, SectionLabel, Badge } from '../../components/ui'
import { ErrorState, LoadingState } from '../../components/bellatrix/shared'

const DIR: Record<TrendDirection, { icon: typeof ArrowRight; label: string; cls: string }> = {
  up: { icon: ArrowUpRight, label: '늘고 있어요', cls: 'text-emerald-600' },
  flat: { icon: ArrowRight, label: '유지 중', cls: 'text-ink-950/50' },
  down: { icon: ArrowDownRight, label: '줄었어요', cls: 'text-amber-600' },
  insufficient: { icon: ArrowRight, label: '데이터 부족', cls: 'text-ink-950/30' },
}

function Tile({ icon, value, label, sub }: { icon: React.ReactNode; value: number; label: string; sub: string }) {
  return (
    <div className="rounded-xl bg-ink-950/4 border border-ink-950/8 px-3 py-3 flex flex-col gap-1">
      <div className="text-brand-600">{icon}</div>
      <div className="text-xl font-bold text-ink-950 tabular-nums leading-none">{value}</div>
      <div className="text-[11px] text-ink-950/60 leading-tight">{label}</div>
      <div className="text-[10px] text-ink-950/35 leading-tight">{sub}</div>
    </div>
  )
}

export function Growth() {
  const ready = useReadyData()
  const { dataset, reload, today, trackEvent } = useBellatrix()

  useEffect(() => {
    if (ready) trackEvent('growth_viewed')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!ready])

  const model = useMemo(() => {
    if (!ready) return null
    const { data, user } = ready
    return {
      summary: getWeeklySummary(data, user.id, today),
      trends: getEmployeeBehaviourTrend(data, user.id, today, 3),
      rec: recommendNextShiftFocus({ dataset: data, userId: user.id, today }),
    }
  }, [ready, today])

  if (dataset.status === 'error') return <ErrorState message={dataset.message} onRetry={dataset.retryable ? reload : undefined} />
  if (!model) return <LoadingState />

  const { summary, trends, rec } = model
  const totalEvidence = trends.reduce((a, t) => a + t.total, 0)
  const stage = totalEvidence < 5 ? '아직 데이터가 부족해요' : totalEvidence < 15 ? '근거를 쌓는 중' : '초기 신호가 보여요'

  return (
    <div className="px-4 pt-4 pb-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-950 mb-1">Growth</h1>
        <p className="text-xs text-ink-950/40">점수가 아니라 근거예요. 내가 시도한 것과 매니저가 본 것을 그대로 보여줘요.</p>
      </div>

      <div>
        <SectionLabel>이번 주</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          <Tile icon={<CheckCircle2 size={16} />} value={summary.actionsCompleted} label="액션 완료" sub="참여 기록" />
          <Tile icon={<Sparkles size={16} />} value={summary.coachingApplied} label="코칭 적용" sub="본인 체크인" />
          <Tile icon={<UserCheck size={16} />} value={summary.managerObservations} label="매니저 관찰" sub={`${summary.observedBehaviours}회 관찰됨`} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>행동 트렌드 · 3주</SectionLabel>
          <Badge tone={totalEvidence < 5 ? 'default' : totalEvidence < 15 ? 'amber' : 'brand'}>{stage}</Badge>
        </div>
        <Card>
          {trends.map((t) => {
            const d = DIR[t.direction]
            const Icon = d.icon
            const max = Math.max(1, ...t.weekly.map((w) => w.completed + w.observed))
            return (
              <div key={t.behaviour} className="flex items-center gap-3 py-2.5 border-b border-ink-950/6 last:border-0">
                <div className="w-20 shrink-0 text-sm font-medium text-ink-950/85">{BEHAVIOUR_LABEL[t.behaviour]}</div>
                <div className="flex-1 flex items-end gap-1 h-7">
                  {t.weekly.map((w) => {
                    const v = w.completed + w.observed
                    return (
                      <div key={w.week} className="flex-1 flex flex-col justify-end h-full" title={`${w.week} 완료 ${w.completed} · 관찰 ${w.observed}`}>
                        <div className="w-full rounded-sm bg-brand-500/25 relative overflow-hidden" style={{ height: `${Math.max(8, (v / max) * 100)}%` }}>
                          <div className="absolute bottom-0 inset-x-0 bg-emerald-signal/70" style={{ height: v > 0 ? `${(w.observed / v) * 100}%` : 0 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className={`w-20 shrink-0 flex items-center justify-end gap-0.5 text-[11px] font-medium ${d.cls}`}>
                  <Icon size={13} /> {d.label}
                </div>
              </div>
            )
          })}
          <div className="flex items-center gap-3 pt-2 text-[10px] text-ink-950/40">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-brand-500/25" /> 액션 완료
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-emerald-signal/70" /> 매니저 관찰됨
            </span>
          </div>
        </Card>
      </div>

      {rec && (
        <div>
          <SectionLabel>다음 근무 추천</SectionLabel>
          <Card className="border-brand-200 bg-brand-50">
            <div className="flex items-center gap-1.5 text-brand-700 text-[11px] font-semibold mb-1">
              <TrendingUp size={12} /> {METRIC_SHORT[rec.focusMetric]} 포커스
            </div>
            <div className="text-base font-bold text-ink-950 leading-snug">{rec.headline}</div>
            <p className="text-xs text-ink-950/60 mt-1.5 leading-relaxed">{rec.reason}</p>
          </Card>
        </div>
      )}

      <Card className="flex items-start gap-2.5">
        <Eye size={14} className="text-ink-950/40 mt-0.5 shrink-0" />
        <p className="text-[11px] text-ink-950/50 leading-relaxed">
          "액션 완료"는 앱에 남긴 참여 기록이고, "관찰됨"은 매니저가 실제로 본 행동이에요. 두 가지를 구분해서 보여주는 이유는, 진짜 성장 근거를 만들기 위해서예요.
        </p>
      </Card>
    </div>
  )
}
