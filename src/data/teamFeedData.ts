// ---------------------------------------------------------------------------
// P1~P2 — Team tab mock data (Employee App side): Recognition · Team Challenge ·
// Leaderboard. CTO 문서 08p IA 기준.
//
// 의도적으로 매니저용 `data/team.ts`의 willScore·needsAttention·aiSummary 등
// 민감한 코칭 신호는 여기로 가져오지 않는다 — 직원끼리 서로의 참여도/개입
//필요 여부를 볼 수 있으면 "감시" 프레임이 되어버리므로, 동료에게 보여도 되는
// capabilityScore(역량 종합)만 리더보드에 노출한다.
// ---------------------------------------------------------------------------

import type { LeaderboardEntry, RecognitionEvent, TeamChallenge } from '../types'
import { team } from './team'
import { CURRENT_EMPLOYEE_ID } from './mockData'

export const LEADERBOARD: LeaderboardEntry[] = team
  .map((m) => ({
    employeeId: m.id,
    name: m.name,
    avatarColor: m.avatarColor,
    role: m.role,
    store: m.store,
    score: m.capabilityScore,
    isMe: m.id === CURRENT_EMPLOYEE_ID,
  }))
  .sort((a, b) => b.score - a.score)

export const TEAM_CHALLENGE: TeamChallenge = {
  id: 'tc_crosssell_week',
  title: '이번 주 팀 챌린지 · 크로스셀 32건',
  description: '강남점 전체가 함께 연관 상품 추천 32건을 달성하면 매장 전원에게 보너스 XP가 지급돼요.',
  progress: 21,
  target: 32,
  unit: '건',
  endsIn: '3일 남음',
  rewardNote: '달성 시 전원 +100 XP',
}

export const RECOGNITION_FEED: RecognitionEvent[] = [
  {
    id: 'rec_1',
    employeeId: 'emp_jieun',
    employeeName: '지은',
    message: '어려운 고객 응대에서도 침착하게 니즈를 파악해줘서 고마워요 👏',
    date: '오늘',
    fromRole: 'manager',
  },
  {
    id: 'rec_2',
    employeeId: 'emp_somi',
    employeeName: '한소미',
    message: '이번 주 마이크로러닝 전 모듈 완주! 성장 속도가 팀 최고예요 🔥',
    date: '어제',
    fromRole: 'ai',
  },
  {
    id: 'rec_3',
    employeeId: 'emp_junseo',
    employeeName: '박준서',
    message: '신입 도현님 온보딩 도와줘서 고마워요, 덕분에 적응이 훨씬 빨라졌어요 🙌',
    date: '2일 전',
    fromRole: 'peer',
  },
  {
    id: 'rec_4',
    employeeId: 'emp_seoyeon',
    employeeName: '이서연',
    message: '오늘 응대에서 공감 표현이 정말 자연스러웠어요 💬',
    date: '3일 전',
    fromRole: 'manager',
  },
]
