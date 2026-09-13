import { describe, expect, it } from 'vitest'
import { COACHING_CARDS } from '../data/coachingCards'
import { buildPrepQuiz } from '../lib/prepQuiz'
import { coachReply, buildScenario } from '../lib/rolePlayCoach'

describe('Shift Prep quiz', () => {
  it('builds one question per card with the card response as the correct option', () => {
    for (const card of COACHING_CARDS) {
      const q = buildPrepQuiz(card, COACHING_CARDS)
      expect(q).not.toBeNull()
      expect(q!.options).toHaveLength(3)
      expect(new Set(q!.options).size).toBe(3)
      expect(q!.options[q!.correctIndex]).toBe(card.objection_response)
    }
  })
  it('is deterministic for the same card', () => {
    const a = buildPrepQuiz(COACHING_CARDS[0], COACHING_CARDS)!
    const b = buildPrepQuiz(COACHING_CARDS[0], COACHING_CARDS)!
    expect(a.options).toEqual(b.options)
    expect(a.correctIndex).toBe(b.correctIndex)
  })
  it('does not always put the correct answer first', () => {
    const idx = COACHING_CARDS.map((c) => buildPrepQuiz(c, COACHING_CARDS)!.correctIndex)
    expect(new Set(idx).size).toBeGreaterThan(1)
  })
})

describe('role-play coach', () => {
  const card = COACHING_CARDS.find((c) => c.id === 'cc_el_cross_sell')!
  it('has two customer turns starting with the objection', () => {
    const t = buildScenario(card)
    expect(t).toHaveLength(2)
    expect(t[0].customer).toBe(card.objection)
  })
  it('praises acknowledgement + question and suggests a question when missing', () => {
    const good = coachReply('네, 괜찮아요. 혹시 첫날 흠집이 걱정되진 않으세요?', card, 0)
    expect(good.good).toMatch(/질문|인정/)
    const flat = coachReply('그냥 사세요', card, 0)
    expect(flat.improve).toMatch(/인정|질문|한 문장/)
    expect(flat.model).toBe(card.objection_response)
  })
  it('never scores, always returns one good + one improve + a model line', () => {
    const f = coachReply('', card, 1)
    expect(f.good.length).toBeGreaterThan(0)
    expect(f.improve.length).toBeGreaterThan(0)
    expect(f.model).toBe(card.script)
  })
})
