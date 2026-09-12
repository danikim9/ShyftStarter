// Rule-based weekly insight engine. NOT causal AI. Every statement carries an
// evidence-strength label and a correlation caveat. The output shape is stable
// so a statistical or LLM-backed engine can replace this file later.
import type { BehaviourType, ISODate, StoreDataset, TargetMetric } from '../../types/bellatrix'
import { BEHAVIOUR_LABEL, METRIC_SHORT } from '../../types/bellatrix'
import { addDaysISO } from '../dates'
import {
  compareMetricBetweenActionGroups,
  filterAssignments,
  filterEvidence,
  getPilotGroupObservation,
  getWeeklyCoMovement,
  type DateRange,
} from './analytics'
import { CAUSATION_CAVEAT, type EvidenceStrength } from './confidence'
import { formatMetric, formatPercentDelta } from './metrics'

export type InsightKind = 'action_outcome' | 'observation_outcome' | 'co_movement' | 'engagement' | 'pilot'

export interface Insight {
  id: string
  kind: InsightKind
  title: string
  body: string
  strength: EvidenceStrength
  sampleNote: string
  caveat: string | null
  behaviour: BehaviourType | null
  metric: TargetMetric | null
}

const BEHAVIOUR_METRIC: Partial<Record<BehaviourType, TargetMetric>> = {
  cross_sell: 'attach_rate',
  recommendation: 'atv',
  discovery: 'cvr',
  demo: 'cvr',
  closing: 'cvr',
}

export function generateWeeklyInsights(ds: StoreDataset, today: ISODate, lookbackDays = 21): Insight[] {
  const range: DateRange = { from: addDaysISO(today, -lookbackDays), to: addDaysISO(today, -1) }
  const out: Insight[] = []

  // 1) Days with completed action of behaviour X vs days without → KPI Y
  for (const [behaviour, metric] of Object.entries(BEHAVIOUR_METRIC) as [BehaviourType, TargetMetric][]) {
    const cmp = compareMetricBetweenActionGroups(ds, { behaviour, metric, groupBy: 'action_completed', range })
    if (cmp.withGroup.n === 0 && cmp.withoutGroup.n === 0) continue
    const bl = BEHAVIOUR_LABEL[behaviour]
    const ml = METRIC_SHORT[metric]
    const body =
      cmp.strength === 'insufficient'
        ? `${bl} 액션이 완료된 날과 아닌 날의 ${ml}를 비교하기엔 아직 표본이 부족해요.`
        : `${bl} 액션이 완료된 날의 평균 ${ml}는 ${formatMetric(metric, cmp.withGroup.mean)}, 완료되지 않은 날은 ${formatMetric(
            metric,
            cmp.withoutGroup.mean
          )}였어요 (${formatPercentDelta(cmp.withGroup.mean ?? 0, cmp.withoutGroup.mean ?? 0)}).`
    out.push({
      id: `ao_${behaviour}_${metric}`,
      kind: 'action_outcome',
      title: `${bl} 액션 완료 × ${ml}`,
      body,
      strength: cmp.strength,
      sampleNote: `완료된 날 ${cmp.withGroup.n}일 · 미완료 ${cmp.withoutGroup.n}일 · 최근 ${lookbackDays}일`,
      caveat: cmp.strength === 'insufficient' ? null : CAUSATION_CAVEAT,
      behaviour,
      metric,
    })
  }

  // 2) Manager-observed behaviour days vs not-observed days → KPI
  for (const behaviour of ['discovery', 'cross_sell', 'demo'] as BehaviourType[]) {
    const metric = BEHAVIOUR_METRIC[behaviour] ?? 'cvr'
    const cmp = compareMetricBetweenActionGroups(ds, { behaviour, metric, groupBy: 'behaviour_observed', range })
    if (cmp.withGroup.n === 0 && cmp.withoutGroup.n === 0) continue
    const bl = BEHAVIOUR_LABEL[behaviour]
    const ml = METRIC_SHORT[metric]
    out.push({
      id: `oo_${behaviour}`,
      kind: 'observation_outcome',
      title: `매니저 관찰: ${bl} × ${ml}`,
      body:
        cmp.strength === 'insufficient'
          ? `매니저가 ${bl} 행동을 관찰한 날이 아직 적어요. 관찰 샘플이 더 쌓이면 비교가 가능해요.`
          : `매니저가 ${bl} 행동을 "관찰함"으로 기록한 날의 평균 ${ml}는 ${formatMetric(metric, cmp.withGroup.mean)}, "관찰 안 됨"인 날은 ${formatMetric(
              metric,
              cmp.withoutGroup.mean
            )}였어요 (${formatPercentDelta(cmp.withGroup.mean ?? 0, cmp.withoutGroup.mean ?? 0)}). 관찰 근거라 자기 보고보다 신뢰도가 높아요.`,
      strength: cmp.strength,
      sampleNote: `관찰됨 ${cmp.withGroup.n}일 · 관찰 안 됨 ${cmp.withoutGroup.n}일`,
      caveat: cmp.strength === 'insufficient' ? null : CAUSATION_CAVEAT,
      behaviour,
      metric,
    })
  }

  // 3) Weekly co-movement for the store focus behaviour
  const focusMetric = ds.store?.focus_metric ?? 'cvr'
  const focusBehaviour = (Object.entries(BEHAVIOUR_METRIC).find(([, m]) => m === focusMetric)?.[0] ?? 'cross_sell') as BehaviourType
  const co = getWeeklyCoMovement(ds, focusBehaviour, focusMetric, today, 3)
  if (co.comparableWeeks > 0) {
    const strength: EvidenceStrength = co.comparableWeeks < 2 ? 'insufficient' : co.sameDirectionWeeks === co.comparableWeeks ? 'early_signal' : 'building'
    out.push({
      id: `co_${focusBehaviour}`,
      kind: 'co_movement',
      title: `${BEHAVIOUR_LABEL[focusBehaviour]} 완료 수 × ${METRIC_SHORT[focusMetric]} 주간 흐름`,
      body: `최근 ${co.comparableWeeks + 1}주 동안 ${BEHAVIOUR_LABEL[focusBehaviour]} 액션 완료 수와 ${METRIC_SHORT[focusMetric]}가 ${co.sameDirectionWeeks}/${
        co.comparableWeeks
      }번 같은 방향으로 움직였어요.`,
      strength,
      sampleNote: co.weeks.map((w) => `${w.week.slice(5)}주 ${w.completed}건 · ${formatMetric(focusMetric, w.metricMean)}`).join(' → '),
      caveat: CAUSATION_CAVEAT,
      behaviour: focusBehaviour,
      metric: focusMetric,
    })
  }

  // 4) Engagement: micro-coaching applied + helpfulness
  const coaching = filterAssignments(ds, { interventionType: 'micro_coaching', range: { from: addDaysISO(today, -7), to: today } })
  const applied = coaching.filter((a) => a.status === 'completed').length
  const selfReports = filterEvidence(ds, { range }).filter((e) => e.evidence_source === 'employee_self_report')
  const helpful = selfReports.filter((e) => e.helpfulness === 'very_helpful').length
  if (coaching.length > 0 || selfReports.length > 0) {
    out.push({
      id: 'engagement',
      kind: 'engagement',
      title: '코칭 참여도',
      body: `이번 주 마이크로 코칭 ${coaching.length}건 중 ${applied}건이 "적용함"으로 기록됐어요. 최근 ${lookbackDays}일 체크인 ${selfReports.length}건 중 ${helpful}건이 "많이 도움됨"이었어요.`,
      strength: 'descriptive',
      sampleNote: '본인 체크인은 자기 보고라 신뢰도 "낮음"으로 집계돼요.',
      caveat: null,
      behaviour: null,
      metric: null,
    })
  }

  // 5) Pilot group observation rates
  const pilot = getPilotGroupObservation(ds, focusBehaviour, range)
  if (pilot && (pilot.intervention.denominator > 0 || pilot.control.denominator > 0)) {
    const pct = (r: number | null) => (r === null ? '—' : `${Math.round(r * 100)}%`)
    const strength: EvidenceStrength =
      Math.min(pilot.intervention.denominator, pilot.control.denominator) < 3
        ? 'insufficient'
        : Math.min(pilot.intervention.denominator, pilot.control.denominator) < 6
          ? 'building'
          : 'early_signal'
    out.push({
      id: `pilot_${pilot.pilot.id}`,
      kind: 'pilot',
      title: `파일럿 "${pilot.pilot.name}"`,
      body: `개입 그룹에서 매니저가 ${BEHAVIOUR_LABEL[focusBehaviour]} 행동을 관찰한 비율은 ${pct(pilot.intervention.rate)}, 대조 그룹은 ${pct(pilot.control.rate)}였어요.`,
      strength,
      sampleNote: `개입 그룹 관찰 ${pilot.intervention.denominator}회 · 대조 그룹 ${pilot.control.denominator}회`,
      caveat: '그룹 간 차이는 행동 관찰 기준이며, KPI 차이를 직접 의미하지 않아요.',
      behaviour: focusBehaviour,
      metric: null,
    })
  }

  const order: Record<EvidenceStrength, number> = { correlation: 0, early_signal: 1, building: 2, descriptive: 3, insufficient: 4 }
  return out.sort((a, b) => order[a.strength] - order[b.strength])
}
