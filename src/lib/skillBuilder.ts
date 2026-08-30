import type { EmployeeSkillScore, SkillId, SkillScorePoint } from '../types'

export function buildHistory(points: number[], startDate: string): SkillScorePoint[] {
  const base = new Date(startDate)
  return points.map((score, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() + i * 2)
    return {
      shiftIndex: i + 1,
      date: d.toISOString().slice(0, 10),
      score,
    }
  })
}

export function buildSkillScore(
  skillId: SkillId,
  points: number[],
  confidence: number,
  evidenceCount: number,
  startDate = '2026-08-16'
): EmployeeSkillScore {
  const h = buildHistory(points, startDate)
  const score = h[h.length - 1].score
  const previousScore = h.length > 1 ? h[h.length - 2].score : score
  return {
    skillId,
    score,
    confidence,
    previousScore,
    trendDelta: Math.round((score - h[0].score) * 10) / 10,
    evidenceCount,
    history: h,
  }
}
