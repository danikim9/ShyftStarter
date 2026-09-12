import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Sparkles, Target, MoonStar, CalendarPlus, Check, Plus, Users, Megaphone, Lock } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../lib/bellatrixStore'
import { useAppState } from '../../lib/store'
import { activeGoals, assignmentsFor, cardById, goalAttemptsOn, nextShiftFor, prepForShift, reflectionForShift, todayShiftFor, viewAssignments, type AssignmentView } from '../../lib/selectors'
import { fmtDateKo, fmtShortDate, fmtTimeHM } from '../../lib/dates'
import { BEHAVIOUR_LABEL } from '../../types/bellatrix'
import type { PersonalGoal, Shift } from '../../types/bellatrix'
import { Card, SectionLabel, Badge, ProgressBar, PrimaryButton } from '../../components/ui'
import { inputClass } from '../../components/bellatrix/shared'
import type { BehaviourType } from '../../types/bellatrix'
import { EmptyState, ErrorState, LoadingState } from '../../components/bellatrix/shared'
import { DemoBadge } from '../../components/bellatrix/DemoBadge'
import type { TabId } from '../../components/BottomNav'

type Phase = 'before' | 'during' | 'after'

function phaseOf(shift: Shift, nowIso: string): Phase {
  if (nowIso < shift.start_at) return 'before'
  if (nowIso < shift.end_at) return 'during'
  return 'after'
}

function GoalRow({ goal, count }: { goal: PersonalGoal; count: number }) {
  const { logGoalAttempt, openSheet } = useBellatrix()
  const target = goal.target_count
  const done = target !== null && count >= target
  return (
    <div className="flex items-center gap-3 py-3 border-b border-ink-950/6 last:border-0">
      <button onClick={() => openSheet({ kind: 'goalDetail', goalId: goal.id })} className="min-w-0 flex-1 text-left">
        <div className={`text-sm font-medium leading-snug ${done ? 'text-ink-950/55' : 'text-ink-950/90'}`}>{goal.title}</div>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge>{BEHAVIOUR_LABEL[goal.behaviour_type]}</Badge>
          <span className="text-[11px] text-ink-950/45 tabular-nums">
            오늘 {count}
            {target !== null ? ` / ${target}` : ''}회
          </span>
        </div>
      </button>
      <button
        onClick={() => void logGoalAttempt(goal.id, 1)}
        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition ${done ? 'bg-emerald-signal/15 text-emerald-600' : 'bg-brand-500 text-white shadow-md shadow-brand-500/30'}`}
        aria-label={`${goal.title} 한 번 더 시도`}
      >
        {done ? <Check size={18} strokeWidth={3} /> : <Plus size={18} />}
      </button>
    </div>
  )
}

const QUICK_BEHAVIOURS: BehaviourType[] = ['discovery', 'demo', 'recommendation', 'cross_sell', 'closing']

/** Inline goal entry on Today: one line + a behaviour chip, or open the template picker. */
function QuickGoalEntry() {
  const { createGoal, openSheet } = useBellatrix()
  const [title, setTitle] = useState('')
  const [behaviour, setBehaviour] = useState<BehaviourType | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    if (!title.trim() || busy) return
    setBusy(true)
    try {
      await createGoal({ title, behaviour_type: behaviour ?? 'other', target_count: null, source: 'self', coaching_card_id: null })
      setTitle('')
      setBehaviour(null)
    } catch {
      // toast shown
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="pt-3 border-t border-ink-950/6 space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void submit()}
          placeholder="오늘 시도할 행동 한 줄 기입"
          className={`${inputClass} !py-2.5`}
          aria-label="오늘의 내 목표 기입"
        />
        <button onClick={() => void submit()} disabled={!title.trim() || busy} className="shrink-0 rounded-xl bg-brand-500 text-white text-sm font-semibold px-3.5 py-2.5 disabled:opacity-40">
          추가
        </button>
      </div>
      {title.trim() && (
        <div className="flex gap-1.5 flex-wrap">
          {QUICK_BEHAVIOURS.map((b) => (
            <button key={b} type="button" onClick={() => setBehaviour(behaviour === b ? null : b)} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${behaviour === b ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-ink-950/10 text-ink-950/60'}`}>
              {BEHAVIOUR_LABEL[b]}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => openSheet({ kind: 'goalComposer' })} className="text-[11px] text-brand-700 font-medium">
        추천 목표에서 고르기
      </button>
    </div>
  )
}

function TeamActionRow({ v }: { v: AssignmentView }) {
  const { openSheet } = useBellatrix()
  const target = v.target ?? 1
  const isCoaching = v.action.intervention_type === 'micro_coaching'
  return (
    <button
      onClick={() => openSheet(isCoaching ? { kind: 'coaching', assignmentId: v.assignment.id } : { kind: 'actionDetail', assignmentId: v.assignment.id })}
      className="w-full text-left flex items-center gap-3 py-3 border-b border-ink-950/6 last:border-0 active:opacity-70 transition"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${v.isDone ? 'bg-emerald-signal/15 text-emerald-600' : 'bg-amber-signal/15 text-amber-600'}`}>
        {v.isDone ? <Check size={16} strokeWidth={3} /> : <Users size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium leading-snug ${v.isDone ? 'text-ink-950/50' : 'text-ink-950/90'}`}>{v.action.title}</div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Badge tone="amber">팀</Badge>
          <Badge>{BEHAVIOUR_LABEL[v.action.behaviour_type]}</Badge>
        </div>
      </div>
      {!isCoaching && (
        <div className="w-14 shrink-0 text-right">
          <div className={`text-sm font-bold tabular-nums ${v.isDone ? 'text-emerald-600' : 'text-ink-950'}`}>
            {v.progress}/{target}
          </div>
          {!v.isDone && !v.isSkipped && <ProgressBar value={v.progress} max={target} />}
        </div>
      )}
      <ChevronRight size={16} className="text-ink-950/25 shrink-0" />
    </button>
  )
}

export function Today({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const ready = useReadyData()
  const { dataset, reload, openSheet, trackEvent, today } = useBellatrix()
  const legacy = useAppState()

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
    const prep = focusShift ? prepForShift(data, user.id, focusShift.id) : null
    const prepCard = cardById(data, prep?.coaching_card_id ?? null)
    const reflection = shift ? reflectionForShift(data, shift.id) : null
    const phase = shift ? phaseOf(shift, nowIso) : null
    const goals = activeGoals(data, user.id).slice(0, 2)
    const goalCounts = goals.map((g) => goalAttemptsOn(data, g.id, today))
    const team = viewAssignments(data, assignmentsFor(data, user.id, today)).slice(0, 3)
    return { user, data, shift, next, focusShift, prep, prepCard, reflection, phase, goals, goalCounts, team }
  }, [ready, today])

  if (dataset.status === 'error') return <ErrorState message={dataset.message} onRetry={dataset.retryable ? reload : undefined} />
  if (!model) return <LoadingState />
  const { user, data, shift, next, focusShift, prep, prepCard, reflection, phase, goals, goalCounts, team } = model
  const firstName = user.name.split(' ')[0]
  const inTeam = user.team_id !== null
  const urgentHandover = inTeam && legacy.membership === 'store' ? legacy.handovers[0] ?? null : null
  const pinned = inTeam && legacy.membership === 'store' ? legacy.announcements.find((a) => a.pinned) ?? null : null

  const showPrepCta = focusShift && !prep && (phase === null || phase !== 'after')
  const showReflectCta = shift && !reflection && (phase === 'during' || phase === 'after')

  return (
    <div className="px-4 pt-4 pb-8 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-ink-950/40 text-xs">{fmtDateKo(today)}</div>
          <h1 className="text-xl font-bold text-ink-950">{firstName}님, 오늘 하나만 해봐요</h1>
          {user.is_demo && (
            <div className="mt-1">
              <DemoBadge label="데모 계정 · 샘플 데이터" />
            </div>
          )}
        </div>
        <button onClick={() => onNavigate('profile')} className="w-10 h-10 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center shrink-0" aria-label="프로필">
          {user.name[0]}
        </button>
      </div>

      {/* Shift + prep */}
      {focusShift ? (
        <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 p-5 shadow-lg shadow-brand-900/30 text-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white/75 tracking-wide">{shift ? (phase === 'after' ? '오늘 근무 끝' : phase === 'during' ? '근무 중' : '오늘 근무') : `다음 근무 · ${fmtShortDate(focusShift.start_at.slice(0, 10))}`}</span>
            {data.store && <span className="text-[11px] text-white/70">{data.store.name}</span>}
          </div>
          <div className="text-2xl font-bold mt-1 tabular-nums">
            {fmtTimeHM(focusShift.start_at)} – {fmtTimeHM(focusShift.end_at)}
          </div>
          <div className="mt-4 pt-3 border-t border-white/15">
            {prep && prepCard ? (
              <button onClick={() => openSheet({ kind: 'shiftPrep', shiftId: focusShift.id })} className="w-full text-left flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Check size={16} strokeWidth={3} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-white/70">오늘 해볼 행동</div>
                  <div className="text-sm font-bold leading-snug">{prepCard.headline}</div>
                </div>
                <ChevronRight size={16} className="text-white/70 shrink-0" />
              </button>
            ) : showPrepCta ? (
              <button onClick={() => openSheet({ kind: 'shiftPrep', shiftId: focusShift.id })} className="w-full text-left flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">Shift Prep · 30초</div>
                  <div className="text-[11px] text-white/70">오늘 시도할 행동 1개 + 스크립트 + 반론 대응</div>
                </div>
                <span className="shrink-0 rounded-full bg-white text-brand-700 text-xs font-bold px-3 py-1.5">준비하기</span>
              </button>
            ) : (
              <div className="text-[11px] text-white/70">오늘은 준비 없이 근무했어요. 아래에서 5초 회고만 남겨요.</div>
            )}
          </div>
        </div>
      ) : (
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink-950/6 flex items-center justify-center text-ink-950/40 shrink-0">
              <CalendarPlus size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-950/85">다음 근무를 등록해두면</div>
              <div className="text-xs text-ink-950/40 mt-0.5">근무 전 30초 준비와 근무 후 5초 회고를 여기서 바로 열어줘요.</div>
            </div>
          </div>
          <PrimaryButton onClick={() => openSheet({ kind: 'shiftComposer' })}>다음 근무 등록</PrimaryButton>
        </Card>
      )}

      {/* Reflection */}
      {shift && (reflection || showReflectCta) && (
        <div>
          <SectionLabel>근무 후 5초</SectionLabel>
          {reflection ? (
            <Card className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-signal/15 flex items-center justify-center text-emerald-600 shrink-0">
                <Check size={16} strokeWidth={3} />
              </div>
              <div className="text-sm text-ink-950/75 min-w-0">
                오늘 회고 완료 · {reflection.tried === 'yes' ? '시도했어요' : reflection.tried === 'partly' ? '조금 해봤어요' : '다음에 다시'}
                {reflection.win_note && <div className="text-xs text-ink-950/50 truncate mt-0.5">"{reflection.win_note}"</div>}
              </div>
              <button onClick={() => onNavigate('growth')} className="ml-auto text-xs text-brand-700 font-medium shrink-0">
                Growth
              </button>
            </Card>
          ) : (
            <Card className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-ink-950/6 flex items-center justify-center text-ink-950/50 shrink-0">
                  <MoonStar size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink-950/85">{phase === 'after' ? '수고했어요. 탭 세 번이면 끝나요' : '근무 끝나면 탭 세 번'}</div>
                  <div className="text-xs text-ink-950/40 mt-0.5">시도했나 · 고객 반응 · 다시 할까 — 나만 보는 기록</div>
                </div>
              </div>
              <PrimaryButton onClick={() => openSheet({ kind: 'reflection', shiftId: shift.id })}>5초 회고</PrimaryButton>
            </Card>
          )}
        </div>
      )}

      {/* Personal goals */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>오늘의 내 목표</SectionLabel>
          <span className="inline-flex items-center gap-1 text-[10px] text-ink-950/35 -mt-2">
            <Lock size={10} /> 나만 보기
          </span>
        </div>
        <Card>
          {goals.length === 0 ? (
            <EmptyState icon={<Target size={18} />} title="아직 목표가 없어요" body="오늘 고객에게 시도할 행동을 아래에 한 줄로 적거나, 추천 목표에서 골라보세요." />
          ) : (
            goals.map((g, i) => <GoalRow key={g.id} goal={g} count={goalCounts[i]} />)
          )}
          <QuickGoalEntry />
        </Card>
      </div>

      {/* Team news — right under my goals so it's checked in the same glance */}
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

      {/* Team actions */}
      {inTeam && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>팀에서 받은 행동</SectionLabel>
            <span className="text-[10px] text-ink-950/35 -mt-2">완료 여부는 매니저에게 보여요</span>
          </div>
          <Card>
            {team.length === 0 ? <p className="text-xs text-ink-950/35 py-1">오늘 팀에서 받은 행동이 없어요.</p> : team.map((v) => <TeamActionRow key={v.assignment.id} v={v} />)}
          </Card>
        </div>
      )}

      {!focusShift && next === null && goals.length > 0 && (
        <p className="text-[11px] text-ink-950/35 text-center">근무를 등록하면 Shift Prep이 목표에 맞는 스크립트를 골라줘요.</p>
      )}
    </div>
  )
}
