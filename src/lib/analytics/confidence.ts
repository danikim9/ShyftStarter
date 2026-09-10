// Evidence confidence — different sources have different reliability.
// A completed ActionEvent is engagement, NOT proof the real-world behaviour
// happened. Only manager observation (and later, verified outcome data) counts
// as high-confidence behaviour evidence.
import type { BehaviourEvidence, ConfidenceLevel, EvidenceSource } from '../../types/bellatrix'

export interface ConfidenceContext {
  /** True when a manager observation of the same behaviour exists for the same shift. */
  corroboratedByObservation?: boolean
  /** For digital signals: does the event describe a digital behaviour (e.g. viewed coaching)
   * rather than a real-world sales behaviour? */
  digitalBehaviour?: boolean
}

export function getEvidenceConfidence(source: EvidenceSource, ctx: ConfidenceContext = {}): ConfidenceLevel {
  switch (source) {
    case 'manager_observation':
      return 'high'
    case 'employee_self_report':
      return ctx.corroboratedByObservation ? 'medium' : 'low'
    case 'digital_signal':
      return ctx.digitalBehaviour ? 'medium' : 'low'
    case 'system_inference':
      return 'low'
  }
}

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  low: '낮음',
  medium: '중간',
  high: '높음',
}

export const SOURCE_LABEL: Record<EvidenceSource, string> = {
  employee_self_report: '본인 체크인',
  manager_observation: '매니저 관찰',
  digital_signal: '앱 기록',
  system_inference: '시스템 추정',
}

/** Strength of a statistical statement, based purely on sample size + effect. */
export type EvidenceStrength = 'insufficient' | 'building' | 'early_signal' | 'correlation' | 'descriptive'

export const STRENGTH_LABEL: Record<EvidenceStrength, string> = {
  insufficient: '데이터 부족',
  building: '근거 쌓는 중',
  early_signal: '초기 신호',
  correlation: '상관관계',
  descriptive: '집계',
}

export const STRENGTH_TONE: Record<EvidenceStrength, 'default' | 'amber' | 'brand' | 'emerald'> = {
  insufficient: 'default',
  building: 'amber',
  early_signal: 'brand',
  correlation: 'emerald',
  descriptive: 'default',
}

export function rateStrength(nA: number, nB: number, deltaPct: number | null): EvidenceStrength {
  const nMin = Math.min(nA, nB)
  if (nMin < 3 || deltaPct === null) return 'insufficient'
  if (nMin < 5) return 'building'
  if (Math.abs(deltaPct) < 3) return 'building'
  if (nMin >= 10) return 'correlation'
  return 'early_signal'
}

export const CAUSATION_CAVEAT = '상관관계는 인과관계를 증명하지 않아요. 더 많은 데이터가 쌓이면 신뢰도가 올라가요.'

export function isObserved(e: BehaviourEvidence): boolean {
  return e.evidence_source === 'manager_observation' && e.evidence_value === 'observed'
}
