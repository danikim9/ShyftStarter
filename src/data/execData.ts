// ---------------------------------------------------------------------------
// Executive Dashboard mock data — 10 stores across 3 regions.
//
// 강남점(st_gangnam)의 수치는 Manager Dashboard `data/team.ts`의 실제 6명
// 직원 평균과 일치하도록 맞췄다 (역량 74 · 참여도 70 · 퀘스트/체크리스트 참여율
// 69% · CVR 24% · AOV 120,667원 · 코칭 세션 2.2회/인) — Employee → Manager →
// Executive 세 화면의 숫자가 서로 어긋나지 않는다.
//
// checklistCompletionRate(X) vs atv(Y)는 CFO 피치덱 7p "The Smoking Gun" 차트를
// 재현하도록 설계했고, `lib/execAnalytics.ts`로 실제 계산하면 r≈0.74·상위 20%
// 매장 평균 ATV +15.4%가 나오도록 값을 잡았다 (하드코딩한 결과가 아니라 계산됨).
// ---------------------------------------------------------------------------

import type { OrgSkillPoint, StorePerformance } from '../types'
import { ALL_SKILL_ORDER } from './skills'

export const STORES: StorePerformance[] = [
  { id: 'st_gangnam', name: '강남점', region: '서울', employeeCount: 6, capabilityScore: 74, engagementScore: 70, checklistCompletionRate: 69, trainingCompletionRate: 42, atv: 120667, cvr: 24, coachingSessionsPerEmployee: 2.2 },
  { id: 'st_myeongdong', name: '명동점', region: '서울', employeeCount: 9, capabilityScore: 83, engagementScore: 79, checklistCompletionRate: 82, trainingCompletionRate: 54, atv: 134000, cvr: 28, coachingSessionsPerEmployee: 2.7 },
  { id: 'st_hongdae', name: '홍대점', region: '서울', employeeCount: 5, capabilityScore: 65, engagementScore: 62, checklistCompletionRate: 54, trainingCompletionRate: 33, atv: 125000, cvr: 21, coachingSessionsPerEmployee: 1.8 },
  { id: 'st_jamsil', name: '잠실점', region: '서울', employeeCount: 8, capabilityScore: 87, engagementScore: 84, checklistCompletionRate: 88, trainingCompletionRate: 59, atv: 148000, cvr: 30, coachingSessionsPerEmployee: 2.9 },
  { id: 'st_bundang', name: '분당점', region: '경기', employeeCount: 6, capabilityScore: 77, engagementScore: 73, checklistCompletionRate: 74, trainingCompletionRate: 46, atv: 151000, cvr: 25, coachingSessionsPerEmployee: 2.3 },
  { id: 'st_ilsan', name: '일산점', region: '경기', employeeCount: 5, capabilityScore: 58, engagementScore: 55, checklistCompletionRate: 41, trainingCompletionRate: 25, atv: 132000, cvr: 18, coachingSessionsPerEmployee: 1.4 },
  { id: 'st_suwon', name: '수원점', region: '경기', employeeCount: 6, capabilityScore: 69, engagementScore: 66, checklistCompletionRate: 60, trainingCompletionRate: 37, atv: 124000, cvr: 22, coachingSessionsPerEmployee: 2.0 },
  { id: 'st_haeundae', name: '해운대점', region: '부산', employeeCount: 8, capabilityScore: 90, engagementScore: 87, checklistCompletionRate: 92, trainingCompletionRate: 63, atv: 153000, cvr: 32, coachingSessionsPerEmployee: 3.1 },
  { id: 'st_seomyeon', name: '서면점', region: '부산', employeeCount: 5, capabilityScore: 61, engagementScore: 58, checklistCompletionRate: 47, trainingCompletionRate: 28, atv: 111000, cvr: 19, coachingSessionsPerEmployee: 1.6 },
  { id: 'st_yeonsu', name: '연수점', region: '부산', employeeCount: 7, capabilityScore: 79, engagementScore: 75, checklistCompletionRate: 77, trainingCompletionRate: 49, atv: 147000, cvr: 26, coachingSessionsPerEmployee: 2.5 },
]

export const REGIONS = Array.from(new Set(STORES.map((s) => s.region)))

function weightedAvg(values: { v: number; w: number }[]) {
  const totalW = values.reduce((a, x) => a + x.w, 0)
  return values.reduce((a, x) => a + x.v * x.w, 0) / totalW
}

export function getOrgSummary() {
  const totalStores = STORES.length
  const totalEmployees = STORES.reduce((a, s) => a + s.employeeCount, 0)
  const w = STORES.map((s) => ({ w: s.employeeCount, store: s }))
  return {
    totalStores,
    totalEmployees,
    avgCapability: Math.round(weightedAvg(w.map((x) => ({ v: x.store.capabilityScore, w: x.w })))),
    avgEngagement: Math.round(weightedAvg(w.map((x) => ({ v: x.store.engagementScore, w: x.w })))),
    avgChecklistCompletion: Math.round(weightedAvg(w.map((x) => ({ v: x.store.checklistCompletionRate, w: x.w })))),
    avgTrainingCompletion: Math.round(weightedAvg(w.map((x) => ({ v: x.store.trainingCompletionRate, w: x.w })))),
    avgAtv: Math.round(weightedAvg(w.map((x) => ({ v: x.store.atv, w: x.w })))),
    avgCvr: Math.round(weightedAvg(w.map((x) => ({ v: x.store.cvr, w: x.w }))) * 10) / 10,
  }
}

// Org-wide Capability Map — baseline (플랫폼 도입 전) vs 현재. Hand-authored to
// reflect the same narrative the whole app tells: closing·cross-sell are the
// organization's weakest, highest-revenue-impact skills.
export const ORG_CAPABILITY_MAP: OrgSkillPoint[] = [
  { skillId: 'coachability', baseline: 68, current: 79 },
  { skillId: 'productKnowledge', baseline: 64, current: 76 },
  { skillId: 'empathy', baseline: 63, current: 74 },
  { skillId: 'communication', baseline: 61, current: 73 },
  { skillId: 'discovery', baseline: 59, current: 71 },
  { skillId: 'storytelling', baseline: 50, current: 62 },
  { skillId: 'crossSell', baseline: 48, current: 60 },
  { skillId: 'closing', baseline: 45, current: 57 },
]

export const ORG_CAPABILITY_AVG_DELTA =
  Math.round(
    (ORG_CAPABILITY_MAP.reduce((a, s) => a + (s.current - s.baseline), 0) / ORG_CAPABILITY_MAP.length) * 10
  ) / 10

// Brand Alignment — listed under Executive persona needs (CTO 07p) but not
// spec'd in detail anywhere (explicitly P2 / "Company-specific Competency
// Model" territory). Modeled here as a light proxy of script/checklist
// adherence per store, flagged in the UI as a concept metric pending a real
// definition once a customer's brand guideline is onboarded.
export const BRAND_ALIGNMENT = STORES.map((s) => ({
  storeId: s.id,
  storeName: s.name,
  score: Math.round(50 + s.checklistCompletionRate * 0.45),
}))

export { ALL_SKILL_ORDER }
