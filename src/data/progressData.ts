// ---------------------------------------------------------------------------
// P1 — Progress screen mock data: Longitudinal Growth + Skill Trajectory.
// CTO 문서 08p IA 기준 — Stats(P0)가 "지금의 스냅샷"이라면, Progress(P1)는
// "시간에 따른 성장 곡선"을 보여준다. 실제 서비스에서는 매 시프트 종료 시점의
// EMPLOYEE_SKILL_SCORE 스냅샷을 주/월 단위로 집계하면 이 구조 그대로 채워진다.
// ---------------------------------------------------------------------------

import type { Milestone, ProgressPoint, ProgressRange, ProgressSummary, SkillId } from '../types'
import { ALL_SKILL_ORDER } from './skills'
import { employee } from './mockData'

const WEEKLY_LABELS = ['8주 전', '7주 전', '6주 전', '5주 전', '4주 전', '3주 전', '2주 전', '이번 주']
const MONTHLY_LABELS = ['5개월 전', '4개월 전', '3개월 전', '2개월 전', '지난달', '이번 달']

// Deterministic pseudo-growth ramp ending exactly at the skill's current score,
// so Progress always stays consistent with the Stats screen's live numbers.
function ramp(end: number, points: number, spread: number, seed: number): number[] {
  const start = Math.max(15, end - spread)
  const arr: number[] = []
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1)
    const base = start + (end - start) * t
    const wobble = Math.sin(seed + i * 1.7) * 2.1
    arr.push(Math.round(Math.min(99, Math.max(10, base + wobble))))
  }
  arr[arr.length - 1] = end
  return arr
}

function buildTrajectories(labels: string[], spread: number): Record<SkillId, ProgressPoint[]> {
  const result = {} as Record<SkillId, ProgressPoint[]>
  ALL_SKILL_ORDER.forEach((skillId, idx) => {
    const current = employee.skills.find((s) => s.skillId === skillId)!.score
    const values = ramp(current, labels.length, spread, idx * 1.3)
    result[skillId] = labels.map((label, i) => ({ label, capabilityScore: values[i] }))
  })
  return result
}

export const SKILL_TRAJECTORY: Record<ProgressRange, Record<SkillId, ProgressPoint[]>> = {
  weekly: buildTrajectories(WEEKLY_LABELS, 16),
  monthly: buildTrajectories(MONTHLY_LABELS, 34),
}

function overallTrend(range: ProgressRange): ProgressPoint[] {
  const perSkill = SKILL_TRAJECTORY[range]
  const labels = range === 'weekly' ? WEEKLY_LABELS : MONTHLY_LABELS
  return labels.map((label, i) => {
    const avg =
      ALL_SKILL_ORDER.reduce((sum, id) => sum + perSkill[id][i].capabilityScore, 0) / ALL_SKILL_ORDER.length
    return { label, capabilityScore: Math.round(avg) }
  })
}

export const CAPABILITY_TREND: Record<ProgressRange, ProgressPoint[]> = {
  weekly: overallTrend('weekly'),
  monthly: overallTrend('monthly'),
}

export function skillDelta(skillId: SkillId, range: ProgressRange) {
  const pts = SKILL_TRAJECTORY[range][skillId]
  return pts[pts.length - 1].capabilityScore - pts[0].capabilityScore
}

export const PROGRESS_SUMMARY: ProgressSummary = {
  currentStreakDays: 6,
  longestStreakDays: 11,
  totalShiftsLogged: 42,
  totalQuestsCompleted: 57,
  totalLearningCompleted: 8,
}

export const MILESTONES: Milestone[] = [
  { id: 'ms_1', emoji: '🏅', title: 'Level 3 달성', detail: 'Performer 등급 진입', achievedDate: '2주 전' },
  { id: 'ms_2', emoji: '🔥', title: '7일 연속 활동', detail: '체크인 스트릭 최장 기록', achievedDate: '5일 전' },
  { id: 'ms_3', emoji: '🎯', title: '퀘스트 50개 돌파', detail: '누적 퀘스트 완료 57개', achievedDate: '1주 전' },
  { id: 'ms_4', emoji: '📈', title: '클로징 +12', detail: '8주간 가장 크게 성장한 스킬', achievedDate: '이번 주' },
  { id: 'ms_5', emoji: '🧠', title: '마이크로러닝 8회 완주', detail: '스킬 갭 학습 꾸준히 이수 중', achievedDate: '3일 전' },
  { id: 'ms_6', emoji: '💬', title: 'Role-play 첫 완료', detail: 'AI 시뮬레이션 첫 도전 성공', achievedDate: '4일 전' },
]
