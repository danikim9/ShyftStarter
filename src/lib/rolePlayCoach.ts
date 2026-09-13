// Text role-play feedback — rule-based, no LLM, no scoring. Returns exactly one
// thing that worked and one thing to try, plus the card's model line. The shape
// is stable so an AI coach can replace this file later.
import type { CoachingCard } from '../types/bellatrix'

export interface RolePlayTurn {
  customer: string
  hint: string
}

export interface RolePlayFeedback {
  good: string
  improve: string
  model: string
}

const ACK = ['괜찮', '그럼요', '네,', '네 ', '이해', '맞아요', '그러셨', '알겠']
const PRICE = ['싸', '할인', '저렴', '세일']

export function buildScenario(card: CoachingCard): RolePlayTurn[] {
  return [
    { customer: card.objection, hint: '먼저 인정하고, 질문으로 끝내보세요.' },
    { customer: '음… 그게 저한테 왜 필요한데요?', hint: card.product_point },
  ]
}

function tokens(text: string): string[] {
  return text
    .replace(/[^가-힣a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2)
}

export function coachReply(reply: string, card: CoachingCard, turn: number): RolePlayFeedback {
  const r = reply.trim()
  const endsWithQuestion = /[?？]\s*$/.test(r) || /(까요|세요|나요|어요\?)$/.test(r)
  const acknowledges = ACK.some((k) => r.includes(k))
  const pointTokens = tokens(card.product_point)
  const usesPoint = pointTokens.some((t) => r.includes(t))
  const mentionsPrice = PRICE.some((k) => r.includes(k))
  const long = r.length >= 15

  const goods: string[] = []
  if (endsWithQuestion) goods.push('질문으로 마무리해서 고객이 계속 말하게 했어요.')
  if (turn === 0 && acknowledges) goods.push('거절을 먼저 인정하고 시작했어요. 다음 제안이 부드러워져요.')
  if (usesPoint) goods.push('제품 포인트를 고객의 말로 풀어 연결했어요.')
  if (long && goods.length === 0) goods.push('충분히 구체적으로 말했어요.')

  const improves: string[] = []
  if (turn === 0 && !acknowledges) improves.push('첫 마디에서 "괜찮아요" 같은 인정을 먼저 넣어보세요.')
  if (!endsWithQuestion) improves.push('마지막을 질문으로 끝내보세요. 고객이 답하면 대화가 이어져요.')
  if (mentionsPrice) improves.push('가격보다 "쓰는 장면"으로 설득해보세요.')
  if (r.length < 12) improves.push('한 문장만 더: 그게 고객에게 왜 좋은지.')
  if (turn === 1 && !usesPoint) improves.push(`오늘의 제품 포인트를 한 번 써보세요: ${card.product_point}`)

  return {
    good: goods[0] ?? '시도한 것 자체가 근거예요. 다음 근무에서 실제로 한 번 해보세요.',
    improve: improves[0] ?? '지금 문장 그대로 매장에서 써보세요.',
    model: turn === 0 ? card.objection_response : card.script,
  }
}
