// Feature flags — one place to keep the TestFlight build focused on the core
// loop (근무 전 미션 확인 → 근무 중 기록 → 근무 후 성장). Everything below still
// compiles and works; flipping a flag re-enables it in the UI. Nothing here
// changes data, privacy or RLS.
export const FEATURES = {
  // 근무 (team tab › 근무표)
  shiftMonthView: false,
  shiftExport: false,
  shiftSwap: false, // legacy mock roster swap sheet — hidden until it reads the real roster
  // 학습·연습 extras
  prepQuiz: false, // 10초 확인 inside Shift Prep
  rolePlay: false,
  quickQuiz: false,
  // 성장 extras
  posSales: false, // 내 매출 · POS (needs real POS/CSV rows)
  confidenceFlow: false,
  weeklySummary: false,
  // 매니저
  managerKpi: true, // KPI tab: 오늘 입력 · 이번 주 vs 지난주 · 최근 7일
  managerInsights: false, // full 주간 인사이트 tab (top signals still appear at the bottom of KPI)
  managerLegacyTools: false, // 더보기: 구버전 공지·근무표 목업·매트릭스
} as const

export type FeatureFlag = keyof typeof FEATURES
