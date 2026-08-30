// ---------------------------------------------------------------------------
// Mock AI Engine — rule-based stand-in for the real 6-layer AI architecture
// described in Shyftstarter_CTO.pdf (p.23):
//   A. Context Engine        B. Performance Engine     C. Recommendation Engine
//   D. Content Generation    E. Feedback Engine        F. Learning Engine
//
// Every function here returns the same *shape* a real LLM call would return
// (see the Structured JSON pattern on p.23), so swapping this file for a real
// Claude API call later requires no changes to the screens that consume it.
// ---------------------------------------------------------------------------

import type { CoachingCard, Employee, EmployeeSkillScore, Quest, RolePlayResult, SkillId } from '../types'
import { SKILLS } from '../data/skills'
import { LEARNING_MODULES } from '../data/learningContent'

// Layer B input — how much each skill matters to revenue outcomes today.
// (In production this comes from Business Priority + KPI correlation data.)
const BUSINESS_IMPACT_WEIGHT: Record<SkillId, number> = {
  closing: 1.4,
  crossSell: 1.3,
  discovery: 1.1,
  productKnowledge: 1.0,
  communication: 0.9,
  empathy: 0.9,
  storytelling: 0.7,
  coachability: 0.6,
}

/**
 * Layer B (Performance Engine) + Layer C (Recommendation Engine), simplified.
 * Picks the skill with the largest (gap × business impact) — i.e. the
 * weakest stat that also moves the needle most on revenue.
 */
export function pickFocusSkill(skills: EmployeeSkillScore[]): SkillId {
  let best = skills[0]
  let bestValue = -Infinity
  for (const s of skills) {
    const gap = 100 - s.score
    const value = gap * BUSINESS_IMPACT_WEIGHT[s.skillId]
    if (value > bestValue) {
      bestValue = value
      best = s
    }
  }
  return best.skillId
}

const TIP_BANK: Record<SkillId, string[]> = {
  closing: [
    '가격보다 가치를 먼저 확인시켜준 다음, 두 가지 선택지 중 하나를 고르게 하는 질문으로 마무리해보세요.',
    '침묵을 두려워하지 마세요 — 클로징 질문 후 3초는 기다려주세요.',
  ],
  crossSell: ['방금 추천한 제품과 "함께 쓰면 더 좋은" 이유를 한 문장으로 붙여보세요.'],
  discovery: ['첫 질문은 항상 열린 질문으로 — "어떤"으로 시작해보세요.'],
  productKnowledge: ['오늘 매장에 있는 신제품 차별점 3가지를 먼저 스스로 말해보세요.'],
  communication: ['첫 10초 인사에 고객의 이름이나 상황을 한 번 언급해보세요.'],
  empathy: ['고객의 말을 한 번 더 요약해서 되짚어주는 것만으로도 신뢰가 올라가요.'],
  storytelling: ['스펙보다 "이 제품을 쓰면 하루가 어떻게 달라지는지"를 이야기해보세요.'],
  coachability: ['오늘 받은 피드백 하나를 다음 응대에 바로 적용해보세요.'],
}

/** Layer D (Content Generation) — AI Nudge, a short mid-shift suggestion. */
export function generateAiNudge(skills: EmployeeSkillScore[]) {
  const skillId = pickFocusSkill(skills)
  const skill = SKILLS[skillId]
  const score = skills.find((s) => s.skillId === skillId)!.score
  const tip = TIP_BANK[skillId][0]
  return {
    skillId,
    message: `오늘 가장 큰 기회는 ${skill.nameKo}이에요 (현재 ${score}점). ${tip}`,
  }
}

/** Layer D — AI Coach card. WHAT happened → WHY it matters → WHAT to do NEXT. */
export function generateCoachingCard(employee: Employee): CoachingCard {
  const focusSkillId = pickFocusSkill(employee.skills)
  const focus = employee.skills.find((s) => s.skillId === focusSkillId)!
  const focusMeta = SKILLS[focusSkillId]

  const strongest = [...employee.skills].sort((a, b) => b.score - a.score)[0]
  const strongestMeta = SKILLS[strongest.skillId]

  const recentDelta = focus.history.length >= 2
    ? focus.history[focus.history.length - 1].score - focus.history[focus.history.length - 2].score
    : 0

  const what = recentDelta >= 0
    ? `${focusMeta.nameKo} 점수가 최근 ${focus.history.length}개 시프트 동안 ${focus.history[0].score} → ${focus.score}점으로 올랐어요. 하지만 여전히 ${employee.name}님의 스탯 중 가장 낮아요.`
    : `${focusMeta.nameKo} 점수가 최근 시프트에서 ${Math.abs(recentDelta)}점 하락했어요.`

  const why = `${strongestMeta.nameKo}은 이미 강점이에요 (${strongest.score}점, 신뢰도 ${Math.round(strongest.confidence * 100)}%). 반면 ${focusMeta.nameKo}은 매출(ATV)에 가장 직접적으로 연결되는 역량인데 아직 상대적으로 약해요 — 추천에서 구매 완료로 넘어가는 마지막 단계에서 이탈이 생기는 것으로 추정돼요.`

  const tip = TIP_BANK[focusSkillId][0]

  return {
    id: `cc_${focusSkillId}_${Date.now()}`,
    skillId: focusSkillId,
    what,
    why,
    nextAction: {
      type: 'PRACTICE',
      label: `${focusMeta.nameKo} 시나리오 3분 연습하기 — ${tip}`,
      durationMin: 3,
    },
    generatedAt: new Date().toISOString(),
  }
}

export interface NextBestAction {
  type: 'PRACTICE' | 'REPEAT' | 'LEARN' | 'ASK' | 'SELL'
  label: string
  questId?: string
}

/** Layer C (Recommendation Engine) — "what should this employee do right now?" */
export function getNextBestAction(employee: Employee, quests: Quest[]): NextBestAction {
  const active = quests.filter((q) => q.status === 'active')
  const nearlyDone = active
    .filter((q) => q.progress / q.target >= 0.6)
    .sort((a, b) => b.progress / b.target - a.progress / a.target)[0]

  if (nearlyDone) {
    return {
      type: 'REPEAT',
      label: `"${nearlyDone.title}" 퀘스트 마무리하기 (${nearlyDone.progress}/${nearlyDone.target})`,
      questId: nearlyDone.id,
    }
  }

  const focusSkillId = pickFocusSkill(employee.skills)
  const focusQuest = active.find((q) => q.skillId === focusSkillId)
  if (focusQuest) {
    return {
      type: 'PRACTICE',
      label: `"${focusQuest.title}" 퀘스트 진행하기`,
      questId: focusQuest.id,
    }
  }

  return { type: 'LEARN', label: '3분 마이크로 러닝으로 오늘의 약점 보완하기' }
}

/** Layer C+D — P1 Microlearning: recommend one module based on the current skill gap. */
export function recommendLearningModule(employee: Employee) {
  const skillId = pickFocusSkill(employee.skills)
  return LEARNING_MODULES[skillId]
}

// ---------------------------------------------------------------------------
// P1 — AI Role-play scoring (text-based, rule-based mock).
// A real implementation would send the transcript to an LLM grader; this
// keyword/length heuristic returns the same RolePlayResult shape so the
// Role-play screen never has to change when it's swapped in.
// ---------------------------------------------------------------------------

const AXIS_KEYWORDS = {
  empathy: ['이해', '느끼', '불편', '죄송', '감사', '그러셨', '공감'],
  structure: ['?', '요?', '까요'],
  valueComm: ['가치', '도움', '편해', '좋아', '추천', '만족'],
  objection: ['그런데', '대신', '다만', '혹시', '대안', '비슷하게'],
  closing: ['오늘', '지금', '바로', '결정', '준비', '어느 쪽'],
} as const

function axisScore(text: string, keywords: readonly string[], seed: number) {
  const hit = keywords.some((k) => text.includes(k))
  const lengthBonus = Math.min(text.trim().length / 6, 20)
  const variance = (seed % 7) - 3
  return Math.max(35, Math.min(97, Math.round(52 + (hit ? 26 : 0) + lengthBonus + variance)))
}

const AXIS_TIP: Record<keyof RolePlayResult['axes'], string> = {
  empathy: '고객의 감정을 먼저 짚어주는 한 문장을 추가해보세요. (예: "그러셨겠어요")',
  structure: '열린 질문으로 마무리해서 고객이 계속 말할 수 있게 해보세요.',
  valueComm: '스펙보다 "이게 왜 도움이 되는지"를 한 문장 더 붙여보세요.',
  objection: '반박하지 말고, 먼저 인정한 뒤 대안을 제시해보세요.',
  closing: '다음 행동을 구체적으로 제안해보세요. (예: "지금 바로 준비해드릴게요")',
}

export function scoreRolePlayResponse(text: string): RolePlayResult {
  const trimmed = text.trim()
  const seed = trimmed.length + trimmed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)

  const axes = {
    empathy: axisScore(trimmed, AXIS_KEYWORDS.empathy, seed),
    structure: axisScore(trimmed, AXIS_KEYWORDS.structure, seed + 1),
    valueComm: axisScore(trimmed, AXIS_KEYWORDS.valueComm, seed + 2),
    objection: axisScore(trimmed, AXIS_KEYWORDS.objection, seed + 3),
    closing: axisScore(trimmed, AXIS_KEYWORDS.closing, seed + 4),
  }

  const overall = Math.round((axes.empathy + axes.structure + axes.valueComm + axes.objection + axes.closing) / 5)
  const lowestAxis = (Object.keys(axes) as (keyof typeof axes)[]).sort((a, b) => axes[a] - axes[b])[0]

  return { overall, axes, tip: AXIS_TIP[lowestAxis] }
}
