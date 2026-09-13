// Manager-side team profiles built ONLY from manager-visible evidence:
// manager observations, team-action execution, aggregated quiz answers.
// Personal goals, reflections and private practice never reach this file
// (applyVisibility strips them before the dataset arrives).
import type { BehaviourEvidence, BehaviourType, CoachingCard, ISODate, StoreDataset, User } from '../../types/bellatrix'
import { BEHAVIOUR_LABEL } from '../../types/bellatrix'
import { COACHING_CONVERSATION_TEMPLATE } from '../../data/coachingContent'
import { addDaysISO, dateOf, daysBetween } from '../dates'
import { getActionCompletionRate, getBehaviourObservationRate, getEmployeeBehaviourTrend, type RateResult, type TrendDirection } from './analytics'
import { recommendNextShiftFocus, type Recommendation } from './recommendation'
import { todayShiftFor } from '../selectors'

export const COACHED_BEHAVIOURS: BehaviourType[] = ['discovery', 'demo', 'recommendation', 'cross_sell', 'closing']

export interface BehaviourEvidenceSummary {
  behaviour: BehaviourType
  observation: RateResult // manager observed / checked, last 21 days
  completion: RateResult // team actions completed / assigned, last 21 days
  trend: TrendDirection
  lastObservedAt: ISODate | null
  /** 'strong' | 'gap' | 'unknown' — never a score */
  reading: 'strong' | 'gap' | 'unknown'
}

export interface TeamMemberProfile {
  user: User
  workingToday: boolean
  behaviours: BehaviourEvidenceSummary[]
  strongest: BehaviourType | null
  gap: BehaviourType | null
  /** Short, data-derived signals. Empty when there is nothing notable. */
  signals: string[]
  /** Observations in the last 14 days where the manager flagged coaching needed. */
  coachingFlags: number
  lastObservation: BehaviourEvidence | null
  observationsLast14: number
  recommendation: Recommendation | null
  /** How urgently this person deserves a manager's attention (sort key, not shown as a score). */
  priority: number
}

function readingOf(observation: RateResult, completion: RateResult): BehaviourEvidenceSummary['reading'] {
  const n = observation.denominator + completion.denominator
  if (n < 2) return 'unknown'
  const obs = observation.rate
  const cmp = completion.rate
  const best = obs !== null ? obs : (cmp ?? 0)
  const worst = obs !== null && cmp !== null ? Math.min(obs, cmp) : best
  if (worst <= 0.4) return 'gap'
  if (best >= 0.7) return 'strong'
  return 'unknown'
}

export function buildTeamMemberProfile(ds: StoreDataset, user: User, today: ISODate): TeamMemberProfile {
  const range = { from: addDaysISO(today, -21), to: today }
  const trends = getEmployeeBehaviourTrend(ds, user.id, today, 3)
  const myObs = ds.evidence.filter((e) => e.user_id === user.id && e.evidence_source === 'manager_observation')

  const behaviours: BehaviourEvidenceSummary[] = COACHED_BEHAVIOURS.map((b) => {
    const observation = getBehaviourObservationRate(ds, { userId: user.id, behaviourType: b, range })
    const completion = getActionCompletionRate(ds, { userId: user.id, behaviourType: b, range })
    const last = myObs.filter((e) => e.behaviour_type === b && e.evidence_value === 'observed').sort((a, c) => c.observed_at.localeCompare(a.observed_at))[0]
    return {
      behaviour: b,
      observation,
      completion,
      trend: trends.find((t) => t.behaviour === b)?.direction ?? 'insufficient',
      lastObservedAt: last ? dateOf(last.observed_at) : null,
      reading: readingOf(observation, completion),
    }
  })

  const known = behaviours.filter((x) => x.reading !== 'unknown')
  const score = (x: BehaviourEvidenceSummary) => (x.observation.rate ?? x.completion.rate ?? 0) * 0.6 + (x.completion.rate ?? x.observation.rate ?? 0) * 0.4
  const strongest = known.filter((x) => x.reading === 'strong').sort((a, b) => score(b) - score(a))[0]?.behaviour ?? null
  const gap = known.filter((x) => x.reading === 'gap').sort((a, b) => score(a) - score(b))[0]?.behaviour ?? null

  const recent14 = myObs.filter((e) => daysBetween(dateOf(e.observed_at), today) <= 14)
  const coachingFlags = recent14.filter((e) => e.coaching_needed === true).length
  const lastObservation = myObs.sort((a, b) => b.observed_at.localeCompare(a.observed_at))[0] ?? null
  const daysSinceObs = lastObservation ? daysBetween(dateOf(lastObservation.observed_at), today) : null

  const signals: string[] = []
  if (gap) {
    const g = behaviours.find((x) => x.behaviour === gap)!
    if (g.observation.denominator > 0) signals.push(`${BEHAVIOUR_LABEL[gap]} — 관찰 ${g.observation.denominator}회 중 ${g.observation.numerator}회만 보였어요`)
    else if (g.completion.denominator > 0) signals.push(`${BEHAVIOUR_LABEL[gap]} — 팀 액션 ${g.completion.denominator}개 중 ${g.completion.numerator}개 완료`)
  }
  if (strongest) signals.push(`${BEHAVIOUR_LABEL[strongest]}은 꾸준히 보여요`)
  if (coachingFlags > 0) signals.push(`최근 2주 관찰에서 코칭 필요 ${coachingFlags}회 표시`)
  if (daysSinceObs === null) signals.push('아직 관찰 기록이 없어요 — 오늘 한 번 봐주세요')
  else if (daysSinceObs >= 7) signals.push(`마지막 관찰 ${daysSinceObs}일 전`)

  const priority = (coachingFlags > 0 ? 3 : 0) + (gap ? 2 : 0) + (daysSinceObs === null || daysSinceObs >= 7 ? 1 : 0)

  return {
    user,
    workingToday: !!todayShiftFor(ds, user.id, today),
    behaviours,
    strongest,
    gap,
    signals,
    coachingFlags,
    lastObservation,
    observationsLast14: recent14.length,
    recommendation: recommendNextShiftFocus({ dataset: ds, userId: user.id, today }),
    priority,
  }
}

export function buildTeamProfiles(ds: StoreDataset, today: ISODate): TeamMemberProfile[] {
  return ds.users
    .filter((u) => u.role === 'employee')
    .map((u) => buildTeamMemberProfile(ds, u, today))
    .sort((a, b) => b.priority - a.priority || Number(b.workingToday) - Number(a.workingToday) || a.user.name.localeCompare(b.user.name))
}

export interface CoachingGuideStep {
  step: string
  prompt: string
}

/** 5-step, data-first, non-judgmental 1:1 guide filled with this person's evidence. */
export function buildCoachingGuide(p: TeamMemberProfile, card: CoachingCard | null): CoachingGuideStep[] {
  const first = p.user.name.split(' ')[0]
  const gapLabel = p.gap ? BEHAVIOUR_LABEL[p.gap] : p.recommendation ? BEHAVIOUR_LABEL[p.recommendation.behaviour] : null
  const gapRow = p.gap ? p.behaviours.find((x) => x.behaviour === p.gap) : null
  return COACHING_CONVERSATION_TEMPLATE.map((t) => {
    if (t.step.startsWith('1.')) {
      return { step: t.step, prompt: p.strongest ? `"${BEHAVIOUR_LABEL[p.strongest]} 할 때 보면 정말 자연스러워요" — 최근 관찰에서 실제로 본 장면 하나를 구체적으로 먼저 말하세요.` : `최근 근무에서 잘한 장면 하나를 먼저 말하세요. 관찰 기록이 없다면 오늘 한 번 보고 나서 대화를 시작하는 게 좋아요.` }
    }
    if (t.step.startsWith('2.')) {
      const data = gapRow
        ? gapRow.observation.denominator > 0
          ? `최근 3주 ${gapLabel} 관찰 ${gapRow.observation.denominator}회 중 ${gapRow.observation.numerator}회 보였어요`
          : `최근 3주 ${gapLabel} 팀 액션 ${gapRow.completion.denominator}개 중 ${gapRow.completion.numerator}개 완료했어요`
        : '아직 비교할 데이터가 적어요'
      return { step: t.step, prompt: `${data}. 판단 없이 숫자만 있는 그대로 공유하세요. (개인 회고·목표는 본인만 보는 기록이라 여기 없어요.)` }
    }
    if (t.step.startsWith('3.')) {
      return { step: t.step, prompt: gapLabel ? `"요즘 ${gapLabel} 할 때 어떤 게 제일 어렵게 느껴져요?" — 본인의 생각을 먼저 들으세요.` : `"요즘 응대에서 제일 신경 쓰이는 게 뭐예요?" — 본인의 생각을 먼저 들으세요.` }
    }
    if (t.step.startsWith('4.')) {
      return { step: t.step, prompt: card ? `다음 근무에 딱 하나만: "${card.headline}". 아래 '코칭 카드 보내기'를 누르면 ${first}님의 Shift Prep에 이 카드가 올라가요.` : `다음 근무에 시도할 행동 하나를 함께 정하세요.` }
    }
    return { step: t.step, prompt: `"${first}님 하는 거 보면 잘 될 거라고 믿어요" — 믿고 있다는 메시지로 마무리하세요. 다음 관찰 때 그 행동을 봐주면 근거가 됩니다.` }
  })
}
