// 24차 — 컨디션 체크인 직후 보여줄 짧은 웰니스/동기부여 메시지.
// 오늘 고른 값과 최근 시프트 히스토리(team.ts의 지은 moodHistory, 최근
// 4시프트)를 함께 봐서 "이번 주 흐름"까지 반영한 한 줄을 고른다 — 오늘
// 컨디션이 안 좋으면 그 자리에서 바로 작은 회복 행동을 제안하고, 좋은
// 흐름이 이어지고 있으면 그걸 짚어주는 정도로 가볍게.
import type { MoodValue } from '../types'

export function getMoodInsight(today: MoodValue, recentHistory: MoodValue[]): string {
  const week = [...recentHistory, today]
  const avg = week.reduce((a, b) => a + b, 0) / week.length

  if (today <= 2) {
    return today === 1
      ? '오늘 많이 힘들었군요. 잠깐 심호흡하고, 물 한 잔 마시며 쉬어가요'
      : '오늘 컨디션이 좀 별로였네요. 짬날 때 가볍게 스트레칭 한 번 해봐요'
  }
  if (avg >= 4.2) return '이번 주는 유독 활기찬 한 주였네요! 이 기세 그대로 가봐요'
  if (today === 5) return '오늘 컨디션 최고예요! 좋은 기운으로 시프트 시작해봐요'
  if (avg <= 2.8) return '요즘 컨디션이 조금 처지는 편이에요. 오늘은 무리하지 말고 페이스대로 가요'
  return '오늘도 좋은 컨디션이에요. 이대로 편안하게 시프트 시작해봐요'
}
