import { useMemo, useState } from 'react'
import { Eye, ListPlus, MessageCircle, Sun, ArrowUpRight, ArrowRight, ArrowDownRight, Lock, Send, CalendarDays, AlertCircle } from 'lucide-react'
import { useBellatrix, useManagerData } from '../../lib/bellatrixStore'
import { useManagerState } from '../../lib/managerStore'
import { buildCoachingGuide, buildTeamMemberProfile } from '../../lib/analytics/team'
import { BEHAVIOUR_LABEL } from '../../types/bellatrix'
import { fmtShortDate, fmtTimeHM, dateOf } from '../../lib/dates'
import { todayShiftFor } from '../../lib/selectors'
import { Badge, PrimaryButton, SecondaryButton } from '../../components/ui'

const TREND = { up: ArrowUpRight, flat: ArrowRight, down: ArrowDownRight, insufficient: ArrowRight } as const

export function MemberDetailSheet({ userId }: { userId: string }) {
  const ready = useManagerData()
  const { openSheet, closeSheet, assignAction, today } = useBellatrix()
  const { showRosterFor } = useManagerState()
  const [sending, setSending] = useState(false)

  const model = useMemo(() => {
    if (!ready) return null
    const user = ready.data.users.find((u) => u.id === userId)
    if (!user) return null
    const p = buildTeamMemberProfile(ready.data, user, today)
    const focusBehaviour = p.gap ?? p.recommendation?.behaviour ?? null
    const card = p.recommendation?.card ?? (focusBehaviour ? ready.data.coaching_cards.find((c) => c.behaviour_type === focusBehaviour && c.job_category === user.job_category) ?? ready.data.coaching_cards.find((c) => c.behaviour_type === focusBehaviour) ?? null : null)
    const action = focusBehaviour
      ? ready.data.actions.find((a) => a.behaviour_type === focusBehaviour && a.intervention_type === 'micro_coaching') ?? ready.data.actions.find((a) => a.behaviour_type === focusBehaviour && a.intervention_type === 'action') ?? null
      : null
    const alreadyToday = action ? ready.data.assignments.some((a) => a.assigned_to_user_id === user.id && a.assigned_date === today && a.action_id === action.id) : false
    const recent = ready.data.evidence.filter((e) => e.user_id === user.id && e.evidence_source === 'manager_observation').sort((a, b) => b.observed_at.localeCompare(a.observed_at)).slice(0, 5)
    const shift = todayShiftFor(ready.data, user.id, today)
    return { user, p, card, action, alreadyToday, recent, shift, guide: buildCoachingGuide(p, card), focusBehaviour }
  }, [ready, userId, today])

  if (!ready || !model) return <p className="text-sm text-ink-950/50">팀원을 찾을 수 없어요.</p>
  const { user, p, card, action, alreadyToday, recent, shift, guide, focusBehaviour } = model

  const sendCard = async () => {
    if (!action) return
    setSending(true)
    try {
      await assignAction({ actionId: action.id, userIds: [user.id], date: today, targetCount: action.intervention_type === 'micro_coaching' ? null : action.default_target_count, targetMetric: action.target_metric, campaignId: null })
    } catch {
      // toast shown
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-lg font-bold shrink-0">{user.name[0]}</span>
        <div className="min-w-0 flex-1">
          <div className="text-base font-bold text-ink-950">{user.name}</div>
          <div className="text-xs text-ink-950/50">{shift ? `오늘 ${fmtTimeHM(shift.start_at)}–${fmtTimeHM(shift.end_at)} 근무` : '오늘 근무 없음'}</div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {p.workingToday && (
              <Badge tone="brand">
                <Sun size={10} /> 오늘 근무
              </Badge>
            )}
            {p.coachingFlags > 0 && (
              <Badge tone="amber">
                <AlertCircle size={10} /> 코칭 필요 {p.coachingFlags}회
              </Badge>
            )}
            <Badge>최근 2주 관찰 {p.observationsLast14}회</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => openSheet({ kind: 'observe', presetUserId: user.id })} className="rounded-xl bg-brand-500 text-white text-sm font-semibold py-3 inline-flex items-center justify-center gap-1.5">
          <Eye size={14} /> 지금 관찰 기록
        </button>
        <button onClick={() => openSheet({ kind: 'assign', presetUserId: user.id })} className="rounded-xl bg-ink-950/6 text-ink-950 text-sm font-semibold py-3 inline-flex items-center justify-center gap-1.5">
          <ListPlus size={14} /> 액션 배정
        </button>
      </div>

      <div>
        <div className="text-[11px] font-semibold text-ink-950/40 uppercase tracking-wide mb-2">행동 근거 · 최근 3주</div>
        <div className="rounded-xl border border-ink-950/8 bg-white divide-y divide-ink-950/6">
          {p.behaviours.map((b) => {
            const Icon = TREND[b.trend]
            return (
              <div key={b.behaviour} className="px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-ink-950/85 whitespace-nowrap">{BEHAVIOUR_LABEL[b.behaviour]}</div>
                  <Badge tone={b.reading === 'strong' ? 'emerald' : b.reading === 'gap' ? 'amber' : 'default'}>
                    <Icon size={10} /> {b.reading === 'strong' ? '꾸준히 보임' : b.reading === 'gap' ? '더 볼 것' : '근거 부족'}
                  </Badge>
                </div>
                <div className="mt-0.5 text-[11px] text-ink-950/55 tabular-nums">
                  관찰 {b.observation.numerator}/{b.observation.denominator} · 팀 액션 {b.completion.numerator}/{b.completion.denominator}
                  {b.lastObservedAt && <span className="text-ink-950/35"> · 마지막 관찰 {fmtShortDate(b.lastObservedAt)}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold text-ink-950/40 uppercase tracking-wide mb-2">최근 관찰</div>
        {recent.length === 0 ? (
          <p className="text-xs text-ink-950/45">아직 관찰 기록이 없어요. 오늘 10초만 봐주면 첫 근거가 생겨요.</p>
        ) : (
          <div className="space-y-1.5">
            {recent.map((e) => (
              <div key={e.id} className="flex items-start gap-2 text-xs">
                <span className="text-ink-950/35 w-14 shrink-0 tabular-nums">{fmtShortDate(dateOf(e.observed_at))}</span>
                <span className={`shrink-0 ${e.evidence_value === 'observed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {BEHAVIOUR_LABEL[e.behaviour_type]} {e.evidence_value === 'observed' ? '보임' : '안 보임'}
                </span>
                {e.coaching_needed && <span className="text-amber-600">· 코칭 필요</span>}
                {e.note && <span className="text-ink-950/55 min-w-0 truncate">· {e.note}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-950/40 uppercase tracking-wide mb-2">
          <MessageCircle size={12} /> 1:1 코칭 가이드{focusBehaviour ? ` · ${BEHAVIOUR_LABEL[focusBehaviour]}` : ''}
        </div>
        <p className="text-[11px] text-ink-950/45 mb-2">평가가 아니라 대화를 위한 순서예요. 판단 없이 관찰한 것만 말하세요.</p>
        <div className="space-y-2">
          {guide.map((g) => (
            <div key={g.step} className="rounded-xl bg-ink-950/4 border border-ink-950/8 px-3.5 py-3">
              <div className="text-[11px] font-semibold text-brand-700 mb-1">{g.step}</div>
              <div className="text-sm text-ink-950/80 leading-relaxed">{g.prompt}</div>
            </div>
          ))}
        </div>
      </div>

      {card && action && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-3.5 space-y-2">
          <div className="text-[11px] font-semibold text-brand-700">다음 근무에 보낼 코칭 카드</div>
          <div className="text-sm font-bold text-ink-950">{card.headline}</div>
          <div className="text-xs text-ink-950/60 whitespace-pre-line">{card.script}</div>
          {alreadyToday ? (
            <Badge tone="emerald">오늘 이미 보냈어요</Badge>
          ) : (
            <PrimaryButton disabled={sending} onClick={() => void sendCard()} className="flex items-center justify-center gap-1.5">
              <Send size={14} /> {sending ? '보내는 중…' : '코칭 카드 보내기'}
            </PrimaryButton>
          )}
          <p className="text-[10px] text-ink-950/40">{user.name.split(' ')[0]}님의 Today와 Shift Prep에 팀 액션으로 올라가요. 완료 여부만 여기서 보이고, 본인 회고는 보이지 않아요.</p>
        </div>
      )}

      <SecondaryButton
        onClick={() => {
          closeSheet()
          showRosterFor(user.id)
        }}
        className="flex items-center justify-center gap-1.5"
      >
        <CalendarDays size={14} /> 이번 주 근무 보기
      </SecondaryButton>
      <div className="flex items-start gap-1.5 text-[11px] text-ink-950/40">
        <Lock size={12} className="shrink-0 mt-0.5" /> 개인 목표 · 회고 · 연습 기록은 본인만 볼 수 있어 여기에 없어요.
      </div>
    </div>
  )
}
