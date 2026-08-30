// ---------------------------------------------------------------------------
// Coaching content library — genericized, industry-neutral, Korean.
//
// Source: adapted from general frontline retail/service coaching reference
// material the founders shared (field coaching manuals, store-culture
// training guides). Content here has been paraphrased and stripped of any
// brand, product, or single-industry specifics so it works as example
// content for any vertical (fashion, F&B, auto, electronics, etc.) — this is
// a demo content library, not a specific company's proprietary playbook.
// Swap/extend per real customer's SOP once a design-partner is onboarded.
// ---------------------------------------------------------------------------

import type { CoachingGuideStep, SkillId } from '../types'

// A short, generic 6-step customer-interaction flow — used as the backbone
// for Killer Script and Micro Checklist content across skills.
export const SERVICE_FLOW_STEPS = [
  { step: '맞이하기', tip: '고객의 표정·자세·속도부터 관찰한 뒤, 형식적인 인사 대신 자연스럽게 말을 건네요.' },
  { step: '질문하기', tip: '호기심 어린 열린 질문으로 니즈를 탐색하고, 성급하게 제품부터 추천하지 않아요.' },
  { step: '경청하기', tip: '고객의 말을 한 번 더 요약해서 되짚어주며 공감을 표현해요.' },
  { step: '제안하기', tip: '판매 압박 없이, 고객에게 진짜 도움이 되는 대안을 신뢰감 있게 제시해요.' },
  { step: '체험시키기', tip: '직접 경험하게 하되, 한 번에 너무 많은 정보를 주지 않아요.' },
  { step: '마무리하기', tip: '고객의 선택을 축하하고 확신을 주며, 다음 방문의 여지를 남겨요.' },
] as const

// Extra Killer Script variants per skill — BEFORE(일반적인 말) → AFTER(추천 문장) → FOLLOW-UP.
// One additional variant per skill beyond the primary one already in mockData.ts,
// used to power the "SHOW ANOTHER" interaction.
export const KILLER_SCRIPT_VARIANTS: Record<SkillId, { before: string; after: string; followUp: string }[]> = {
  discovery: [
    { before: '뭐 찾으세요?', after: '오늘은 편하게 둘러보러 오셨어요, 아니면 찾으시는 게 있으세요?', followUp: '평소에 어떤 상황에서 주로 쓰실 계획이세요?' },
  ],
  empathy: [
    { before: '아 네, 그러시구나.', after: '그 부분 때문에 불편하셨겠어요 — 저라도 그랬을 것 같아요.', followUp: '혹시 예전에도 비슷한 걸 써보신 적 있으세요?' },
  ],
  productKnowledge: [
    { before: '이 제품 스펙은 이래요.', after: '이 기능 덕분에 지금 불편해하시던 부분이 훨씬 편해지실 거예요.', followUp: '방금 말씀드린 것 중에 가장 궁금하신 부분이 있을까요?' },
  ],
  communication: [
    { before: '(대기 고객 방치)', after: '잠시만요, 금방 도와드릴게요!', followUp: '기다려주셔서 감사해요 — 지금부터 편하게 봐드릴게요.' },
  ],
  storytelling: [
    { before: '이건 A, B, C 기능이 있어요.', after: '이걸 쓰시면 하루 중 이 부분이 이렇게 달라지실 거예요.', followUp: '실제로 써보시면 그 차이가 더 확실히 느껴지실 거예요.' },
  ],
  crossSell: [
    { before: '이것도 같이 사시겠어요?', after: '지금 고르신 것과 같이 쓰면 훨씬 만족스러운 옵션이 있는데, 알려드려도 될까요?', followUp: '혹시 같이 준비하시면 좋은 것도 안내해드릴까요?' },
  ],
  closing: [
    { before: '괜찮으시면 결제 도와드릴까요?', after: '이 중에서 오늘 바로 결정하신다면 어느 쪽이 더 마음에 드세요?', followUp: '지금 결정하시면 제가 바로 준비해드릴게요.' },
  ],
  coachability: [
    { before: '(피드백 후 다음 응대에 그대로 반복)', after: '방금 받은 피드백, 바로 다음 고객분께 적용해볼게요.', followUp: '이번엔 어떤 점이 달라졌는지 스스로 체크해볼게요.' },
  ],
}

// Generic before/after phrase bank — not tied to a specific skill, used as
// general reference material / manager talking points.
export const GENERIC_FEEDBACK_EXAMPLES = [
  { situation: '재고 부족 응대', before: '그 상품은 지금 없어요.', after: '지금 재고는 없지만, 비슷하게 만족하실 대안을 보여드려도 될까요?' },
  { situation: '컴플레인 응대', before: '죄송한데 규정상 어려워요.', after: '불편 드려 죄송합니다 — 지금 가능한 방법부터 같이 찾아볼게요.' },
  { situation: '소극적 고객 응대', before: '바로 다가가 말 걸기', after: '먼저 미소로 신호를 보낸 뒤, "필요하시면 편하게 불러주세요"' },
  { situation: '시간 없는 고객 응대', before: '장황하게 설명 시작하기', after: '"시간 없으시면 필요한 것만 말씀해주세요, 바로 도와드릴게요"' },
]

// Micro Checklist item pool — generic, imperative, 3–7 words.
export const CHECKLIST_POOL = {
  before: ['옷차림·자세 점검하기', '표정과 미소 확인하기', '고객 동선 미리 관찰하기', '대기 고객에게 짧게 안내하기'],
  after: ['구매 혜택 안내했는지 확인하기', '대안 옵션 제시했는지 점검하기', '밝은 인사로 배웅하기', '재방문 요청 자연스럽게 전달하기'],
}

// Store/service culture principles — short, generic, values-level.
export const CULTURE_PRINCIPLES = [
  '대본처럼 말하지 않고, 진짜 자기 경험처럼 이야기해요.',
  '고객 눈높이에 맞춰 쉬운 말로 설명해요.',
  '장단점을 솔직히 알려주고 과장하지 않아요.',
  '강요 없이 고객이 스스로 선택하게 도와요.',
  '문제는 그 자리에서 바로, 간접적인 건 팀 미팅에서 다뤄요.',
  '하루 시작 미팅에서 인정과 목표 공유를 습관으로 만들어요.',
  '동료와 어려움·노하우를 솔직하게 나눠요.',
  '작은 성취도 그 자리에서 바로 축하해요.',
]

// Generic 1:1 manager↔employee coaching conversation guide — 5-step,
// data-first / non-judgmental structure. Populated with employee-specific
// values at render time (see aiEngine.ts → generateCoachingGuide).
export const COACHING_CONVERSATION_TEMPLATE: CoachingGuideStep[] = [
  { step: '1. 시작 — 인정으로 열기', prompt: '최근 잘한 점을 구체적으로 먼저 언급하며 대화를 시작하세요.' },
  { step: '2. 데이터 공유', prompt: '판단이 아닌, 관찰된 행동 데이터를 있는 그대로 공유하세요.' },
  { step: '3. 원인 탐색', prompt: '열린 질문으로 본인의 생각을 먼저 물어보세요. ("요즘 이 부분 어떻게 느끼고 있어요?")' },
  { step: '4. 합의', prompt: '다음 시프트에 시도해볼 구체적인 행동 1가지를 함께 정하세요.' },
  { step: '5. 마무리 — 응원으로 닫기', prompt: '믿고 있다는 메시지로 대화를 마무리하세요.' },
]
