// One 10-second check generated from today's coaching card: the objection is
// the question, the card's own response is the answer, two other cards'
// responses are the distractors. Deterministic per card so it never reshuffles
// while the person is looking at it.
import type { CoachingCard } from '../types/bellatrix'

export interface PrepQuiz {
  cardId: string
  question: string
  options: string[]
  correctIndex: number
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

export function buildPrepQuiz(card: CoachingCard, allCards: CoachingCard[]): PrepQuiz | null {
  if (!card.objection || !card.objection_response) return null
  const pool = allCards.filter((c) => c.id !== card.id && c.objection_response && c.objection_response !== card.objection_response)
  const sameJob = pool.filter((c) => c.job_category === card.job_category)
  const source = sameJob.length >= 2 ? sameJob : pool
  if (source.length < 2) return null
  const h = hash(card.id)
  const a = source[h % source.length]
  const rest = source.filter((c) => c.id !== a.id)
  const b = rest[(h >>> 8) % rest.length]
  const options = [card.objection_response, a.objection_response, b.objection_response]
  // rotate so the correct answer is not always first
  const shift = (h >>> 16) % 3
  const rotated = [...options.slice(shift), ...options.slice(0, shift)]
  return {
    cardId: card.id,
    question: `고객이 ${card.objection} 라고 하면, 오늘은 뭐라고 답할까요?`,
    options: rotated,
    correctIndex: rotated.indexOf(card.objection_response),
  }
}
