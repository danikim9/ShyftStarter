import { useMemo, useState } from 'react'
import { Target, Users, Check, Plus, Lock, ChevronRight, Sparkles, TrendingUp, MessageSquareText, Zap } from 'lucide-react'
import { recommendNextShiftFocus } from '../../lib/analytics/recommendation'
import { GOAL_TEMPLATES } from '../../data/coachingCards'
import { METRIC_SHORT } from '../../types/bellatrix'
import { useBellatrix, useReadyData } from '../../lib/bellatrixStore'
import { activeGoals, goalAttemptsOn, viewAssignments, type AssignmentView } from '../../lib/selectors'
import { addDaysISO, fmtShortDate } from '../../lib/dates'
import { BEHAVIOUR_LABEL, INTERVENTION_LABEL } from '../../types/bellatrix'
import type { PersonalGoal } from '../../types/bellatrix'
import { Card, SectionLabel, Badge, ProgressBar, SecondaryButton, PrimaryButton } from '../../components/ui'
import { EmptyState, ErrorState, LoadingState } from '../../components/bellatrix/shared'
import { FEATURES } from '../../lib/features'

type Segment = 'mine' | 'team'

function GoalRow({ goal, count }: { goal: PersonalGoal; count: number }) {
  const { logGoalAttempt, openSheet } = useBellatrix()
  const target = goal.target_count
  const done = target !== null && count >= target
  return (
    <div className="flex items-center gap-3 py-3 border-b border-ink-950/6 last:border-0">
      <button onClick={() => openSheet({ kind: 'goalDetail', goalId: goal.id })} className="min-w-0 flex-1 text-left">
        <div className={`text-sm leading-snug ${goal.active ? 'text-ink-950/90' : 'text-ink-950/45'}`}>{goal.title}</div>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge>{BEHAVIOUR_LABEL[goal.behaviour_type]}</Badge>
          {goal.active ? (
            <span className="text-[11px] text-ink-950/45 tabular-nums">
              오늘 {count}
              {target !== null ? `/${target}` : ''}
            </span>
          ) : (
            <Badge>보관됨</Badge>
          )}
        </div>
      </button>
      {goal.active && (
        <button
          onClick={() => void logGoalAttempt(goal.id, 1)}
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition ${done ? 'bg-emerald-signal/15 text-emerald-600' : 'bg-brand-500 text-ink-950'}`}
          aria-label={`${goal.title} 한 번 더 시도`}
        >
          {done ? <Check size={16} strokeWidth={3} /> : <Plus size={16} />}
        </button>
      )}
    </div>
  )
}

function TeamRow({ v }: { v: AssignmentView }) {
  const { openSheet } = useBellatrix()
  const target = v.target ?? 1
  const isCoaching = v.action.intervention_type === 'micro_coaching'
  return (
    <button
      onClick={() => openSheet(isCoaching ? { kind: 'coaching', assignmentId: v.assignment.id } : { kind: 'actionDetail', assignmentId: v.assignment.id })}
      className="w-full text-left flex items-center gap-3 py-3 border-b border-ink-950/6 last:border-0"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${v.isDone ? 'bg-emerald-signal/15 text-emerald-600' : isCoaching ? 'bg-brand-50 text-brand-600' : 'bg-amber-signal/15 text-amber-600'}`}>
        {v.isDone ? <Check size={14} strokeWidth={3} /> : isCoaching ? <Sparkles size={14} /> : <Users size={14} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-sm leading-snug ${v.isDone ? 'text-ink-950/45' : 'text-ink-950/90'}`}>{v.action.title}</div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[10px] text-ink-950/40">{INTERVENTION_LABEL[v.action.intervention_type]}</span>
          <Badge>{BEHAVIOUR_LABEL[v.action.behaviour_type]}</Badge>
        </div>
      </div>
      {!isCoaching ? (
        <div className="w-14 shrink-0 text-right">
          <div className="text-xs font-semibold tabular-nums text-ink-950/70">
            {v.progress}/{target}
          </div>
          {!v.isDone && !v.isSkipped && <ProgressBar value={v.progress} max={target} />}
        </div>
      ) : (
        <Badge tone={v.isDone ? 'emerald' : 'default'}>{v.isDone ? '적용함' : '보기'}</Badge>
      )}
      <ChevronRight size={15} className="text-ink-950/25 shrink-0" />
    </button>
  )
}

export function Actions() {
  const ready = useReadyData()
  const { dataset, reload, today, openSheet, createGoal } = useBellatrix()
  const [seg, setSeg] = useState<Segment>('mine')
  const [adding, setAdding] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const model = useMemo(() => {
    if (!ready) return null
    const { data, user } = ready
    const goals = activeGoals(data, user.id)
    const archived = data.personal_goals.filter((g) => g.user_id === user.id && !g.active)
    const counts = new Map(goals.map((g) => [g.id, goalAttemptsOn(data, g.id, today)]))
    const mine = data.assignments.filter((a) => a.assigned_to_user_id === user.id)
    const todayRows = viewAssignments(data, mine.filter((a) => a.assigned_date === today))
    const upcoming = viewAssignments(data, mine.filter((a) => a.assigned_date > today)).sort((a, b) => a.assignment.assigned_date.localeCompare(b.assignment.assigned_date))
    const past = viewAssignments(data, mine.filter((a) => a.assigned_date < today && a.assigned_date >= addDaysISO(today, -7))).sort((a, b) =>
      b.assignment.assigned_date.localeCompare(a.assignment.assigned_date)
    )
    const rec = recommendNextShiftFocus({ dataset: data, userId: user.id, today })
    const recTemplate = rec?.card ? GOAL_TEMPLATES.find((t) => t.coaching_card_id === rec.card!.id) ?? null : null
    const recTitle = recTemplate?.title ?? rec?.card?.headline ?? rec?.headline ?? null
    const recInGoals = recTitle !== null && data.personal_goals.some((g) => g.user_id === user.id && g.active && (g.title === recTitle || (rec?.card !== null && g.coaching_card_id === rec?.card?.id)))
    // Review prompt: latest reflection said the tip did not help or nothing was tried → one question on that card.
    const latest = data.reflections.filter((r) => r.user_id === user.id).sort((a, b) => b.shift_date.localeCompare(a.shift_date))[0] ?? null
    const reviewCard = latest && (latest.tip_helpful === false || latest.tried === 'no') && latest.coaching_card_id ? data.coaching_cards.find((c) => c.id === latest.coaching_card_id) ?? null : null
    return { user, goals, archived, counts, todayRows, upcoming, past, rec, recTemplate, recTitle, recInGoals, reviewCard }
  }, [ready, today])

  if (dataset.status === 'error') return <ErrorState message={dataset.message} onRetry={dataset.retryable ? reload : undefined} />
  if (!model) return <LoadingState />
  const { user, goals, archived, counts, todayRows, upcoming, past, rec, recTemplate, recTitle, recInGoals, reviewCard } = model

  const addRecommendedGoal = async () => {
    if (!rec || !recTitle || adding) return
    setAdding(true)
    try {
      await createGoal({
        title: recTitle,
        behaviour_type: rec.behaviour,
        target_count: recTemplate?.target_count ?? 2,
        source: 'recommended',
        coaching_card_id: rec.card?.id ?? null,
      })
    } catch {
      // toast shown
    } finally {
      setAdding(false)
    }
  }
  const inTeam = user.team_id !== null
  const teamTodayCount = todayRows.length

  return (
    <div className="px-4 pt-4 pb-8 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink-950 mb-1">목표 · 팀 액션</h1>
        <p className="text-xs text-ink-950/40">오늘의 미션은 여기서 정해져요. 내 목표와 팀에서 받은 행동은 섞이지 않아요.</p>
      </div>

      {rec && (
        <Card className="border-brand-200 bg-brand-50 space-y-3">
          <div>
            <div className="flex items-center gap-1.5 text-brand-700 text-[11px] font-semibold mb-1">
              <TrendingUp size={12} /> 다음 근무 추천{rec.focusMetric !== 'none' ? ` · ${METRIC_SHORT[rec.focusMetric]}` : ''}
            </div>
            <div className="text-base font-bold text-ink-950 leading-snug">{rec.headline}</div>
            <p className="text-xs text-ink-950/60 mt-1 leading-relaxed">{rec.reason}</p>
          </div>
          {recInGoals ? (
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <Check size={14} /> 내 목표에 있어요
            </div>
          ) : (
            <PrimaryButton disabled={adding} onClick={() => void addRecommendedGoal()} className="flex items-center justify-center gap-1.5">
              <Plus size={14} /> {adding ? '추가 중…' : '목표로 추가'}
            </PrimaryButton>
          )}
          {rec.card && (FEATURES.rolePlay || FEATURES.quickQuiz) && (
            <div className="grid grid-cols-2 gap-2">
              {FEATURES.rolePlay && (
                <SecondaryButton onClick={() => openSheet({ kind: 'rolePlay', cardId: rec.card!.id })} className="flex items-center justify-center gap-1.5 !py-2.5 bg-white">
                  <MessageSquareText size={14} /> 2분 연습
                </SecondaryButton>
              )}
              {FEATURES.quickQuiz && (
                <SecondaryButton onClick={() => openSheet({ kind: 'quickQuiz', cardId: rec.card!.id })} className="flex items-center justify-center gap-1.5 !py-2.5 bg-white">
                  <Zap size={14} /> 10초 확인
                </SecondaryButton>
              )}
            </div>
          )}
          {FEATURES.quickQuiz && reviewCard && reviewCard.id !== rec.card?.id && (
            <button onClick={() => openSheet({ kind: 'quickQuiz', cardId: reviewCard.id })} className="w-full text-left flex items-center gap-2 rounded-xl bg-white border border-amber-signal/30 px-3 py-2">
              <Zap size={13} className="text-amber-600 shrink-0" />
              <span className="text-xs text-ink-950/70 flex-1 min-w-0 truncate">지난 회고에서 아쉬웠던 "{reviewCard.headline}" 한 문제 다시 보기</span>
              <ChevronRight size={14} className="text-ink-950/30 shrink-0" />
            </button>
          )}
          <p className="text-[10px] text-ink-950/35">규칙 기반 추천이에요. 성과와의 관계는 아직 검증 전이에요.</p>
        </Card>
      )}

      <div className="flex items-center gap-1 rounded-full bg-ink-950/6 p-1">
        <button onClick={() => setSeg('mine')} className={`flex-1 rounded-full py-2 text-xs font-semibold transition inline-flex items-center justify-center gap-1.5 ${seg === 'mine' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-950/50'}`}>
          <Target size={13} /> My Goals{goals.length > 0 ? ` ${goals.length}` : ''}
        </button>
        <button onClick={() => setSeg('team')} className={`flex-1 rounded-full py-2 text-xs font-semibold transition inline-flex items-center justify-center gap-1.5 ${seg === 'team' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-950/50'}`}>
          <Users size={13} /> Team Actions{teamTodayCount > 0 ? ` ${teamTodayCount}` : ''}
        </button>
      </div>

      {seg === 'mine' ? (
        <>
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>내 목표</SectionLabel>
              <span className="inline-flex items-center gap-1 text-[10px] text-ink-950/35 -mt-2">
                <Lock size={10} /> 나만 보기
              </span>
            </div>
            <Card>
              {goals.length === 0 ? (
                <EmptyState icon={<Target size={18} />} title="아직 목표가 없어요" body="추천 목표에서 하나 고르거나, 오늘 시도할 행동을 한 줄로 적어보세요." />
              ) : (
                goals.map((g) => <GoalRow key={g.id} goal={g} count={counts.get(g.id) ?? 0} />)
              )}
            </Card>
          </div>
          <SecondaryButton onClick={() => openSheet({ kind: 'goalComposer' })} className="flex items-center justify-center gap-1.5">
            <Plus size={14} /> 목표 추가
          </SecondaryButton>
          {archived.length > 0 && (
            <div>
              <button onClick={() => setShowArchived((v) => !v)} className="text-xs text-ink-950/40 py-1">
                보관한 목표 {archived.length}개 {showArchived ? '접기' : '보기'}
              </button>
              {showArchived && (
                <Card className="mt-2">
                  {archived.map((g) => (
                    <GoalRow key={g.id} goal={g} count={0} />
                  ))}
                </Card>
              )}
            </div>
          )}
        </>
      ) : !inTeam ? (
        <Card className="space-y-3">
          <EmptyState icon={<Users size={18} />} title="아직 팀에 참여하지 않았어요" body="팀에 참여하면 매니저가 보낸 행동이 여기에 나타나요. 참여하지 않아도 개인 기능은 전부 쓸 수 있어요." />
          <SecondaryButton onClick={() => openSheet({ kind: 'joinTeam' })}>초대 코드로 참여</SecondaryButton>
        </Card>
      ) : (
        <>
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>오늘</SectionLabel>
              <span className="text-[10px] text-ink-950/35 -mt-2">완료 여부는 매니저에게 보여요</span>
            </div>
            <Card>
              {todayRows.length === 0 ? <EmptyState icon={<Users size={18} />} title="오늘 팀에서 받은 행동이 없어요" body="매니저가 보내면 여기에 나타나요." /> : todayRows.map((v) => <TeamRow key={v.assignment.id} v={v} />)}
            </Card>
          </div>
          {upcoming.length > 0 && (
            <div>
              <SectionLabel>예정</SectionLabel>
              <Card>
                {upcoming.map((v) => (
                  <div key={v.assignment.id} className="flex items-center gap-3 py-2.5 border-b border-ink-950/6 last:border-0">
                    <span className="text-[11px] text-ink-950/40 w-16 shrink-0">{fmtShortDate(v.assignment.assigned_date)}</span>
                    <span className="text-sm text-ink-950/80 flex-1 min-w-0 truncate">{v.action.title}</span>
                    <Badge>{BEHAVIOUR_LABEL[v.action.behaviour_type]}</Badge>
                  </div>
                ))}
              </Card>
            </div>
          )}
          <div>
            <SectionLabel>지난 7일</SectionLabel>
            <Card>
              {past.length === 0 ? (
                <p className="text-xs text-ink-950/35 py-2">지난 7일간 팀 행동 기록이 없어요.</p>
              ) : (
                past.map((v) => (
                  <div key={v.assignment.id} className="flex items-center gap-3 py-2.5 border-b border-ink-950/6 last:border-0">
                    <span className="text-[11px] text-ink-950/40 w-16 shrink-0">{fmtShortDate(v.assignment.assigned_date)}</span>
                    <span className={`text-sm flex-1 min-w-0 truncate ${v.isDone ? 'text-ink-950/80' : 'text-ink-950/45'}`}>{v.action.title}</span>
                    <Badge tone={v.isDone ? 'emerald' : 'default'}>{v.isDone ? '완료' : v.isSkipped ? '건너뜀' : '시도 전'}</Badge>
                  </div>
                ))
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
