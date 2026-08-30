import type { LearningModule, RolePlayScenario, SkillId } from '../types'

// P1 — Microlearning modules. AI picks one based on the employee's current
// skill gap (see aiEngine.ts → recommendLearningModule); content is generic
// and industry-neutral (see coachingContent.ts header for sourcing notes).
export const LEARNING_MODULES: Record<SkillId, LearningModule> = {
  discovery: {
    id: 'lm_discovery',
    skillId: 'discovery',
    title: '니즈 파악을 3분 만에',
    why: '제품 얘기로 바로 시작하지 않고, 고객의 라이프스타일을 먼저 물어보면 추천 정확도가 크게 올라가요.',
    durationMin: 3,
    outcome: '다음 응대에서 "라이프스타일 우회 질문법"으로 대화를 시작할 수 있어요.',
    tips: [
      '제품이 아니라 상황부터 물어보세요 — "평소에 어떤 상황에서 주로 쓰실 계획이세요?"',
      '첫 질문은 항상 열린 질문으로, "어떤"으로 시작해보세요.',
      '고객이 답하면 그 안에서 우선순위 하나를 다시 좁혀서 확인하세요.',
    ],
  },
  empathy: {
    id: 'lm_empathy',
    skillId: 'empathy',
    title: '공감을 3분 만에',
    why: '고객의 말을 요약해서 되짚어주는 것만으로도 신뢰도가 눈에 띄게 올라가요.',
    durationMin: 3,
    outcome: '다음 응대에서 "요약 반영" 기법을 한 번 이상 시도할 수 있어요.',
    tips: [
      '"~해서 불편하셨겠어요" 처럼 감정을 먼저 짚어주세요.',
      '고객의 말을 끊지 말고 끝까지 들은 뒤 한 문장으로 요약해보세요.',
      '판단하지 말고, 고객 입장에서 먼저 이해하려는 태도를 보여주세요.',
    ],
  },
  productKnowledge: {
    id: 'lm_productKnowledge',
    skillId: 'productKnowledge',
    title: '제품 지식을 3분 만에',
    why: 'FABE 화법(특징→장점→혜택→근거)으로 설명하면 스펙 나열보다 훨씬 잘 전달돼요.',
    durationMin: 3,
    outcome: '다음 응대에서 FABE 순서로 제품을 1번 설명해볼 수 있어요.',
    tips: [
      'Feature(특징) → Advantage(장점) → Benefit(혜택) → Evidence(근거) 순서로 말해보세요.',
      '스펙보다 "이 기능 덕분에 무엇이 편해지는지"를 먼저 말하세요.',
      '설명 후에는 항상 "궁금한 점 있으세요?"로 확인하세요.',
    ],
  },
  communication: {
    id: 'lm_communication',
    skillId: 'communication',
    title: '커뮤니케이션을 3분 만에',
    why: '첫 10초의 인사가 전체 응대 만족도를 좌우해요.',
    durationMin: 3,
    outcome: '다음 응대에서 10초 이내에 자연스러운 첫인사를 건넬 수 있어요.',
    tips: [
      '형식적인 인사 대신, 고객의 표정과 상황에 맞춰 말을 건네세요.',
      '대기 고객에게는 먼저 짧게 신호를 보내세요 — "잠시만요, 금방 도와드릴게요."',
      '바쁜 고객에게는 설명을 줄이고 필요한 것부터 물어보세요.',
    ],
  },
  storytelling: {
    id: 'lm_storytelling',
    skillId: 'storytelling',
    title: '스토리텔링을 3분 만에',
    why: '기능 나열보다 "이걸 쓰면 하루가 어떻게 달라지는지"를 이야기하면 훨씬 설득력이 생겨요.',
    durationMin: 3,
    outcome: '다음 응대에서 제품을 하나의 장면(scene)으로 설명해볼 수 있어요.',
    tips: [
      '"이걸 쓰시면 하루 중 이 순간이 이렇게 달라지실 거예요" 형태로 말해보세요.',
      '고객의 실제 상황(출근길, 주말 등)에 제품을 대입해서 설명하세요.',
      '너무 많은 정보를 한 번에 주지 말고, 장면 하나에 집중하세요.',
    ],
  },
  crossSell: {
    id: 'lm_crossSell',
    skillId: 'crossSell',
    title: '크로스셀을 3분 만에',
    why: '판매 압박이 아니라 "같이 쓰면 더 좋은 이유"를 붙이면 거부감이 크게 줄어요.',
    durationMin: 3,
    outcome: '다음 응대에서 연관 상품을 1번 이상 자연스럽게 추천할 수 있어요.',
    tips: [
      '"이거 하나만 있으면 아쉬울 수 있는데" 처럼 아쉬움을 짚고 대안을 제시하세요.',
      '추천은 항상 고객이 이미 고른 것과 "함께 쓰는" 맥락으로 연결하세요.',
      '거절해도 괜찮다는 톤을 유지하세요 — 압박처럼 느껴지지 않게.',
    ],
  },
  closing: {
    id: 'lm_closing',
    skillId: 'closing',
    title: '클로징을 3분 만에',
    why: '클로징 질문 후의 침묵을 두려워하지 않는 것이 핵심이에요.',
    durationMin: 3,
    outcome: '다음 응대에서 직접적인 클로징 질문을 1번 시도할 수 있어요.',
    tips: [
      '가격보다 가치를 먼저 확인시킨 뒤, 두 가지 선택지 중 고르게 하는 질문으로 마무리하세요.',
      '클로징 질문 후 3초는 기다려주세요 — 먼저 말을 덧붙이지 마세요.',
      '"지금 결정하시면 제가 바로 준비해드릴게요"처럼 다음 행동을 구체적으로 제시하세요.',
    ],
  },
  coachability: {
    id: 'lm_coachability',
    skillId: 'coachability',
    title: '코칭 수용성을 3분 만에',
    why: '피드백을 다음 응대에 바로 적용하는 것만으로도 성장 속도가 눈에 띄게 빨라져요.',
    durationMin: 3,
    outcome: '오늘 받은 피드백 하나를 다음 고객 응대에 바로 적용해볼 수 있어요.',
    tips: [
      '피드백을 받으면 "무엇을, 어떻게 바꿀지" 한 문장으로 정리해보세요.',
      '바로 다음 응대에 적용하고, 스스로 결과를 체크해보세요.',
      '피드백에 방어적으로 반응하지 않고, 우선 데이터로 받아들이세요.',
    ],
  },
}

// P1 — AI Role-play scenarios (text-based only). One customer opening line
// per skill; the employee types a response and gets a mock 5-axis score.
export const ROLE_PLAY_SCENARIOS: Record<SkillId, RolePlayScenario> = {
  closing: { skillId: 'closing', title: '망설이는 고객', customerLine: '"제품은 마음에 드는데, 가격이 좀 부담스러워서... 좀 더 생각해볼게요."' },
  crossSell: { skillId: 'crossSell', title: '하나만 사려는 고객', customerLine: '"일단 이거 하나만 볼게요. 다른 건 필요 없어요."' },
  discovery: { skillId: 'discovery', title: '말이 없는 고객', customerLine: '"그냥 좀 둘러보고 있어요."' },
  empathy: { skillId: 'empathy', title: '불만이 있는 고객', customerLine: '"저번에 안내받은 거랑 다르게 문제가 있어서 좀 불편했어요."' },
  productKnowledge: { skillId: 'productKnowledge', title: '비교하는 고객', customerLine: '"이거랑 저거 뭐가 더 나은 거예요? 잘 모르겠어요."' },
  communication: { skillId: 'communication', title: '급한 고객', customerLine: '"시간이 별로 없어서요, 빨리 좀 도와주실 수 있어요?"' },
  storytelling: { skillId: 'storytelling', title: '필요성을 못 느끼는 고객', customerLine: '"이게 저한테 왜 필요한지 잘 모르겠어요."' },
  coachability: { skillId: 'coachability', title: '동료 관찰 시나리오', customerLine: '"(매니저) 방금 응대에서 클로징 타이밍을 놓친 것 같아요, 어떻게 생각해요?"' },
}
