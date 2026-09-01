import type {
  ChecklistGroup,
  Employee,
  KillerScript,
  Mission,
  Quest,
  Shift,
  SkillId,
} from '../types'
import { ALL_SKILL_ORDER } from './skills'
import { KILLER_SCRIPT_VARIANTS } from './coachingContent'
import { buildSkillScore } from '../lib/skillBuilder'

// ---------------------------------------------------------------------------
// Demo persona: 지은 (Jieun Kim), Sales Associate — Gangnam flagship store
// Narrative: Closing is her weakest stat AND the highest-revenue-impact one,
// so the AI engine has selected "Closing" as today's Performance Mission.
// ---------------------------------------------------------------------------

const buildSkill = buildSkillScore

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
  { id: 'sh_off1', employeeId: CURRENT_EMPLOYEE_ID, date: '2026-08-31', start: '', end: '', store: 'Gangnam', role: 'Sales Associate', managerName: 'Kim M.', status: 'off' },
  { id: 'sh_next1', employeeId: CURRENT_EMPLOYEE_ID, date: '2026-09-01', start: '10:00', end: '18:00', store: 'Gangnam', role: 'Sales Associate', managerName: 'Kim M.', status: 'upcoming' },
  { id: 'sh_off2', employeeId: CURRENT_EMPLOYEE_ID, date: '2026-09-02', start: '', end: '', store: 'Gangnam', role: 'Sales Associate', managerName: 'Kim M.', status: 'off' },
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
// Killer Scripts — each skill has 1+ variants; the app cycles through them
// via "SHOW ANOTHER". Primary variant is authored per-skill below; extra
// variants come from the generic coaching content library.
// ---------------------------------------------------------------------------

const PRIMARY_KILLER_SCRIPTS: Record<SkillId, Omit<KillerScript, 'id'>> = {
  closing: {
    skillId: 'closing',
    situationLabel: '핵심 질문: "지금 뭐라고 말하지?"',
    beforeLabel: 'BEFORE (일반적인 질문)',
    beforeLine: '“어떤 걸 찾고 계세요?”',
    afterLine: '“오늘 주로 어떤 용도로 사용하실 생각이세요?”',
    followUpLine: '“그럼 그 중에서 가장 중요하게 보시는 부분은 어떤 걸까요?”',
  },
  crossSell: {
    skillId: 'crossSell',
    situationLabel: '핵심 질문: "지금 뭐라고 말하지?"',
    beforeLabel: 'BEFORE (일반적인 질문)',
    beforeLine: '“다른 것도 보여드릴까요?”',
    afterLine: '“이거 하나만 있으면 아쉬울 수 있는데, 같이 쓰면 훨씬 편한 제품이 있어요.”',
    followUpLine: '“혹시 같이 준비하시면 좋은 것도 안내해드릴까요?”',
  },
  discovery: {
    skillId: 'discovery',
    situationLabel: '핵심 질문: "지금 뭐라고 말하지?"',
    beforeLabel: 'BEFORE (일반적인 질문)',
    beforeLine: '“뭐 찾으세요?”',
    afterLine: '“오늘 어떤 계기로 둘러보러 오셨어요?”',
    followUpLine: '“그 부분에서 가장 신경 쓰이시는 건 뭐예요?”',
  },
  empathy: {
    skillId: 'empathy',
    situationLabel: '핵심 질문: "지금 뭐라고 말하지?"',
    beforeLabel: 'BEFORE (일반적인 질문)',
    beforeLine: '“네, 알겠습니다.”',
    afterLine: '“그 부분 때문에 번거로우셨겠어요. 저라도 그랬을 것 같아요.”',
    followUpLine: '“혹시 이전에도 비슷한 걸 써보신 적 있으세요?”',
  },
  productKnowledge: {
    skillId: 'productKnowledge',
    situationLabel: '핵심 질문: "지금 뭐라고 말하지?"',
    beforeLabel: 'BEFORE (일반적인 질문)',
    beforeLine: '“이 제품은 A, B, C 기능이 있어요.”',
    afterLine: '“이 기능 덕분에 지금 불편해하시던 부분이 훨씬 편해지실 거예요.”',
    followUpLine: '“방금 말씀드린 것 중 가장 궁금하신 부분이 있을까요?”',
  },
  communication: {
    skillId: 'communication',
    situationLabel: '핵심 질문: "지금 뭐라고 말하지?"',
    beforeLabel: 'BEFORE (일반적인 질문)',
    beforeLine: '(대기 고객을 그냥 지나침)',
    afterLine: '“잠시만요, 금방 도와드릴게요!”',
    followUpLine: '“기다려주셔서 감사해요 — 지금부터 편하게 봐드릴게요.”',
  },
  storytelling: {
    skillId: 'storytelling',
    situationLabel: '핵심 질문: "지금 뭐라고 말하지?"',
    beforeLabel: 'BEFORE (일반적인 질문)',
    beforeLine: '“이건 이런 기능이 있어요.”',
    afterLine: '“이걸 쓰시면 하루 중 이 순간이 이렇게 달라지실 거예요.”',
    followUpLine: '“실제로 써보시면 그 차이가 더 확실히 느껴지실 거예요.”',
  },
  coachability: {
    skillId: 'coachability',
    situationLabel: '핵심 질문: "지금 뭐라고 말하지?"',
    beforeLabel: 'BEFORE (일반적인 질문)',
    beforeLine: '(피드백을 다음 응대에 반영하지 않음)',
    afterLine: '“방금 받은 피드백, 바로 다음 고객분께 적용해볼게요.”',
    followUpLine: '“이번엔 어떤 점이 달라졌는지 스스로 체크해볼게요.”',
  },
}

export function getKillerScripts(skillId: SkillId): KillerScript[] {
  const primary = PRIMARY_KILLER_SCRIPTS[skillId]
  const extras = KILLER_SCRIPT_VARIANTS[skillId] ?? []
  return [
    { id: `ks_${skillId}_0`, ...primary },
    ...extras.map((v, i) => ({
      id: `ks_${skillId}_${i + 1}`,
      skillId,
      situationLabel: primary.situationLabel,
      beforeLabel: primary.beforeLabel,
      beforeLine: `“${v.before}”`,
      afterLine: `“${v.after}”`,
      followUpLine: `“${v.followUp}”`,
    })),
  ]
}

// Back-compat single-script lookup (first/primary variant only)
export const killerScripts: Record<SkillId, KillerScript> = Object.fromEntries(
  ALL_SKILL_ORDER.map((id) => [id, getKillerScripts(id)[0]])
) as Record<SkillId, KillerScript>

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
