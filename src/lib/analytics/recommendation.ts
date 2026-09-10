// Next-shift recommendation. V1 is rule-based; the RecommendationEngine
// interface is the seam for an AI engine later (same input, same output).
import type { Action, BehaviourType, ISODate, StoreDataset, TargetMetric } from '../../types/bellatrix'
import { BEHAVIOUR_LABEL, METRIC_SHORT } from '../../types/bellatrix'
import { addDaysISO } from '../dates'
import { getActionCompletionRate, getBehaviourObservationRate } from './analytics'

export interface Recommendation {
  action: Action
  focusMetric: TargetMetric
  headline: string
  reason: string
  /** Rule id that fired — useful for later A/B analysis of recommendation logic. */
  rule: string
}

export interface RecommendationContext {
  dataset: StoreDataset
  userId: string
  today: ISODate
}

export interface RecommendationEngine {
  recommend(ctx: RecommendationContext): Recommendation | null
}

const METRIC_TO_BEHAVIOURS: Record<TargetMetric, BehaviourType[]> = {
  attach_rate: ['cross_sell'],
  atv: ['recommendation', 'cross_sell'],
  upt: ['cross_sell', 'recommendation'],
  cvr: ['discovery', 'demo', 'closing'],
  revenue: ['closing', 'recommendation'],
  none: ['discovery'],
}

export const ruleBasedEngine: RecommendationEngine = {
  recommend({ dataset: ds, userId, today }) {
    const range = { from: addDaysISO(today, -14), to: today }
    const focus = ds.store.focus_metric
    const candidates = METRIC_TO_BEHAVIOURS[focus]

    const scored = candidates.map((b) => {
      const completion = getActionCompletionRate(ds, { userId, behaviourType: b, range })
      const observation = getBehaviourObservationRate(ds, { userId, behaviourType: b, range })
      // Lower score = bigger gap = higher priority. Unknown rates count as a gap.
      const score = (completion.rate ?? 0) * 0.6 + (observation.rate ?? 0) * 0.4
      return { b, completion, observation, score }
    })
    scored.sort((x, y) => x.score - y.score)
    const gap = scored[0]
    if (!gap) return null

    const action =
      ds.actions.find((a) => a.behaviour_type === gap.b && a.intervention_type === 'micro_coaching') ??
      ds.actions.find((a) => a.behaviour_type === gap.b && a.intervention_type === 'action')
    if (!action) return null

    const strengths = (['demo', 'discovery', 'recommendation', 'cross_sell', 'closing'] as BehaviourType[])
      .filter((b) => b !== gap.b)
      .map((b) => ({ b, r: getActionCompletionRate(ds, { userId, behaviourType: b, range }) }))
      .filter((x) => x.r.denominator >= 2 && (x.r.rate ?? 0) >= 0.6)
      .sort((x, y) => (y.r.rate ?? 0) - (x.r.rate ?? 0))
    const strong = strengths[0]

    const pct = (r: number | null) => (r === null ? '기록 없음' : `${Math.round(r * 100)}%`)
    const reason = strong
      ? `${BEHAVIOUR_LABEL[strong.b]} 액션 완료율은 ${pct(strong.r.rate)}로 이미 좋아요. 반면 ${BEHAVIOUR_LABEL[gap.b]}는 완료율 ${pct(
          gap.completion.rate
        )}, 매니저 관찰률 ${pct(gap.observation.rate)}이고, 매장의 이번 포커스 지표가 ${METRIC_SHORT[focus]}라 여기에 집중하면 효과가 클 거예요.`
      : `${BEHAVIOUR_LABEL[gap.b]} 완료율 ${pct(gap.completion.rate)} · 관찰률 ${pct(gap.observation.rate)}. 매장 포커스 지표(${METRIC_SHORT[focus]})와 가장 직접 연결된 행동이에요.`

    return {
      action,
      focusMetric: focus,
      headline: action.intervention_type === 'micro_coaching' ? action.description : action.title,
      reason,
      rule: `gap_vs_focus_metric:${focus}:${gap.b}`,
    }
  },
}

export function recommendNextShiftFocus(ctx: RecommendationContext, engine: RecommendationEngine = ruleBasedEngine): Recommendation | null {
  return engine.recommend(ctx)
}
