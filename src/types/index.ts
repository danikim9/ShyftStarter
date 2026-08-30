// ShyftStarter — core domain types
// Mirrors the conceptual data model in Shyftstarter_CTO.pdf (p.22)

export type SkillId =
  | 'discovery'
  | 'empathy'
  | 'productKnowledge'
  | 'communication'
  | 'storytelling'
  | 'crossSell'
  | 'closing'
  | 'coachability'

export interface Skill {
  id: SkillId
  nameKo: string
  nameEn: string
  category: 'core' | 'growth'
  description: string
}

export interface SkillScorePoint {
  shiftIndex: number
  date: string
  score: number
}

export interface EmployeeSkillScore {
  skillId: SkillId
  score: number
  confidence: number // 0-1
  previousScore: number
  trendDelta: number // score - previousScore, over N shifts
  evidenceCount: number
  history: SkillScorePoint[]
}

export type PerformanceLevel = 1 | 2 | 3 | 4 | 5

export const LEVEL_LABELS: Record<PerformanceLevel, string> = {
  1: 'Explorer',
  2: 'Practitioner',
  3: 'Performer',
  4: 'Expert',
  5: 'Master',
}

export interface Employee {
  id: string
  name: string
  role: string
  store: string
  managerName: string
  experienceLevel: string
  level: PerformanceLevel
  xp: number
  xpToNextLevel: number
  skills: EmployeeSkillScore[]
}

export type ShiftStatus = 'completed' | 'in_progress' | 'upcoming'

export interface Shift {
  id: string
  employeeId: string
  date: string
  start: string
  end: string
  store: string
  role: string
  managerName: string
  status: ShiftStatus
  missionId?: string
}

export interface Mission {
  id: string
  shiftId: string
  focusSkillId: SkillId
  title: string
  why: string
  target: string
  businessPriority: string
}

export type QuestType = 'practice' | 'ask' | 'sell' | 'observe' | 'repeat'
export type QuestStatus = 'active' | 'completed'

export interface Quest {
  id: string
  employeeId: string
  missionId: string
  skillId: SkillId
  type: QuestType
  title: string
  behavior: string
  target: number
  progress: number
  unit: string
  rewardXp: number
  status: QuestStatus
  difficulty: 1 | 2 | 3
}

export interface KillerScript {
  id: string
  skillId: SkillId
  situationLabel: string
  beforeLabel: string
  beforeLine: string
  afterLine: string
  followUpLine: string
}

export interface ChecklistItem {
  id: string
  label: string
  checked: boolean
}

export interface ChecklistGroup {
  id: string
  missionId: string
  title: string
  items: ChecklistItem[]
}

export type NextActionType =
  | 'PRACTICE' | 'LEARN' | 'ASK' | 'SELL' | 'COACH'
  | 'OBSERVE' | 'REPEAT' | 'ESCALATE' | 'RECOGNIZE'

export interface CoachingCard {
  id: string
  skillId: SkillId
  what: string
  why: string
  nextAction: {
    type: NextActionType
    label: string
    durationMin: number
  }
  generatedAt: string
}

export interface AiNudge {
  id: string
  skillId: SkillId
  message: string
}
