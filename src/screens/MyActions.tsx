import { Plus, Check, Flame, User, Bell, X, BellRing, Wallet, ChevronRight } from 'lucide-react'
import { useAppState } from '../lib/store'
import { shifts } from '../data/mockData'
import { Card, Badge, ProgressBar, Toggle, SectionLabel } from '../components/ui'
import { fmtWon, sumExtraPay, sumShiftPay } from '../lib/wageCalc'
import type { Action, Reminder } from '../types'

// 22차 — 솔로 UX 피드백 #1: 예상 급여 계산기 진입점을 My Shift에서 My
// Actions 화면 안으로 옮기고, 화면 맨 아래(하단)에 배치했다. 로직/문구는
// 21차 그대로 — "예상 급여"이지 정확한 급여가 아니며, 시급 미설정 시 설정을
// 유도한다.
function WagePreviewCard() {
  const { wageSettings, extraPayEntries, openSheet } = useAppState()
  const confirmed = shifts.filter((s) => s.status === 'completed' || s.status === 'in_progress')
  const upcoming = shifts.filter((s) => s.status === 'upcoming')
  const total =
    sumShiftPay(confirmed, wageSettings.hourlyWage) +
    sumShiftPay(upcoming, wageSettings.hourlyWage) +
    sumExtraPay(extraPayEntries, wageSettings.hourlyWage, wageSettings.overtimeMultiplier)
  const noWage = wageSettings.hourlyWage <= 0

  return (
    <button onClick={() => openSheet({ kind: 'wageCalculator' })} className="w-full text-left">
      <Card className="flex items-center gap-3 active:scale-[0.99] transition">
        <div className="w-10 h-10 rounded-xl bg-emerald-signal/15 flex items-center justify-center shrink-0">
          <Wallet size={18} className="text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-ink-950/40">예상 급여 (세전)</div>
          {noWage ? (
            <div className="text-sm font-semibold text-ink-950/70 mt-0.5">시급을 설정하고 확인해보세요</div>
          ) : (
            <div className="text-lg font-bold text-ink-950 mt-0.5 tabular-nums">{fmtWon(total)}</div>
          )}
        </div>
        <ChevronRight size={16} className="text-ink-950/30 shrink-0" />
      </Card>
    </button>
  )
}

const OFFSET_OPTIONS = [15, 30, 60] as const

function ReminderRow({ reminder }: { reminder: Reminder }) {
  const { toggleReminder, removeReminder, fireReminderNow } = useAppState()
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-ink-950/6 last:border-0">
      <div className="min-w-0 flex-1">
        <div className={`text-sm ${reminder.enabled ? 'text-ink-950/85' : 'text-ink-950/35'}`}>{reminder.label}</div>
        <div className="text-[10px] text-ink-950/35 mt-0.5 tabular-nums">{reminder.time}</div>
      </div>
      <button
        onClick={() => fireReminderNow(reminder.id)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-ink-950/35 hover:text-brand-600 hover:bg-ink-950/8 transition shrink-0"
        title="지금 테스트"
        aria-label="지금 테스트"
      >
        <BellRing size={13} />
      </button>
      <Toggle checked={reminder.enabled} onChange={() => toggleReminder(reminder.id)} label={`${reminder.label} 알림`} />
      <button
        onClick={() => removeReminder(reminder.id)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-ink-950/25 hover:text-rose-600 hover:bg-ink-950/8 transition shrink-0"
        aria-label="삭제"
      >
        <X size={13} />
      </button>
    </div>
  )
}

const SOURCE_BADGE: Record<Action['createdBy'], { label: string; tone: 'default' | 'brand' | 'amber' } | null> = {
  self: null,
  manager: { label: '매니저가 보냄', tone: 'brand' },
  ai: { label: 'AI 추천', tone: 'amber' },
}

function ActionRow({ action }: { action: Action }) {
  const { completeAction, uncompleteAction } = useAppState()
  const done = !!action.completedAt
  const badge = SOURCE_BADGE[action.createdBy]

  return (
    <div className="flex items-center gap-3 py-3 border-b border-ink-950/6 last:border-0">
      <button
        onClick={() => (done ? uncompleteAction(action.id) : completeAction(action.id))}
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition active:scale-90 ${
          done ? 'bg-emerald-signal border-emerald-signal hover:bg-emerald-signal/80' : 'border-ink-950/20'
        }`}
        aria-label={done ? '완료 취소하기' : '완료하기'}
        title={done ? '탭하면 완료를 취소해요' : undefined}
      >
        {done && <Check size={14} className="text-ink-950" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className={`text-sm ${done ? 'text-ink-950/40 line-through' : 'text-ink-950/90'}`}>{action.title}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {action.dueLabel && <span className="text-[10px] text-ink-950/35">{action.dueLabel}</span>}
          {action.target > 1 && (
            <span className="text-[10px] text-ink-950/35 tabular-nums">
              {action.progress}/{action.target}
            </span>
          )}
          {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
        </div>
      </div>
      {action.target > 1 && !done && (
        <div className="w-14 shrink-0">
          <ProgressBar value={action.progress} max={action.target} />
        </div>
      )}
    </div>
  )
}

export function MyActions() {
  const {
    actions,
    weeklyCompletionCount,
    currentStreakDays,
    openSheet,
    reminders,
    setShiftReminderOffset,
    toggleReminder,
    fireReminderNow,
  } = useAppState()
  const active = actions.filter((a) => !a.completedAt)
  const completed = actions.filter((a) => a.completedAt)
  const shiftReminder = reminders.find((r) => r.kind === 'shiftStart')
  const customReminders = reminders.filter((r) => r.kind === 'custom')

  return (
    <div className="px-4 pt-5 pb-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-950 mb-1">My Actions</h1>
        <p className="text-xs text-ink-950/40">내가 만든 할 일과 매니저가 보낸 할 일이 한 곳에 있어요.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl bg-ink-950/4 border border-ink-950/8 px-3.5 py-3 flex items-center gap-2.5">
          <Flame size={16} className="text-amber-600 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-bold text-ink-950 tabular-nums leading-none">연속 {currentStreakDays}일째</div>
            <div className="text-[10px] text-ink-950/35 mt-1">잘 하고 있어요</div>
          </div>
        </div>
        <div className="flex-1 rounded-xl bg-ink-950/4 border border-ink-950/8 px-3.5 py-3 flex items-center gap-2.5">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-bold text-ink-950 tabular-nums leading-none">이번 주 {weeklyCompletionCount}회</div>
            <div className="text-[10px] text-ink-950/35 mt-1">완료했어요</div>
          </div>
        </div>
        <button
          onClick={() => openSheet({ kind: 'actionCompose' })}
          className="shrink-0 w-11 h-11 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center active:scale-95 transition"
          aria-label="할 일 추가"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* 21차 — 솔로 UX 리뷰 피드백: 스트릭/카운트/리마인더/액션리스트가 거의
          같은 카드 톤으로 나란히 있어서 정작 제일 중요한 "오늘 할 일"이 묻힐
          수 있다는 지적을 반영해, 액션 리스트를 리마인더보다 위로 올리고
          다른 섹션과 동일한 레이블을 붙여 위계를 분명히 했다.
          22차 — 4주 추이 배너와 AI 추천 배너는 사용자 피드백에 따라 제거했다. */}
      <div>
        <SectionLabel>오늘 할 일</SectionLabel>
        <Card className="divide-y-0">
          {active.length === 0 && <p className="text-xs text-ink-950/35 py-2">오늘 할 일이 없어요. + 버튼으로 추가해보세요.</p>}
          {active.map((a) => (
            <ActionRow key={a.id} action={a} />
          ))}
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-950/30 uppercase tracking-wide">
            <Bell size={11} /> 리마인더
          </div>
          <button
            onClick={() => openSheet({ kind: 'reminderCompose' })}
            className="text-[11px] text-brand-600 font-medium flex items-center gap-0.5"
          >
            <Plus size={12} /> 추가
          </button>
        </div>
        <Card className="space-y-0">
          {shiftReminder && (
            <div className="flex items-center gap-2.5 py-2.5 border-b border-ink-950/6">
              <div className="min-w-0 flex-1">
                <div className={`text-sm ${shiftReminder.enabled ? 'text-ink-950/85' : 'text-ink-950/35'}`}>{shiftReminder.label}</div>
                <div className="flex items-center gap-1 mt-1">
                  {OFFSET_OPTIONS.map((min) => (
                    <button
                      key={min}
                      onClick={() => setShiftReminderOffset(min)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition ${
                        shiftReminder.offsetMinutes === min ? 'bg-white text-ink-950' : 'bg-ink-950/8 text-ink-950/45'
                      }`}
                    >
                      {min}분 전
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => fireReminderNow(shiftReminder.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-ink-950/35 hover:text-brand-600 hover:bg-ink-950/8 transition shrink-0"
                title="지금 테스트"
                aria-label="지금 테스트"
              >
                <BellRing size={13} />
              </button>
              <Toggle checked={shiftReminder.enabled} onChange={() => toggleReminder(shiftReminder.id)} label="근무 시작 알림" />
            </div>
          )}
          {customReminders.length === 0 ? (
            <p className="text-xs text-ink-950/35 py-2.5">아직 만든 리마인더가 없어요. 위 + 버튼으로 추가해보세요.</p>
          ) : (
            customReminders.map((r) => <ReminderRow key={r.id} reminder={r} />)
          )}
        </Card>
      </div>

      {completed.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-ink-950/30 uppercase tracking-wide">
            <User size={11} /> 완료됨
          </div>
          <Card>
            {completed.map((a) => (
              <ActionRow key={a.id} action={a} />
            ))}
          </Card>
        </div>
      )}

      {/* 22차 — 솔로 UX 피드백 #1: 예상 급여 계산기를 My Shift에서 이 화면
          안으로 옮기고, 화면 맨 하단에 배치했다. */}
      <div>
        <SectionLabel>예상 급여</SectionLabel>
        <WagePreviewCard />
      </div>
    </div>
  )
}
