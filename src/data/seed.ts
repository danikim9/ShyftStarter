// ---------------------------------------------------------------------------
// Bellatrix demo seed — Gangnam Flagship, 3 employees + 1 manager, ~3 weeks of
// interventions, engagement events, self-reports, manager observations and
// daily KPIs. Generated relative to "today" so the pilot demo is always live.
//
// The outcome data is deliberately shaped so that days on which at least one
// cross-sell action was COMPLETED have a modestly higher ATV / attach rate —
// enough for the rule-based insight engine to show an "early signal" while
// still being labelled as correlation, not causation.
// ---------------------------------------------------------------------------

import type {
  Action,
  ActionAssignment,
  ActionEvent,
  BehaviourEvidence,
  Company,
  ISODate,
  OutcomeEvent,
  Pilot,
  PilotParticipant,
  ProductEvent,
  Shift,
  ShiftReflection,
  Store,
  User,
} from '../types/bellatrix'
import { addDaysISO, atTime, toISODate } from '../lib/dates'
import { deriveKpis } from '../lib/analytics/metrics'

export interface SeedDatabase {
  seed_version: number
  companies: Company[]
  stores: Store[]
  users: User[]
  shifts: Shift[]
  actions: Action[]
  assignments: ActionAssignment[]
  action_events: ActionEvent[]
  evidence: BehaviourEvidence[]
  outcomes: OutcomeEvent[]
  reflections: ShiftReflection[]
  pilots: Pilot[]
  pilot_participants: PilotParticipant[]
  product_events: ProductEvent[]
}

export const SEED_VERSION = 3

export const COMPANY_ID = 'co_bellatrix_demo'
export const STORE_ID = 'st_gangnam'
export const MANAGER_ID = 'u_sora'
export const DANI_ID = 'u_dani'
export const MINA_ID = 'u_mina'
export const JOON_ID = 'u_joon'

// Deterministic PRNG so every install shows the same demo numbers.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ACTIONS: Action[] = [
  {
    id: 'act_discovery',
    title: '니즈 파악 질문 하나 하기',
    description: '고객이 주력 상품을 보기 시작하면 "주로 어떤 용도로 쓰실 계획이세요?"처럼 열린 질문을 한 번 던져보세요.',
    behaviour_type: 'discovery',
    intervention_type: 'action',
    target_metric: 'cvr',
    default_target_count: 5,
    coaching_text: '"필요하시면 말씀해주세요" 대신 → "주로 어떤 용도로 쓰실 계획이세요?"',
    active: true,
    created_at: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'act_accessory',
    title: '연관 부가상품 하나 제안하기',
    description: '고객이 주력 상품을 결정한 직후, 결제 전에 어울리는 부가상품을 하나만 제안해보세요.',
    behaviour_type: 'cross_sell',
    intervention_type: 'action',
    target_metric: 'attach_rate',
    default_target_count: 3,
    coaching_text: '결정 직후가 골든타임 — "이 제품이면 이 케이스랑 같이 쓰시는 분이 많아요" 한 문장.',
    active: true,
    created_at: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'act_compare',
    title: '두 가지 옵션 비교해 보여주기',
    description: '고민하는 고객에게 두 제품의 차이를 한 가지 기준으로 짧게 비교해 주세요.',
    behaviour_type: 'recommendation',
    intervention_type: 'action',
    target_metric: 'atv',
    default_target_count: 3,
    coaching_text: '"이건 A가 좋고, 이건 B가 좋아요" — 기준 하나로 비교하면 결정이 빨라져요.',
    active: true,
    created_at: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'act_demo',
    title: '핵심 기능 하나 직접 시연하기',
    description: '설명 대신 고객이 직접 만져보게 하세요. 기능 하나만.',
    behaviour_type: 'demo',
    intervention_type: 'action',
    target_metric: 'cvr',
    default_target_count: 3,
    coaching_text: '말로 3문장보다 손으로 10초.',
    active: true,
    created_at: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'act_closing',
    title: '클로징 질문 하나 하기',
    description: '충분히 설명했다면 "오늘 바로 가져가실까요?"처럼 결정을 묻는 질문으로 마무리해 보세요.',
    behaviour_type: 'closing',
    intervention_type: 'action',
    target_metric: 'cvr',
    default_target_count: 3,
    coaching_text: '질문 후 3초 기다리기.',
    active: true,
    created_at: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'mc_accessory',
    title: '연관 부가상품 하나 더하기',
    description: '고객이 주력 상품을 결정하면, 결제 전에 어울리는 부가상품을 하나만 제안해보세요.',
    behaviour_type: 'cross_sell',
    intervention_type: 'micro_coaching',
    target_metric: 'attach_rate',
    default_target_count: null,
    coaching_text:
      '고객이 주력 상품을 결정한 순간이 제안하기 가장 좋은 타이밍이에요.\n\n"이 모델 쓰시는 분들은 이 케이스를 같이 많이 가져가세요" — 한 문장만 더해보세요. 거절해도 괜찮아요. 제안 자체가 목표예요.',
    active: true,
    created_at: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'mc_discovery',
    title: '첫 질문을 바꿔보기',
    description: '"필요하시면 말씀해주세요" 대신 고객의 사용 목적을 묻는 질문으로 시작해보세요.',
    behaviour_type: 'discovery',
    intervention_type: 'micro_coaching',
    target_metric: 'cvr',
    default_target_count: null,
    coaching_text:
      '이렇게 말하는 대신:\n"필요하시면 말씀해주세요."\n\n이렇게 해보세요:\n"주로 어떤 용도로 쓰실 계획이세요?"\n\n고객이 답을 하는 순간부터 대화가 시작돼요.',
    active: true,
    created_at: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'mq_discovery',
    title: '고객 5명에게 니즈 파악 질문 쓰기',
    description: '오늘 응대하는 고객 5명에게 열린 질문으로 시작해 보세요.',
    behaviour_type: 'discovery',
    intervention_type: 'mini_quest',
    target_metric: 'cvr',
    default_target_count: 5,
    coaching_text: null,
    active: true,
    created_at: '2026-08-01T00:00:00.000Z',
  },
]

export function buildSeed(now: Date = new Date()): SeedDatabase {
  const rnd = mulberry32(20260910)
  const today = toISODate(now)
  const nowIso = now.toISOString()

  const company: Company = { id: COMPANY_ID, name: 'Bellatrix Demo Retail', vertical: 'electronics_retail', created_at: '2026-08-01T00:00:00.000Z' }
  const store: Store = {
    id: STORE_ID,
    company_id: COMPANY_ID,
    name: 'Gangnam Flagship Store',
    location: '서울 강남구',
    vertical: 'electronics_retail',
    attach_rate_definition: 'accessory_units_per_transaction',
    focus_metric: 'attach_rate',
    created_at: '2026-08-01T00:00:00.000Z',
  }
  const users: User[] = [
    { id: MANAGER_ID, name: 'Sora Kim', email: 'manager@demo.bellatrix.app', role: 'manager', store_id: STORE_ID, company_id: COMPANY_ID, created_at: '2026-08-01T00:00:00.000Z' },
    { id: DANI_ID, name: 'Dani Kim', email: 'dani@demo.bellatrix.app', role: 'employee', store_id: STORE_ID, company_id: COMPANY_ID, created_at: '2026-08-01T00:00:00.000Z' },
    { id: MINA_ID, name: 'Mina Lee', email: 'mina@demo.bellatrix.app', role: 'employee', store_id: STORE_ID, company_id: COMPANY_ID, created_at: '2026-08-01T00:00:00.000Z' },
    { id: JOON_ID, name: 'Joon Park', email: 'joon@demo.bellatrix.app', role: 'employee', store_id: STORE_ID, company_id: COMPANY_ID, created_at: '2026-08-01T00:00:00.000Z' },
  ]
  const employees = [DANI_ID, MINA_ID, JOON_ID]

  const shifts: Shift[] = []
  const assignments: ActionAssignment[] = []
  const action_events: ActionEvent[] = []
  const evidence: BehaviourEvidence[] = []
  const outcomes: OutcomeEvent[] = []
  const reflections: ShiftReflection[] = []

  const shiftFor = (userId: string, date: ISODate) => shifts.find((s) => s.user_id === userId && toISODate(new Date(s.start_at)) === date)

  // --- shifts: 21 past days, today, +2 future days -------------------------
  for (let offset = -21; offset <= 2; offset++) {
    const date = addDaysISO(today, offset)
    for (const uid of employees) {
      // Joon works 5 fixed days; Dani/Mina ~5/7 pseudo-randomly. Everyone works today.
      const works = offset === 0 ? true : uid === JOON_ID ? (offset + 100) % 7 !== 1 && (offset + 100) % 7 !== 4 : rnd() < 0.72
      if (!works) continue
      const late = uid === DANI_ID ? offset % 2 === 0 : rnd() < 0.5
      const startH = late ? 13 : 10
      const endH = late ? 21 : 18
      const status: Shift['status'] = offset < 0 ? 'completed' : offset === 0 ? 'in_progress' : 'scheduled'
      shifts.push({
        id: `sh_${uid}_${date}`,
        user_id: uid,
        store_id: STORE_ID,
        start_at: atTime(date, startH),
        end_at: atTime(date, endH),
        status,
        created_at: atTime(addDaysISO(date, -7), 9),
      })
    }
  }

  // --- past assignments + engagement + evidence ------------------------------
  const crossSellCompletedByDate = new Map<ISODate, number>()
  const anyCompletedByDate = new Map<ISODate, number>()

  let evSeq = 0
  const pushEvent = (a: ActionAssignment, type: ActionEvent['event_type'], at: string, progress: number | null) => {
    action_events.push({
      id: `ae_${a.id}_${evSeq++}`,
      action_assignment_id: a.id,
      user_id: a.assigned_to_user_id,
      shift_id: a.shift_id,
      event_type: type,
      event_at: at,
      progress_value: progress,
      metadata: null,
    })
  }

  for (let offset = -21; offset < 0; offset++) {
    const date = addDaysISO(today, offset)
    for (const uid of employees) {
      const shift = shiftFor(uid, date)
      if (!shift) continue
      const startH = new Date(shift.start_at).getHours()

      // Pilot design: Joon is in the CONTROL group → no cross-sell interventions.
      const plan: { action: Action; p: number }[] = [
        { action: ACTIONS[0], p: uid === MINA_ID ? 0.7 : 0.5 }, // discovery
        { action: ACTIONS[1], p: uid === JOON_ID ? 0 : 0.65 }, // accessory (cross-sell)
        { action: ACTIONS[2], p: 0.35 }, // compare
        { action: ACTIONS[3], p: uid === JOON_ID ? 0.6 : 0.25 }, // demo
      ]
      for (const { action, p } of plan) {
        if (rnd() >= p) continue
        const target = action.default_target_count ?? 3
        const a: ActionAssignment = {
          id: `asg_${uid}_${date}_${action.id}`,
          action_id: action.id,
          assigned_by_user_id: MANAGER_ID,
          assigned_to_user_id: uid,
          store_id: STORE_ID,
          shift_id: shift.id,
          assigned_date: date,
          target_count: target,
          target_metric: action.target_metric,
          status: 'assigned',
          created_at: atTime(date, 8, 30),
        }
        const roll = rnd()
        const engagement = uid === MINA_ID ? roll + 0.1 : uid === JOON_ID ? roll - 0.05 : roll
        pushEvent(a, 'viewed', atTime(date, startH, 5), null)
        if (engagement < 0.15) {
          a.status = 'skipped'
          pushEvent(a, 'skipped', atTime(date, startH, 20), null)
        } else if (engagement < 0.32) {
          a.status = 'expired'
          pushEvent(a, 'started', atTime(date, startH, 30), 0)
          pushEvent(a, 'progress_updated', atTime(date, startH + 3), 1)
          pushEvent(a, 'expired', atTime(date, startH + 8), 1)
        } else {
          a.status = 'completed'
          pushEvent(a, 'started', atTime(date, startH, 30), 0)
          for (let i = 1; i < target; i++) pushEvent(a, 'progress_updated', atTime(date, startH + 1 + i), i)
          pushEvent(a, 'completed', atTime(date, startH + 6, 40), target)
          anyCompletedByDate.set(date, (anyCompletedByDate.get(date) ?? 0) + 1)
          if (action.behaviour_type === 'cross_sell') crossSellCompletedByDate.set(date, (crossSellCompletedByDate.get(date) ?? 0) + 1)
          // self-report check-in (low confidence by definition)
          const bucket = rnd() < 0.55 ? '3-5' : rnd() < 0.5 ? '5+' : '1-2'
          evidence.push({
            id: `ev_self_${a.id}`,
            user_id: uid,
            store_id: STORE_ID,
            shift_id: shift.id,
            action_id: action.id,
            action_assignment_id: a.id,
            behaviour_type: action.behaviour_type,
            evidence_source: 'employee_self_report',
            evidence_value: bucket,
            confidence_level: 'low',
            observer_user_id: null,
            helpfulness: rnd() < 0.5 ? 'very_helpful' : 'a_little',
            coaching_needed: null,
            note: null,
            observed_at: atTime(date, startH + 6, 41),
            created_at: atTime(date, startH + 6, 41),
          })
        }
        assignments.push(a)
      }

      // Manager observations — sampled, not every employee every day (~40%).
      if (rnd() < 0.4) {
        const obsAt = atTime(date, startH + 2, 15)
        const behaviours: { b: BehaviourEvidence['behaviour_type']; pObserved: number }[] = [
          { b: 'discovery', pObserved: uid === MINA_ID ? 0.8 : 0.5 },
          { b: 'demo', pObserved: uid === JOON_ID ? 0.75 : 0.45 },
          { b: 'cross_sell', pObserved: uid === JOON_ID ? 0.2 : crossSellCompletedByDate.has(date) ? 0.7 : 0.35 },
        ]
        for (const { b, pObserved } of behaviours) {
          if (rnd() < 0.25) continue // not checked
          evidence.push({
            id: `ev_obs_${uid}_${date}_${b}`,
            user_id: uid,
            store_id: STORE_ID,
            shift_id: shift.id,
            action_id: null,
            action_assignment_id: null,
            behaviour_type: b,
            evidence_source: 'manager_observation',
            evidence_value: rnd() < pObserved ? 'observed' : 'not_observed',
            confidence_level: 'high',
            observer_user_id: MANAGER_ID,
            helpfulness: null,
            coaching_needed: rnd() < 0.2,
            note: null,
            observed_at: obsAt,
            created_at: obsAt,
          })
        }
      }

      // Dani reflects on most of her shifts
      if (uid === DANI_ID && rnd() < 0.8) {
        const dominant: ShiftReflection['dominant_behaviour'][] = ['discovery', 'cross_sell', 'recommendation', 'demo']
        reflections.push({
          id: `refl_${uid}_${date}`,
          user_id: uid,
          shift_id: shift.id,
          dominant_behaviour: dominant[Math.floor(rnd() * dominant.length)],
          perceived_sales_level: crossSellCompletedByDate.has(date) ? (rnd() < 0.6 ? 'higher' : 'similar') : rnd() < 0.5 ? 'similar' : 'lower',
          coaching_helpfulness: (3 + Math.floor(rnd() * 3)) as ShiftReflection['coaching_helpfulness'],
          note: null,
          created_at: atTime(date, new Date(shift.end_at).getHours(), 5),
        })
      }
    }

    // --- daily store KPI (manual entry by manager) --------------------------
    const dow = new Date(atTime(date, 12)).getDay()
    const weekend = dow === 0 || dow === 6
    const visitors = Math.round((weekend ? 250 : 190) + rnd() * 50)
    const baseCvr = 0.235 + (rnd() - 0.5) * 0.04
    const transactions = Math.round(visitors * baseCvr)
    const crossLift = (crossSellCompletedByDate.get(date) ?? 0) > 0 ? 1.1 + rnd() * 0.05 : 1 + (rnd() - 0.5) * 0.03
    const atv = Math.round((104000 + (rnd() - 0.5) * 8000) * crossLift)
    const revenue = atv * transactions
    const accessoryRate = (0.28 + (rnd() - 0.5) * 0.06) * ((crossSellCompletedByDate.get(date) ?? 0) > 0 ? 1.18 : 1)
    const accessory_units = Math.round(transactions * accessoryRate)
    const units = transactions + accessory_units + Math.round(transactions * 0.12 * rnd())
    const raw = { visitors, transactions, revenue, units, accessory_units, accessory_transactions: Math.round(accessory_units * 0.85) }
    const derived = deriveKpis(raw, store.attach_rate_definition)
    outcomes.push({
      id: `out_${STORE_ID}_${date}`,
      company_id: COMPANY_ID,
      store_id: STORE_ID,
      user_id: null,
      shift_id: null,
      outcome_date: date,
      ...raw,
      ...derived,
      source: 'manual',
      created_at: atTime(addDaysISO(date, 1), 9, 30),
    })
  }

  // --- today: live assignments for the demo flow -----------------------------
  const daniToday = shiftFor(DANI_ID, today)!
  const minaToday = shiftFor(MINA_ID, today)!
  const joonToday = shiftFor(JOON_ID, today)!

  const mk = (uid: string, shift: Shift, action: Action, target: number | null): ActionAssignment => ({
    id: `asg_${uid}_${today}_${action.id}`,
    action_id: action.id,
    assigned_by_user_id: MANAGER_ID,
    assigned_to_user_id: uid,
    store_id: STORE_ID,
    shift_id: shift.id,
    assigned_date: today,
    target_count: target,
    target_metric: action.target_metric,
    status: 'assigned',
    created_at: atTime(today, 8, 30),
  })

  const daniCoaching = mk(DANI_ID, daniToday, ACTIONS[5], null) // micro coaching: accessory
  const daniDiscovery = mk(DANI_ID, daniToday, ACTIONS[0], 5)
  daniDiscovery.status = 'in_progress'
  const daniAccessory = mk(DANI_ID, daniToday, ACTIONS[1], 3)
  daniAccessory.status = 'in_progress'
  assignments.push(daniCoaching, daniDiscovery, daniAccessory)
  pushEvent(daniDiscovery, 'viewed', atTime(today, 9, 2), null)
  pushEvent(daniDiscovery, 'started', atTime(today, 9, 3), 0)
  pushEvent(daniDiscovery, 'progress_updated', atTime(today, 10, 10), 1)
  pushEvent(daniDiscovery, 'progress_updated', atTime(today, 10, 45), 2)
  pushEvent(daniDiscovery, 'progress_updated', atTime(today, 11, 30), 3)
  pushEvent(daniAccessory, 'viewed', atTime(today, 9, 2), null)
  pushEvent(daniAccessory, 'started', atTime(today, 9, 4), 0)
  pushEvent(daniAccessory, 'progress_updated', atTime(today, 11, 0), 1)

  assignments.push(mk(MINA_ID, minaToday, ACTIONS[1], 3), mk(MINA_ID, minaToday, ACTIONS[6], null), mk(MINA_ID, minaToday, ACTIONS[2], 3))
  assignments.push(mk(JOON_ID, joonToday, ACTIONS[3], 3), mk(JOON_ID, joonToday, ACTIONS[7], 5))

  const pilots: Pilot[] = [
    {
      id: 'pl_gangnam_attach',
      company_id: COMPANY_ID,
      store_id: STORE_ID,
      name: 'Gangnam Attach Rate Pilot',
      start_date: addDaysISO(today, -21),
      end_date: addDaysISO(today, 21),
      target_behaviour: 'cross_sell',
      target_metric: 'attach_rate',
      status: 'active',
    },
  ]
  const pilot_participants: PilotParticipant[] = [
    { id: 'pp_dani', pilot_id: 'pl_gangnam_attach', user_id: DANI_ID, group_type: 'intervention' },
    { id: 'pp_mina', pilot_id: 'pl_gangnam_attach', user_id: MINA_ID, group_type: 'intervention' },
    { id: 'pp_joon', pilot_id: 'pl_gangnam_attach', user_id: JOON_ID, group_type: 'control' },
  ]

  return {
    seed_version: SEED_VERSION,
    companies: [company],
    stores: [store],
    users,
    shifts,
    actions: ACTIONS,
    assignments,
    action_events,
    evidence,
    outcomes,
    reflections,
    pilots,
    pilot_participants,
    product_events: [{ id: 'pe_seed', user_id: MANAGER_ID, event_name: 'app_opened', occurred_at: nowIso, properties: { seed: true } }],
  }
}
