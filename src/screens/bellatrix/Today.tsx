import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Sparkles, MoonStar, CalendarPlus, Check, Plus, Users, Megaphone, ClipboardPen, BookOpen, Target } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../lib/bellatrixStore'
import { useAppState } from '../../lib/store'
import { activeGoals, assignmentsFor, cardById, goalAttemptsOn, nextShiftFor, pickPrepCard, prepForShift, reflectionForShift, todayShiftFor, viewAssignments, type AssignmentView } from '../../lib/selectors'
import { addDaysISO, dateOf, fmtDateKo, fmtShortDate, fmtTimeHM, weekKey } from '../../lib/dates'
import { BEHAVIOUR_LABEL } from '../../types/bellatrix'
import type { CoachingCard, PersonalGoal, Shift, StoreDataset, User } from '../../types/bellatrix'
import { Card, SectionLabel, Badge, PrimaryButton } from '../../components/ui'
import { ErrorState, LoadingState } from '../../components/bellatrix/shared'
import { DemoBadge } from '../../components/bellatrix/DemoBadge'
import type { TabId } from '../../components/BottomNav'

// 오늘 = the whole loop on one screen, driven by where the shift is right now:
//   근무 전  오늘의 미션 확인 (Shift Prep, 30초)
//   근무 중  "시도했어요" 한 번 탭 · 인수인계 남기기
//   근무 후  5초 회고 → 성장
// Below the hero: 팀 소식 and 이번 주 근무 — the two reasons to open the app on a
// day with nothing to do. Goal management lives one tap away (목표 · 팀 액션).

type Phase = 'before' | 'during' | 'after'

function phaseOf(shift: Shift, nowIso: string): Phase {
  if (nowIso < shift.start_at) return 'before'
  if (nowIso < shift.end_at) return 'during'
  return 'after'
}

/** The one thing to do this shift. Team action first, then the personal goal,
 * then a card matching interests — same order Shift Prep uses. */
interface Mission {
  card: CoachingCard
  assignment: AssignmentView | null
  goal: PersonalGoal | null
  count: number
  target: number | null
  prepped: boolean
}

function missionFor(data: StoreDataset, user: User, shift: Shift | null, date: string): Mission | null {
  const prep = shift ? prepForShift(data, user.id, shift.id) : null
  const views = viewAssignments(data, assignmentsFor(data, user.id, date))
  let card: CoachingCard | null = null
  let assignment: AssignmentView | null = null
  let goal: PersonalGoal | null = null
  if (prep) {
    card = cardById(data, prep.coaching_card_id)
    assignment = views.find((v) => v.assignment.id === prep.action_assignment_id) ?? null
    goal = data.personal_goals.find((g) => g.id === prep.personal_goal_id && g.active) ?? null
  } else {
    const picked = pickPrepCard(data, user, date)
    if (picked) {
      card = picked.card
      assignment = picked.assignment ? (views.find((v) => v.assignment.id === picked.assignment!.id) ?? null) : null
      goal = picked.goal
    }
  }
  if (!card) return null
  if (!goal) goal = activeGoals(data, user.id).find((g) => g.behaviour_type === card!.behaviour_type) ?? null
  const countable = assignment && assignment.action.intervention_type !== 'micro_coaching' ? assignment : null
  const count = countable ? countable.progress : goal ? goalAttemptsOn(data, goal.id, date) : 0
  const target = countable ? countable.target : goal ? goal.target_count : null
  return { card, assignment, goal, count, target, prepped: !!prep }
}

function WeekStrip({ shifts, today, onOpen }: { shifts: Shift[]; today: string; onOpen: () => void }) {
  const monday = weekKey(today)
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(monday, i))
  const DOW = ['월', '화', '수', '목', '금', '토', '일']
  return (
    <button onClick={onOpen} className="w-full text-left">
      <Card className="active:scale-[0.99] transition">
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            const s = shifts.find((x) => dateOf(x.start_at) === d)
            const isToday = d === today
            return (
              <div key={d} className={`rounded-lg px-0.5 py-1.5 text-center ${isToday ? 'bg-brand-500/10' : ''}`}>
                <div className={`text-[10px] ${isToday ? 'text-brand-700 font-bold' : 'text-ink-950/40'}`}>{DOW[i]}</div>
                <div className={`text-xs font-semibold tabular-nums ${isToday ? 'text-brand-700' : 'text-ink-950/75'}`}>{d.slice(8)}</div>
                <div className={`text-[9px] tabular-nums leading-tight mt-0.5 ${s ? 'text-ink-950/60' : 'text-ink-950/20'}`}>{s ? `${fmtTimeHM(s.start_at).slice(0, 5)}` : '휴무'}</div>
              </div>
            )
          })}
        </div>
      </Card>
    </button>
  )
}

export function Today({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const ready = useReadyData()
  const { dataset, reload, openSheet, trackEvent, today, logActionEvent, logGoalAttempt, createGoal } = useBellatrix()
  const legacy = useAppState()
  const [busy, setBusy] = useState(false)
  const [justLogged, setJustLogged] = useState(false)

  useEffect(() => {
    if (ready) trackEvent('today_viewed')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!ready])

  const model = useMemo(() => {
    if (!ready) return null
    const { data, user } = ready
    const nowIso = new Date().toISOString()
    const shift = todayShiftFor(data, user.id, today)
    const next = shift ? null : nextShiftFor(data, user.id, nowIso)
    const focusShift = shift ?? next
    const focusDate = focusShift ? dateOf(focusShift.start_at) : today
    const mission = missionFor(data, user, focusShift, focusDate)
    const reflection = shift ? reflectionForShift(data, shift.id) : null
    const phase: Phase | null = shift ? phaseOf(shift, nowIso) : null
    const myShifts = data.shifts.filter((s) => s.user_id === user.id && s.status !== 'cancelled')
    const goalCount = activeGoals(data, user.id).length
    const teamToday = viewAssignments(data, assignmentsFor(data, user.id, today))
    const attemptsToday = data.action_events.filter((e) => e.user_id === user.id && e.event_type === 'attempted' && dateOf(e.event_at) === today).length + teamToday.reduce((n, v) => n + (v.action.intervention_type === 'micro_coaching' ? 0 : v.progress), 0)
    return { user, data, shift, next, focusShift, mission, reflection, phase, myShifts, goalCount, teamToday, attemptsToday }
  }, [ready, today])

  if (dataset.status === 'error') return <ErrorState message={dataset.message} onRetry={dataset.retryable ? reload : undefined} />
  if (!model) return <LoadingState />
  const { user, data, shift, focusShift, mission, reflection, phase, myShifts, goalCount, teamToday, attemptsToday } = model
  const firstName = user.name.split(' ')[0]
  const inTeam = user.team_id !== null
  const legacyReady = inTeam && legacy.membership === 'store'
  const urgentHandover = legacyReady ? legacy.handovers[0] ?? null : null
  const pinned = legacyReady ? legacy.announcements.find((a) => a.pinned) ?? null : null

  const logAttempt = async () => {
    if (!mission || busy) return
    setBusy(true)
    try {
      const a = mission.assignment
      if (a && a.action.intervention_type !== 'micro_coaching') {
        const target = a.target ?? 1
        const nextProgress = Math.min(target, a.progress + 1)
        if (nextProgress === a.progress) return
        if (a.progress === 0 && a.assignment.status === 'assigned') await logActionEvent(a.assignment.id, 'started', 0)
        await logActionEvent(a.assignment.id, 'progress_updated', nextProgress)
      } else if (mission.goal) {
        await logGoalAttempt(mission.goal.id, 1)
      } else {
        const g = await createGoal({ title: mission.card.headline, behaviour_type: mission.card.behaviour_type, target_count: null, source: 'recommended', coaching_card_id: mission.card.id })
        await logGoalAttempt(g.id, 1)
      }
      setJustLogged(true)
      window.setTimeout(() => setJustLogged(false), 1200)
    } catch {
      // toast shown by store
    } finally {
      setBusy(false)
    }
  }

  const heroLabel = !shift
    ? focusShift
      ? `다음 근무 · ${fmtShortDate(dateOf(focusShift.start_at))}`
      : ''
    : phase === 'before'
      ? '근무 전'
      : phase === 'during'
        ? '근무 중'
        : '근무 끝'
  const missionDone = mission !== null && mission.target !== null && mission.count >= mission.target

  return (
    <div className="px-4 pt-4 pb-8 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-ink-950/40 text-xs">{fmtDateKo(today)}</div>
          <h1 className="text-xl font-bold text-ink-950">{phase === 'after' ? `${firstName}님, 수고했어요` : phase === 'during' ? `${firstName}님, 근무 중` : `${firstName}님, 오늘 하나만 해봐요`}</h1>
          {user.is_demo && (
            <div className="mt-1">
              <DemoBadge label="데모 계정 · 샘플 데이터" />
            </div>
          )}
        </div>
        <button onClick={() => onNavigate('profile')} className="w-10 h-10 rounded-full bg-brand-500 text-ink-950 font-bold flex items-center justify-center shrink-0" aria-label="프로필">
          {user.name[0]}
        </button>
      </div>

      {/* Hero: the shift and its one mission, by phase */}
      {focusShift ? (
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 shadow-lg shadow-brand-900/30 text-white space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white/75 tracking-wide">{heroLabel}</span>
              {data.store && <span className="text-[11px] text-white/70">{data.store.name}</span>}
            </div>
            <div className="text-2xl font-bold mt-1 tabular-nums">
              {fmtTimeHM(focusShift.start_at)} – {fmtTimeHM(focusShift.end_at)}
            </div>
          </div>

          {/* 근무 후: reflection first */}
          {phase === 'after' ? (
            reflection ? (
              <div className="rounded-xl bg-white/12 px-4 py-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Check size={16} strokeWidth={3} /> 오늘 회고 완료 · 시도 {attemptsToday}회
                </div>
                {reflection.win_note && <div className="text-xs text-white/80 truncate">"{reflection.win_note}"</div>}
                <button onClick={() => onNavigate('growth')} className="w-full rounded-lg bg-white text-brand-700 text-sm font-bold py-2.5 inline-flex items-center justify-center gap-1">
                  오늘의 성장 보기 <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-white/12 px-4 py-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MoonStar size={16} /> 탭 세 번이면 끝나요
                </div>
                <div className="text-xs text-white/75">
                  {mission ? `"${mission.card.headline}" — 시도했나 · 고객 반응 · 다시 할까` : '시도했나 · 고객 반응 · 다시 할까'} · 나만 보는 기록
                </div>
                <button onClick={() => openSheet({ kind: 'reflection', shiftId: focusShift.id })} className="w-full rounded-lg bg-white text-brand-700 text-sm font-bold py-2.5">
                  5초 회고
                </button>
              </div>
            )
          ) : mission ? (
            <div className="rounded-xl bg-white/12 px-4 py-3 space-y-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-white/70 flex items-center gap-1.5">
                    오늘의 미션
                    {mission.assignment ? <span className="rounded-full bg-amber-signal/90 text-ink-950 px-1.5 py-px text-[9px] font-bold">팀</span> : mission.goal ? <span className="rounded-full bg-white/20 px-1.5 py-px text-[9px] font-semibold">내 목표</span> : <span className="rounded-full bg-white/20 px-1.5 py-px text-[9px] font-semibold">추천</span>}
                    <span className="text-white/50">· {BEHAVIOUR_LABEL[mission.card.behaviour_type]}</span>
                  </div>
                  <div className="text-base font-bold leading-snug mt-0.5">{mission.card.headline}</div>
                  {phase !== 'during' && <div className="text-xs text-white/75 mt-1 line-clamp-2">{mission.card.script}</div>}
                </div>
                {phase === 'during' && (
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold tabular-nums leading-none">{mission.count}</div>
                    <div className="text-[10px] text-white/60 mt-0.5">{mission.target !== null ? `/ ${mission.target}회` : '회 시도'}</div>
                  </div>
                )}
              </div>

              {phase === 'during' ? (
                <>
                  <button
                    onClick={() => void logAttempt()}
                    disabled={busy || missionDone}
                    className={`w-full rounded-xl py-3.5 text-base font-bold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition ${missionDone ? 'bg-emerald-signal/90 text-white' : 'bg-white text-brand-700'} disabled:opacity-80`}
                    aria-label="시도했어요"
                  >
                    {missionDone ? (
                      <>
                        <Check size={18} strokeWidth={3} /> 오늘 미션 달성
                      </>
                    ) : justLogged ? (
                      <>
                        <Check size={18} strokeWidth={3} /> 기록했어요
                      </>
                    ) : (
                      <>
                        <Plus size={18} strokeWidth={3} /> 시도했어요
                      </>
                    )}
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => openSheet({ kind: 'shiftPrep', shiftId: focusShift.id })} className="rounded-lg bg-white/15 text-white text-xs font-semibold py-2.5 inline-flex items-center justify-center gap-1.5">
                      <BookOpen size={13} /> 팁 다시 보기
                    </button>
                    {legacyReady ? (
                      <button onClick={() => legacy.openSheet({ kind: 'handoverCompose' })} className="rounded-lg bg-white/15 text-white text-xs font-semibold py-2.5 inline-flex items-center justify-center gap-1.5">
                        <ClipboardPen size={13} /> 인수인계 남기기
                      </button>
                    ) : reflection ? (
                      <div className="rounded-lg bg-white/15 text-white/80 text-xs font-semibold py-2.5 inline-flex items-center justify-center gap-1.5">
                        <Check size={13} strokeWidth={3} /> 오늘 회고 완료
                      </div>
                    ) : (
                      <button onClick={() => openSheet({ kind: 'reflection', shiftId: focusShift.id })} className="rounded-lg bg-white/15 text-white text-xs font-semibold py-2.5 inline-flex items-center justify-center gap-1.5">
                        <MoonStar size={13} /> 미리 회고
                      </button>
                    )}
                  </div>
                </>
              ) : mission.prepped ? (
                <button onClick={() => openSheet({ kind: 'shiftPrep', shiftId: focusShift.id })} className="w-full rounded-lg bg-white/15 text-white text-sm font-semibold py-2.5 inline-flex items-center justify-center gap-1.5">
                  <Check size={14} strokeWidth={3} /> 준비 완료 · 다시 보기
                </button>
              ) : (
                <button onClick={() => openSheet({ kind: 'shiftPrep', shiftId: focusShift.id })} className="w-full rounded-lg bg-white text-brand-700 text-sm font-bold py-2.5 inline-flex items-center justify-center gap-1.5">
                  <Sparkles size={14} /> 미션 확인 · 30초
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-white/12 px-4 py-3 text-xs text-white/80">아직 미션 콘텐츠가 없어요. 아래 목표에서 하나 정해두면 여기에 올라와요.</div>
          )}
        </div>
      ) : (
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink-950/6 flex items-center justify-center text-ink-950/40 shrink-0">
              <CalendarPlus size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-950/85">다음 근무를 등록해두면</div>
              <div className="text-xs text-ink-950/40 mt-0.5">근무 전 미션, 근무 중 기록, 근무 후 회고가 여기서 바로 열려요.</div>
            </div>
          </div>
          <PrimaryButton onClick={() => openSheet({ kind: 'shiftComposer' })}>다음 근무 등록</PrimaryButton>
        </Card>
      )}

      {/* 팀 소식 */}
      {(urgentHandover || pinned) && (
        <div>
          <SectionLabel>팀 소식</SectionLabel>
          <button onClick={() => onNavigate('team')} className="w-full text-left">
            <Card className="flex items-start gap-3 active:scale-[0.99] transition border-amber-signal/30 bg-amber-signal/5">
              <div className="w-9 h-9 rounded-xl bg-amber-signal/15 flex items-center justify-center text-amber-600 shrink-0">
                <Megaphone size={16} />
              </div>
              <div className="min-w-0 flex-1">
                {pinned && <div className="text-sm text-ink-950/85 leading-snug line-clamp-2">{pinned.message}</div>}
                {urgentHandover && (
                  <div className="text-xs text-ink-950/55 mt-1 line-clamp-2">
                    <span className="font-semibold">{urgentHandover.fromEmployeeName}</span> · {urgentHandover.message}
                    {urgentHandover.photos.length > 0 && <span className="ml-1 text-ink-950/40">📷 {urgentHandover.photos.length}</span>}
                  </div>
                )}
                <div className="text-[10px] text-ink-950/35 mt-1">
                  {pinned ? `확인 ${pinned.acks.length}명` : ''}
                  {pinned && urgentHandover ? ' · ' : ''}
                  {urgentHandover ? `인수인계 확인 ${urgentHandover.acks.length}명` : ''}
                </div>
              </div>
              <ChevronRight size={16} className="text-ink-950/25 shrink-0 mt-2" />
            </Card>
          </button>
        </div>
      )}

      {/* 이번 주 근무 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>이번 주 근무</SectionLabel>
          <button onClick={() => onNavigate('myShift')} className="text-xs text-brand-700 font-medium -mt-2">
            근무표
          </button>
        </div>
        <WeekStrip shifts={myShifts} today={today} onOpen={() => onNavigate('myShift')} />
      </div>

      {/* 목표 · 팀 액션 — one tap away, not on the main path */}
      <button onClick={() => onNavigate('actions')} className="w-full text-left">
        <Card className="flex items-center gap-3 active:scale-[0.99] transition">
          <div className="w-9 h-9 rounded-xl bg-brand-500/12 text-brand-700 flex items-center justify-center shrink-0">
            {inTeam && teamToday.length > 0 ? <Users size={16} /> : <Target size={16} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink-950/85">목표 · 팀 액션</div>
            <div className="text-[11px] text-ink-950/45">
              내 목표 {goalCount}개{inTeam ? ` · 오늘 팀 액션 ${teamToday.length}개 (${teamToday.filter((v) => v.isDone).length} 완료)` : ''}
            </div>
          </div>
          <ChevronRight size={16} className="text-ink-950/25 shrink-0" />
        </Card>
      </button>

      {inTeam && (
        <div className="flex items-center gap-1.5 text-[10px] text-ink-950/35 justify-center">
          <Badge>미션 시도 횟수는 팀 액션일 때만 매니저에게 보여요</Badge>
        </div>
      )}
    </div>
  )
}
