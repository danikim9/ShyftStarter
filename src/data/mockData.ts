import type {
  ChecklistGroup,
  Employee,
  EmployeeSkillScore,
  KillerScript,
  Mission,
  Quest,
  Shift,
  SkillId,
  SkillScorePoint,
} from '../types'
import { ALL_SKILL_ORDER } from './skills'

// ---------------------------------------------------------------------------
// Demo persona: 지은 (Jieun Kim), Sales Associate — Gangnam flagship store
// Narrative: Closing is her weakest stat AND the highest-revenue-impact one,
// so the AI engine has selected "Closing" as today's Performance Mission.
// ---------------------------------------------------------------------------

function history(points: number[], startDate: string): SkillScorePoint[] {
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

function buildSkill(skillId: SkillId, points: number[], confidence: number, evidenceCount: number): EmployeeSkillScore {
  const h = history(points, '2026-08-16')
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

export const CURRENT_EMPLOYEE_ID = 'emp_jieun'

export const employee: Employee = {
  id: CURRENT_EMPLOYEE_ID,
  name: '지은',
  role: 'Sales Associate',
  store: 'Gangnam',
  managerName: 'Kim M.',
  experienceLevel: '1년 6개월차',
  level: 3,
  xp: 1240,
  xpToNextLevel: 2000,
  skills: [
    buildSkill('coachability', [88, 90, 91, 93, 94], 0.91, 22),
    buildSkill('productKnowledge', [82, 85, 87, 89, 91], 0.88, 19),
    buildSkill('empathy', [80, 83, 85, 87, 89], 0.86, 18),
    buildSkill('discovery', [76, 79, 82, 85, 87], 0.84, 21),
    buildSkill('communication', [78, 80, 82, 84, 85], 0.82, 17),
    buildSkill('storytelling', [64, 66, 69, 71, 73], 0.71, 11),
    buildSkill('crossSell', [55, 57, 58, 60, 61], 0.68, 14),
    buildSkill('closing', [46, 50, 53, 55, 58], 0.84, 20),
  ],
}

export function getSkill(skillId: SkillId) {
  return employee.skills.find((s) => s.skillId === skillId)!
}

// ---------------------------------------------------------------------------
// Shifts — past (completed), today (the live shift), and upcoming
// ---------------------------------------------------------------------------

export const shifts: Shift[] = [
  { id: 'sh_1', employeeId: CURRENT_EMPLOYEE_ID, date: '2026-08-22', start: '14:00', end: '22:00', store: 'Gangnam', role: 'Sales Associate', managerName: 'Kim M.', status: 'completed' },
  { id: 'sh_2', employeeId: CURRENT_EMPLOYEE_ID, date: '2026-08-24', start: '14:00', end: '22:00', store: 'Gangnam', role: 'Sales Associate', managerName: 'Kim M.', status: 'completed' },
  { id: 'sh_3', employeeId: CURRENT_EMPLOYEE_ID, date: '2026-08-26', start: '10:00', end: '18:00', store: 'Gangnam', role: 'Sales Associate', managerName: 'Kim M.', status: 'completed' },
  { id: 'sh_4', employeeId: CURRENT_EMPLOYEE_ID, date: '2026-08-28', start: '14:00', end: '22:00', store: 'Gangnam', role: 'Sales Associate', managerName: 'Kim M.', status: 'completed' },
  { id: 'sh_today', employeeId: CURRENT_EMPLOYEE_ID, date: '2026-08-30', start: '14:00', end: '22:00', store: 'Gangnam', role: 'Sales Associate', managerName: 'Kim M.', status: 'in_progress', missionId: 'mi_today' },
  { id: 'sh_next1', employeeId: CURRENT_EMPLOYEE_ID, date: '2026-09-01', start: '10:00', end: '18:00', store: 'Gangnam', role: 'Sales Associate', managerName: 'Kim M.', status: 'upcoming' },
  { id: 'sh_next2', employeeId: CURRENT_EMPLOYEE_ID, date: '2026-09-03', start: '14:00', end: '22:00', store: 'Gangnam', role: 'Sales Associate', managerName: 'Kim M.', status: 'upcoming' },
]

export const todayShift = shifts.find((s) => s.id === 'sh_today')!

// ---------------------------------------------------------------------------
// Today's Mission — AI-generated focus for the live shift
// ---------------------------------------------------------------------------

export const todayMission: Mission = {
  id: 'mi_today',
  shiftId: 'sh_today',
  focusSkillId: 'closing',
  title: '클로징을 집중적으로 개선해보세요',
  why: '니즈 파악(87)·제품 지식(91)은 이미 강점이에요. 하지만 클로징(58)이 5시프트 연속 가장 낮은 역량이고, 동시에 매출에 가장 큰 영향을 주는 지표예요.',
  target: '자격을 갖춘 고객 응대에서 직접적인 클로징 질문 시도하기',
  businessPriority: '신제품 런칭 주간 · Cross-Sell 캠페인 진행 중',
}

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------

export const quests: Quest[] = [
  {
    id: 'q_closing_1',
    employeeId: CURRENT_EMPLOYEE_ID,
    missionId: 'mi_today',
    skillId: 'closing',
    type: 'practice',
    title: 'Practice Direct Closing',
    behavior: '자격을 갖춘 고객 3명에게 직접적인 클로징 질문을 시도하세요.',
    target: 3,
    progress: 1,
    unit: '명',
    rewardXp: 50,
    status: 'active',
    difficulty: 2,
  },
  {
    id: 'q_crosssell_1',
    employeeId: CURRENT_EMPLOYEE_ID,
    missionId: 'mi_today',
    skillId: 'crossSell',
    type: 'sell',
    title: 'Recommend a Complement',
    behavior: '피팅 또는 시연 직후 연관 상품을 1회 이상 추천하세요.',
    target: 2,
    progress: 0,
    unit: '회',
    rewardXp: 30,
    status: 'active',
    difficulty: 1,
  },
  {
    id: 'q_discovery_1',
    employeeId: CURRENT_EMPLOYEE_ID,
    missionId: 'mi_today',
    skillId: 'discovery',
    type: 'ask',
    title: 'Practice Discovery',
    behavior: '오늘 근무 중 최소 3개의 개방형 니즈 파악 질문을 하세요.',
    target: 3,
    progress: 2,
    unit: '개',
    rewardXp: 40,
    status: 'active',
    difficulty: 1,
  },
  {
    id: 'q_greeting_streak',
    employeeId: CURRENT_EMPLOYEE_ID,
    missionId: 'mi_today',
    skillId: 'communication',
    type: 'repeat',
    title: 'Greeting Streak',
    behavior: '고객 응대 시작 10초 이내에 자연스러운 첫인사를 건네세요.',
    target: 1,
    progress: 1,
    unit: '회',
    rewardXp: 30,
    status: 'completed',
    difficulty: 1,
  },
]

// ---------------------------------------------------------------------------
// Killer Scripts
// ---------------------------------------------------------------------------

export const killerScripts: Record<string, KillerScript> = {
  closing: {
    id: 'ks_closing',
    skillId: 'closing',
    situationLabel: '핵심 질문: "지금 뭐라고 말하지?"',
    beforeLabel: 'BEFORE (일반적인 질문)',
    beforeLine: '“어떤 걸 찾고 계세요?”',
    afterLine: '“오늘 주로 어떤 용도로 사용하실 생각이세요?”',
    followUpLine: '“그럼 그 중에서 가장 중요하게 보시는 부분은 어떤 걸까요?”',
  },
  crossSell: {
    id: 'ks_crosssell',
    skillId: 'crossSell',
    situationLabel: '핵심 질문: "지금 뭐라고 말하지?"',
    beforeLabel: 'BEFORE (일반적인 질문)',
    beforeLine: '“다른 것도 보여드릴까요?”',
    afterLine: '“이거 하나만 있으면 아쉬울 수 있는데, 같이 쓰면 훨씬 편한 제품이 있어요.”',
    followUpLine: '“혹시 같이 준비하시면 좋은 것도 안내해드릴까요?”',
  },
  discovery: {
    id: 'ks_discovery',
    skillId: 'discovery',
    situationLabel: '핵심 질문: "지금 뭐라고 말하지?"',
    beforeLabel: 'BEFORE (일반적인 질문)',
    beforeLine: '“뭐 찾으세요?”',
    afterLine: '“오늘 어떤 계기로 둘러보러 오셨어요?”',
    followUpLine: '“그 부분에서 가장 신경 쓰이시는 건 뭐예요?”',
  },
}

// ---------------------------------------------------------------------------
// Micro Checklist — pre/post interaction quick reference
// ---------------------------------------------------------------------------

export const checklistGroup: ChecklistGroup = {
  id: 'cl_today',
  missionId: 'mi_today',
  title: 'BEFORE RECOMMENDATION',
  items: [
    { id: 'c1', label: 'Ask Need', checked: true },
    { id: 'c2', label: 'Confirm Priority', checked: true },
    { id: 'c3', label: 'Personalize Recommendation', checked: false },
    { id: 'c4', label: 'Explain Why', checked: false },
    { id: 'c5', label: 'Check Response — 클로징 질문하기', checked: false },
  ],
}

export { ALL_SKILL_ORDER }
