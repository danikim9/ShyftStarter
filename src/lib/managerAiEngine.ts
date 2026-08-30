// ---------------------------------------------------------------------------
// Manager-side mock AI — Will × Capability classification, 1:1 coaching guide
// generation, and quest-suggestion prefill. Same rule-based-mock philosophy
// as src/lib/aiEngine.ts (employee side): swap for a real Claude API call
// later without touching the screens that consume these functions.
// ---------------------------------------------------------------------------

import type { CoachingGuideStep, ManagerQuestDraft, TeamMember, WillCapabilityQuadrant } from '../types'
import { SKILLS } from '../data/skills'
import { COACHING_CONVERSATION_TEMPLATE } from '../data/coachingContent'

export function computeQuadrant(
  willScore: number,
  capabilityScore: number,
  willThreshold = 65,
  capabilityThreshold = 65
): WillCapabilityQuadrant {
  const highWill = willScore >= willThreshold
  const highCap = capabilityScore >= capabilityThreshold
  if (highWill && highCap) return 'star'
  if (highWill && !highCap) return 'grower'
  if (!highWill && highCap) return 'disengaged'
  return 'atRisk'
}

export function lowestSkill(member: TeamMember) {
  return [...member.skills].sort((a, b) => a.score - b.score)[0]
}

export function strongestSkill(member: TeamMember) {
  return [...member.skills].sort((a, b) => b.score - a.score)[0]
}

/**
 * Layer D-equivalent: turn the generic 5-step coaching conversation template
 * into a concrete, employee-specific guide using this member's actual data.
 */
export function generateCoachingGuide(member: TeamMember): CoachingGuideStep[] {
  const gap = lowestSkill(member)
  const strong = strongestSkill(member)
  const gapMeta = SKILLS[gap.skillId]
  const strongMeta = SKILLS[strong.skillId]

  return COACHING_CONVERSATION_TEMPLATE.map((step): CoachingGuideStep => {
    if (step.step.startsWith('1.')) {
      return { step: step.step, prompt: `"${strongMeta.nameKo}에서 요즘 정말 좋아지고 있어요" — 최근 강점(${strong.score}점)을 구체적으로 먼저 언급하며 시작하세요.` }
    }
    if (step.step.startsWith('2.')) {
      return { step: step.step, prompt: `${member.signal}. 판단 없이 이 관찰 데이터를 있는 그대로 공유하세요.` }
    }
    if (step.step.startsWith('3.')) {
      return { step: step.step, prompt: `"요즘 ${gapMeta.nameKo} 관련해서 어떻게 느끼고 있어요?" — 본인의 생각을 먼저 물어보세요.` }
    }
    if (step.step.startsWith('4.')) {
      return { step: step.step, prompt: `다음 시프트에 ${gapMeta.nameKo} 킬러 스크립트를 1번 이상 시도해보는 것으로 합의해보세요.` }
    }
    return { step: step.step, prompt: `"${member.name}님 하는 거 보면 잘 될 거라고 믿어요" — 믿고 있다는 메시지로 마무리하세요.` }
  })
}

export function suggestQuestDraft(member: TeamMember): ManagerQuestDraft {
  const gap = lowestSkill(member)
  const gapMeta = SKILLS[gap.skillId]
  const today = new Date()
  const end = new Date(today)
  end.setDate(end.getDate() + 7)
  const fmt = (d: Date) => `${d.getMonth() + 1}.${d.getDate()}`

  return {
    name: `${gapMeta.nameKo} 집중 개선`,
    behavior: `자격을 갖춘 고객 응대에서 ${gapMeta.nameKo} 관련 행동을 시도하고 결과를 기록하세요.`,
    assignTo: member.name,
    startDate: fmt(today),
    endDate: fmt(end),
    difficulty: 2,
    rewardXp: 60,
    kpiConnection: gap.skillId === 'closing' || gap.skillId === 'crossSell' ? 'ATV / 객단가' : 'CVR / 전환율',
    aiPersonalization: true,
  }
}
