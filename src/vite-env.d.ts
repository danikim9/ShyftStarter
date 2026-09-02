/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 24차 — 이 빌드가 어떤 페르소나 전용인지(employee/manager/executive).
  // 미설정이면 기존처럼 스위처로 세 페르소나를 모두 오가는 통합 빌드.
  readonly VITE_PERSONA?: 'employee' | 'manager' | 'executive'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
