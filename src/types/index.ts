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

export type ShiftStatus = 'completed' | 'in_progress' | 'upcoming' | 'off'

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

// ---------------------------------------------------------------------------
// Manager Dashboard — Will × Capability & team coaching
// ---------------------------------------------------------------------------

export type WillCapabilityQuadrant = 'star' | 'grower' | 'disengaged' | 'atRisk'

export const QUADRANT_META: Record<
  WillCapabilityQuadrant,
  { label: string; short: string; color: string; action: string }
> = {
  star: { label: '스타 플레이어', short: 'High Will · High Capability', color: '#22c55e', action: '인정 + 리더십 기회 부여' },
  grower: { label: '성장형 인재', short: 'High Will · Growing Capability', color: '#5b5ff2', action: '집중 코칭 + 연습 기회 확대' },
  disengaged: { label: '몰입 저하', short: 'Low Will · High Capability', color: '#f5a524', action: '1:1 면담으로 동기 원인 파악' },
  atRisk: { label: '즉각 개입 필요', short: 'Low Will · Low Capability', color: '#ef4444', action: '명확한 기대치 설정 + 밀착 관리' },
}

export interface ManagerActionSummary {
  whatMatters: string
  why: string
  whatToDo: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  store: string
  tenure: string
  avatarColor: string
  skills: EmployeeSkillScore[]
  capabilityScore: number // 0-100, aggregate
  willScore: number // 0-100, derived from engagement behavior (not survey)
  willBasis: string // short explanation of what the will score is derived from
  needsAttention: boolean
  signal: string
  kpi: { cvr: number; aov: number }
  activity: { questCompletionRate: number; coachingHistoryCount: number; learningCompletedCount: number }
  moodHistory: MoodValue[] // last 5 shifts, one-tap check-in
  aiSummary: ManagerActionSummary
}

export interface CoachingGuideStep {
  step: string
  prompt: string
}

export interface ManagerQuestDraft {
  name: string
  behavior: string
  assignTo: string
  startDate: string
  endDate: string
  difficulty: 1 | 2 | 3
  rewardXp: number
  kpiConnection: string
  aiPersonalization: boolean
}

// ---------------------------------------------------------------------------
// Shift-start mood / condition check-in — one-tap, <1s, no free text.
// Used as one input (alongside behavior signals) into the Will(참여도) score.
// ---------------------------------------------------------------------------

export type MoodValue = 1 | 2 | 3 | 4 | 5

export interface MoodEntry {
  shiftId: string
  date: string
  value: MoodValue
}

// ---------------------------------------------------------------------------
// P1 — Microlearning
// ---------------------------------------------------------------------------

export interface LearningModule {
  id: string
  skillId: SkillId
  title: string
  why: string
  durationMin: number
  outcome: string
  tips: string[]
}

// ---------------------------------------------------------------------------
// P1 — AI Role-play (text-based only, no voice)
// ---------------------------------------------------------------------------

export interface RolePlayScenario {
  skillId: SkillId
  title: string
  customerLine: string
}

export interface RolePlayAxisScores {
  empathy: number
  structure: number
  valueComm: number
  objection: number
  closing: number
}

export interface RolePlayResult {
  overall: number
  axes: RolePlayAxisScores
  tip: string
}

// ---------------------------------------------------------------------------
// P1 — Progress (Longitudinal Growth · Skill Trajectory)
// ---------------------------------------------------------------------------

export type ProgressRange = 'weekly' | 'monthly'

export interface ProgressPoint {
  label: string
  capabilityScore: number
}

export interface Milestone {
  id: string
  emoji: string
  title: string
  detail: string
  achievedDate: string
}

export interface ProgressSummary {
  currentStreakDays: number
  longestStreakDays: number
  totalShiftsLogged: number
  totalQuestsCompleted: number
  totalLearningCompleted: number
}

// ---------------------------------------------------------------------------
// P1~P2 — Team (Recognition · Team Challenge · Leaderboard, 기업별 On/Off)
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  employeeId: string
  name: string
  avatarColor: string
  role: string
  store: string
  score: number
  isMe: boolean
}

export type RecognitionSource = 'manager' | 'peer' | 'ai'

export interface RecognitionEvent {
  id: string
  employeeId: string
  employeeName: string
  message: string
  date: string
  fromRole: RecognitionSource
}

export interface TeamChallenge {
  id: string
  title: string
  description: string
  progress: number
  target: number
  unit: string
  endsIn: string
  rewardNote: string
}

// ---------------------------------------------------------------------------
// P2 — Executive Dashboard: Organization Performance · Store/Region Comparison
// · Capability Map · KPI Correlation ("Behavior-to-Outcome") · Training/Coaching
// ROI · Brand Alignment. CTO 문서 07p(Persona 3) 기준.
//
// 설계 원칙(CTO 문서 24p RBAC와 일관): Executive/Admin 역할은 매장·조직 단위
// 집계만 본다 — 개별 직원 이름·점수는 노출하지 않는다 (그건 Manager 권한).
// ---------------------------------------------------------------------------

export interface StorePerformance {
  id: string
  name: string
  region: string
  employeeCount: number
  capabilityScore: number // store avg, 0-100
  engagementScore: number // store avg Will score, 0-100
  checklistCompletionRate: number // 0-100 — the behavior signal
  trainingCompletionRate: number // 0-100 — microlearning + role-play completion
  atv: number // average transaction value, KRW — the outcome signal
  cvr: number // conversion rate, %
  coachingSessionsPerEmployee: number
}

export interface OrgSkillPoint {
  skillId: SkillId
  baseline: number // avg score before platform rollout
  current: number
}

// ---------------------------------------------------------------------------
// v2 — Shift Companion MVP: Schedule → Shift → Action → Growth
//
// "Action" replaces Quest/Checklist as the single going-forward concept for
// self-serve + manager-pushed to-dos (strategy doc §5-3). The old Quest /
// ChecklistItem types above are kept as-is for the hidden Business+ screens
// (Coach/Stats/old Team) — nothing there was deleted, just unwired from nav.
// ---------------------------------------------------------------------------

export type ActionKind = 'checklist' | 'quest'
export type ActionSource = 'self' | 'manager' | 'ai'

export interface Action {
  id: string
  kind: ActionKind
  title: string
  createdBy: ActionSource
  createdByName?: string // set when createdBy === 'manager', e.g. "Kim M."
  target: number
  progress: number
  dueLabel?: string // lightweight, human text ("오늘 마감") — no full scheduling engine in MVP
  completedAt?: string // ISO timestamp — set the moment progress reaches target
  assignedToAll?: boolean // manager-pushed team-wide action
}

/** §5-2 — silent event log. Not surfaced in MVP UI, but recorded from day one
 * so a real Employee Performance Graph can be built later without having to
 * reconstruct history. */
export interface ActionEvent {
  actionId: string
  employeeId: string
  shiftId?: string
  kind: ActionKind
  completedAt: string
}

export interface HandoverNote {
  id: string
  shiftId: string
  storeId: string
  fromEmployeeId: string
  fromEmployeeName: string
  message: string
  createdAt: string
}

export interface Reaction {
  emoji: string
  employeeIds: string[]
}

export interface Comment {
  id: string
  employeeId: string
  employeeName: string
  message: string
  createdAt: string
}

// 19차 — 공지 작성 권한을 매니저 전용에서 팀원 전체로 확장. authorRole은 이제
// 실제 작성 주체를 그대로 기록해 카드에서 "관리자 공지" 배지 등 시각적으로
// 구분하는 데 쓰인다. 'employee'가 남긴 공지는 상단 고정(pinned) 권한이 없다
// (고정은 여전히 매니저만 — TeamActionsComposer 참고).
export interface Announcement {
  id: string
  storeId: string
  authorName: string
  authorRole: 'manager' | 'employee' | 'system'
  message: string
  pinned: boolean
  createdAt: string
  reactions: Reaction[]
  comments: Comment[]
}

/** A feed item is either an Announcement or a HandoverNote, merged and sorted
 * by time for the Team tab. */
export type FeedItem =
  | { type: 'announcement'; data: Announcement }
  | { type: 'handover'; data: HandoverNote }

// ---------------------------------------------------------------------------
// 팀 소속 상태 — v2 전략 문서 §9 "매장 / 부서 / 동료 그룹 3층 모델" 반영.
// 'none': 아직 아무 팀에도 속하지 않은 솔로 상태.
// 'crew': 직원이 매니저 없이 스스로 만들거나 참여한 "동료 그룹"(Free 티어) —
//   일정 공유 + 근무 교대 요청까지만 열린다. 공지·인수인계 피드·매니저
//   대시보드는 열리지 않는다(그건 여전히 매장/Team 티어의 가치).
// 'store': 매니저가 발급한 매장 코드로 참여한 상태(Team 티어) — 기존 전체
//   기능(공지·인수인계·팀 액션)이 모두 열린다.
// ---------------------------------------------------------------------------
export type TeamMembership = 'none' | 'crew' | 'store'

// ---------------------------------------------------------------------------
// PRO — 근무 교대(Shift Swap) 요청. 16차 개편: 매니저가 아니라 "상대 팀원"이
// 승인 주체다 — 요청을 받은 팀원이 직접 승인/거절하고, 승인되는 즉시 두 날짜의
// 근무 배정이 두 사람 사이에서 실제로 교환된다. 매니저는 승인 권한이 없고,
// 승인된 교대에 대한 알림(FYI)만 받는다. roster.ts의 팀 전체 근무표
// (memberId → date → RosterEntry) 위에서 동작.
// ---------------------------------------------------------------------------

export type SwapRequestStatus = 'pending' | 'approved' | 'rejected'

export interface SwapRequest {
  id: string
  requesterId: string
  requesterName: string
  requesterShiftDate: string
  targetMemberId: string
  targetMemberName: string
  targetShiftDate: string
  note?: string
  status: SwapRequestStatus
  createdAt: string
  respondedAt?: string // 상대 팀원이 승인/거절한 시각
  managerNotifiedAt?: string // 승인되는 순간 매니저에게 알림이 간 시각 — 승인 권한이 아니라 FYI
}

// ---------------------------------------------------------------------------
// 개인 알람/리마인더 — 근무 시작 전 알림 + 사용자가 직접 만드는 커스텀 리마인더.
// 브라우저 탭이 열려 있는 동안 인앱 토스트 + (권한 허용 시) Notification API로
// 실제 동작한다. 커스텀 리마인더는 오늘 기준 실제 시각과 비교해 정말로 울리고,
// 근무 시작 알림은 "다음 근무 X분 전"이라는 설정/문구까지는 실제로 동작하되,
// 데모의 오늘 날짜(내러티브)와 실제 접속 시각이 다를 수 있어 "지금 테스트" 버튼으로
// 확인하도록 설계했다 — 실제 백엔드가 붙으면 이 offsetMinutes 값 그대로 진짜 예약
// 푸시에 쓸 수 있다.
// ---------------------------------------------------------------------------

export type ReminderKind = 'shiftStart' | 'custom'

export interface Reminder {
  id: string
  kind: ReminderKind
  label: string
  offsetMinutes?: number // shiftStart 전용 — 근무 시작 몇 분 전
  time?: string // custom 전용 — 'HH:MM' (24h), 오늘 기준
  enabled: boolean
  createdAt: string
  lastFiredAt?: string
}

// ---------------------------------------------------------------------------
// 21차 — 예상 급여 계산기. "정확한 급여"가 아니라 "대략 이 정도"를 보여주는
// 추정치다. 공휴수당·연장수당처럼 계산이 복잡해지는 항목은 자동으로 계산하지
// 않고, 사용자가 일한 시간을 직접 입력하면 시급 × overtimeMultiplier로
// 단순 가산한다 — 정확성보다 "매 근무 후 확인하는 습관"을 만드는 게 목적.
// ---------------------------------------------------------------------------

export interface WageSettings {
  hourlyWage: number // 원 단위, 사용자가 직접 입력 — 0이면 아직 설정 전
  overtimeMultiplier: number // 공휴수당/연장수당 가산 배율 (기본 1.5, 단순화된 모델)
}

export interface ExtraPayEntry {
  id: string
  label: string // 예: "추석 연휴 근무", "저녁 연장 2시간"
  hours: number
  createdAt: string
}
