import type { TeamMember } from '../types'
import { buildSkillScore } from '../lib/skillBuilder'
import { employee as jieun } from './mockData'

function avg(nums: number[]) {
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}

// 지은 already fully modeled in mockData.ts (the Employee-app persona) — reuse
// her skill data here so Manager and Employee views stay perfectly consistent.
const jieunCapability = avg(jieun.skills.map((s) => s.score))

export const team: TeamMember[] = [
  {
    id: jieun.id,
    name: jieun.name,
    role: jieun.role,
    store: jieun.store,
    tenure: jieun.experienceLevel,
    avatarColor: '#5b5ff2',
    skills: jieun.skills,
    capabilityScore: jieunCapability,
    willScore: 84,
    willBasis: '퀘스트 완료율 91% · 넛지 반응률 88% · 체크리스트 참여 꾸준 · 컨디션 체크인 평균 4.0/5',
    needsAttention: true,
    signal: '클로징이 4시프트 연속 팀 벤치마크 이하 — 니즈 파악·제품 지식은 이미 강점',
    kpi: { cvr: 24, aov: 118000 },
    activity: { questCompletionRate: 78, coachingHistoryCount: 4, learningCompletedCount: 3 },
    moodHistory: [3, 4, 4, 4, 5],
    aiSummary: {
      whatMatters: '클로징이 4시프트 연속 가장 낮은 역량이에요. 참여도는 높지만 마무리 단계에서 아직 확신 있게 요청하지 못하고 있어요.',
      why: '니즈 파악(87)·제품 지식(91)은 이미 강점이라 추천까지는 매끄러운데, 클로징에서 이탈이 생기는 것으로 보여요. 매출에 가장 직접적으로 연결되는 구간이에요.',
      whatToDo: '3분 클로징 롤플레이 배정 + 이번 주 클로징 퀘스트 난이도를 살짝 낮춰 성공 경험을 먼저 만들어주세요.',
    },
  },
  {
    id: 'emp_junseo',
    name: '박준서',
    role: 'Sales Associate',
    store: 'Gangnam',
    tenure: '3년차',
    avatarColor: '#22c55e',
    skills: [
      buildSkillScore('discovery', [84, 86, 88, 89, 90], 0.9, 24),
      buildSkillScore('empathy', [86, 88, 90, 91, 92], 0.91, 23),
      buildSkillScore('productKnowledge', [90, 91, 93, 94, 95], 0.93, 26),
      buildSkillScore('communication', [82, 84, 86, 87, 88], 0.88, 21),
      buildSkillScore('storytelling', [72, 74, 77, 78, 80], 0.8, 15),
      buildSkillScore('crossSell', [76, 78, 81, 83, 85], 0.85, 19),
      buildSkillScore('closing', [80, 82, 85, 86, 88], 0.87, 22),
      buildSkillScore('coachability', [85, 86, 88, 89, 90], 0.89, 20),
    ],
    capabilityScore: 0,
    willScore: 92,
    willBasis: '퀘스트 완료율 97% · 신규 캠페인 자발적 시도 다수 · 컨디션 체크인 평균 4.8/5',
    needsAttention: false,
    signal: '전 영역 고르게 우수 — 크로스셀 신제품 캠페인 자발적 시도 증가',
    kpi: { cvr: 34, aov: 156000 },
    activity: { questCompletionRate: 97, coachingHistoryCount: 2, learningCompletedCount: 6 },
    moodHistory: [5, 5, 4, 5, 5],
    aiSummary: {
      whatMatters: '8개 역량이 모두 팀 상위권이고 최근에도 꾸준히 성장하고 있어요.',
      why: '특히 제품 지식과 코칭 수용성이 높아 신제품 캠페인에 가장 먼저 적응했어요. 리더십 잠재력이 보여요.',
      whatToDo: '인정 메시지와 함께, 신입 온보딩 멘토 역할이나 난이도 높은 챌린지 퀘스트를 배정해보세요.',
    },
  },
  {
    id: 'emp_mingyeong',
    name: '최민경',
    role: 'Senior Sales Associate',
    store: 'Gangnam',
    tenure: '4년차',
    avatarColor: '#f5a524',
    skills: [
      buildSkillScore('discovery', [88, 87, 86, 85, 85], 0.86, 20),
      buildSkillScore('empathy', [82, 81, 81, 80, 80], 0.82, 18),
      buildSkillScore('productKnowledge', [94, 93, 93, 93, 93], 0.92, 25),
      buildSkillScore('communication', [86, 85, 84, 84, 84], 0.84, 19),
      buildSkillScore('storytelling', [74, 72, 71, 70, 70], 0.75, 12),
      buildSkillScore('crossSell', [82, 80, 80, 79, 79], 0.8, 17),
      buildSkillScore('closing', [85, 84, 83, 82, 82], 0.83, 21),
      buildSkillScore('coachability', [70, 66, 63, 61, 60], 0.7, 14),
    ],
    capabilityScore: 0,
    willScore: 38,
    willBasis: '최근 3주 퀘스트 참여율 22% · 넛지 무시율 상승 · 컨디션 체크인 평균 2.2/5로 하락 추세',
    needsAttention: true,
    signal: '역량은 팀 최상위권이지만 최근 3주 참여도가 급격히 낮아졌어요',
    kpi: { cvr: 29, aov: 149000 },
    activity: { questCompletionRate: 22, coachingHistoryCount: 1, learningCompletedCount: 1 },
    moodHistory: [4, 3, 2, 2, 2],
    aiSummary: {
      whatMatters: '역량 점수는 여전히 팀에서 가장 높은 수준이지만, 참여 신호(퀘스트·넛지·체크리스트)가 최근 3주 사이 눈에 띄게 줄었어요.',
      why: '숙련도는 충분한데 동기 신호가 약해진 상태예요. 번아웃이나 역할에 대한 권태감일 가능성이 있어요 — 데이터만으로는 원인까지 알 수 없어요.',
      whatToDo: '평가가 아닌 대화로 먼저 다가가세요. 1:1 면담 가이드를 참고해 편하게 근황을 물어보는 것부터 시작해보세요.',
    },
  },
  {
    id: 'emp_dohyun',
    name: '김도현',
    role: 'Sales Associate',
    store: 'Gangnam',
    tenure: '2개월차',
    avatarColor: '#ef4444',
    skills: [
      buildSkillScore('discovery', [45, 47, 49, 51, 52], 0.6, 8),
      buildSkillScore('empathy', [48, 50, 52, 54, 55], 0.62, 8),
      buildSkillScore('productKnowledge', [40, 42, 45, 47, 48], 0.58, 7),
      buildSkillScore('communication', [50, 52, 55, 57, 58], 0.63, 9),
      buildSkillScore('storytelling', [32, 34, 36, 38, 40], 0.5, 5),
      buildSkillScore('crossSell', [28, 30, 32, 34, 35], 0.48, 5),
      buildSkillScore('closing', [24, 26, 28, 29, 30], 0.5, 6),
      buildSkillScore('coachability', [58, 60, 62, 64, 65], 0.65, 9),
    ],
    capabilityScore: 0,
    willScore: 35,
    willBasis: '체크리스트 완료율 저조 · 첫 2주 이후 퀘스트 참여 감소 · 컨디션 체크인 평균 2.4/5',
    needsAttention: true,
    signal: '입사 후 핵심 역량 전반이 벤치마크 이하 — 참여도도 함께 낮아지는 중',
    kpi: { cvr: 11, aov: 78000 },
    activity: { questCompletionRate: 31, coachingHistoryCount: 1, learningCompletedCount: 2 },
    moodHistory: [3, 2, 2, 3, 2],
    aiSummary: {
      whatMatters: '8개 역량 대부분이 아직 벤치마크 이하예요. 입사 초반의 참여 열기도 최근 2주 사이 줄어들고 있어요.',
      why: '신입 온보딩 초기라 역량이 낮은 건 자연스럽지만, 참여도까지 같이 낮아지는 건 방향을 잃었거나 자신감이 떨어졌다는 신호일 수 있어요.',
      whatToDo: '난이도를 낮춘 퀘스트로 작은 성공 경험부터 만들어주고, 이번 주 안에 짧은 체크인 대화를 가져보세요.',
    },
  },
  {
    id: 'emp_seoyeon',
    name: '이서연',
    role: 'Sales Associate',
    store: 'Gangnam',
    tenure: '2년차',
    avatarColor: '#22c55e',
    skills: [
      buildSkillScore('discovery', [78, 80, 82, 83, 84], 0.85, 19),
      buildSkillScore('empathy', [82, 84, 86, 87, 88], 0.88, 20),
      buildSkillScore('productKnowledge', [76, 78, 80, 81, 82], 0.82, 17),
      buildSkillScore('communication', [80, 82, 84, 85, 86], 0.86, 18),
      buildSkillScore('storytelling', [68, 70, 72, 74, 75], 0.76, 13),
      buildSkillScore('crossSell', [74, 76, 78, 79, 80], 0.79, 16),
      buildSkillScore('closing', [70, 73, 75, 77, 78], 0.78, 17),
      buildSkillScore('coachability', [82, 84, 86, 87, 88], 0.87, 19),
    ],
    capabilityScore: 0,
    willScore: 85,
    willBasis: '퀘스트 완료율 88% · 마이크로 러닝 자발적 수강 · 컨디션 체크인 평균 4.2/5',
    needsAttention: false,
    signal: '꾸준한 상승세, 특히 공감·커뮤니케이션에서 강점',
    kpi: { cvr: 27, aov: 131000 },
    activity: { questCompletionRate: 88, coachingHistoryCount: 3, learningCompletedCount: 5 },
    moodHistory: [4, 4, 5, 4, 4],
    aiSummary: {
      whatMatters: '공감·커뮤니케이션을 중심으로 전 역량이 꾸준히 우상향하고 있어요.',
      why: '참여도와 역량 성장이 함께 움직이고 있어 코칭이 잘 통하는 케이스예요.',
      whatToDo: '지금 속도를 유지할 수 있도록 인정 메시지를 보내고, 스토리텔링 영역에 조금 더 도전적인 퀘스트를 배정해보세요.',
    },
  },
  {
    id: 'emp_somi',
    name: '한소미',
    role: 'Sales Associate',
    store: 'Gangnam',
    tenure: '6개월차',
    avatarColor: '#5b5ff2',
    skills: [
      buildSkillScore('discovery', [58, 61, 64, 66, 68], 0.72, 12),
      buildSkillScore('empathy', [62, 65, 68, 70, 72], 0.74, 13),
      buildSkillScore('productKnowledge', [50, 53, 56, 58, 60], 0.68, 10),
      buildSkillScore('communication', [60, 63, 66, 68, 70], 0.73, 12),
      buildSkillScore('storytelling', [45, 48, 51, 53, 55], 0.6, 8),
      buildSkillScore('crossSell', [40, 43, 46, 48, 50], 0.58, 8),
      buildSkillScore('closing', [35, 38, 41, 43, 45], 0.6, 9),
      buildSkillScore('coachability', [84, 87, 89, 91, 92], 0.9, 18),
    ],
    capabilityScore: 0,
    willScore: 88,
    willBasis: '퀘스트 완료율 95% · 마이크로 러닝 전체 수강 · 컨디션 체크인 평균 4.8/5',
    needsAttention: false,
    signal: '입사 6개월 만에 전 역량이 빠르게 상승 중 — 코칭 수용성이 가장 큰 자산',
    kpi: { cvr: 16, aov: 92000 },
    activity: { questCompletionRate: 95, coachingHistoryCount: 2, learningCompletedCount: 7 },
    moodHistory: [4, 5, 5, 5, 5],
    aiSummary: {
      whatMatters: '아직 역량 절대치는 낮지만, 코칭 수용성이 팀 최상위권이고 전 영역이 빠르게 성장하고 있어요.',
      why: '피드백을 바로 다음 응대에 적용하는 케이스라, 지금 투자하는 코칭이 복리로 쌓일 가능성이 높아요.',
      whatToDo: '성장 속도가 꺾이지 않도록 이번 주도 제품 지식·클로징 퀘스트를 계속 배정해주세요.',
    },
  },
]

// fill in computed capability scores
for (const m of team) {
  if (m.capabilityScore === 0) m.capabilityScore = avg(m.skills.map((s) => s.score))
}

export function getTeamMember(id: string) {
  return team.find((m) => m.id === id)!
}
