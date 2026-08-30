import type { Skill, SkillId } from '../types'

export const SKILLS: Record<SkillId, Skill> = {
  discovery: {
    id: 'discovery',
    nameKo: '니즈 파악',
    nameEn: 'Discovery',
    category: 'core',
    description: '개방형 질문으로 고객이 진짜 원하는 것을 발견하는 역량',
  },
  empathy: {
    id: 'empathy',
    nameKo: '공감',
    nameEn: 'Empathy',
    category: 'core',
    description: '고객의 상황과 감정에 진심으로 공감하며 신뢰를 쌓는 역량',
  },
  productKnowledge: {
    id: 'productKnowledge',
    nameKo: '제품 지식',
    nameEn: 'Product Knowledge',
    category: 'core',
    description: '제품·서비스의 핵심 차별점을 정확히 설명하는 역량',
  },
  communication: {
    id: 'communication',
    nameKo: '커뮤니케이션',
    nameEn: 'Communication',
    category: 'core',
    description: '명확하고 자연스럽게 정보를 전달하는 역량',
  },
  storytelling: {
    id: 'storytelling',
    nameKo: '스토리텔링',
    nameEn: 'Storytelling',
    category: 'growth',
    description: '제품 가치를 고객의 삶에 연결해 이야기로 전달하는 역량',
  },
  crossSell: {
    id: 'crossSell',
    nameKo: '크로스셀',
    nameEn: 'Cross-Sell',
    category: 'growth',
    description: '연관 상품·서비스를 자연스럽게 추천해 객단가를 높이는 역량',
  },
  closing: {
    id: 'closing',
    nameKo: '클로징',
    nameEn: 'Closing',
    category: 'growth',
    description: '적절한 순간에 확실하게 구매를 마무리 짓는 역량',
  },
  coachability: {
    id: 'coachability',
    nameKo: '코칭 수용성',
    nameEn: 'Coachability',
    category: 'growth',
    description: '피드백을 받아들이고 다음 행동에 즉시 반영하는 역량',
  },
}

// Radius order for the Balance Wheel (RPG stat wheel)
export const WHEEL_SKILL_ORDER: SkillId[] = [
  'discovery',
  'empathy',
  'productKnowledge',
  'communication',
  'crossSell',
  'closing',
]

export const ALL_SKILL_ORDER: SkillId[] = [
  'coachability',
  'productKnowledge',
  'empathy',
  'discovery',
  'communication',
  'storytelling',
  'crossSell',
  'closing',
]
