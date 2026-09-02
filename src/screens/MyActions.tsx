import { Plus, Check, Flame, Sparkles, User, Bell, X, BellRing } from 'lucide-react'
import { useAppState } from '../lib/store'
import { Card, Badge, ProgressBar, Toggle } from '../components/ui'
import type { Action, Reminder } from '../types'

const OFFSET_OPTIONS = [15, 30, 60] as const

function ReminderRow({ reminder }: { reminder: Reminder }) {
  const { toggleReminder, removeReminder, fireReminderNow } = useAppState()
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-white/6 last:border-0">
      <div className="min-w-0 flex-1">
        <div className={`text-sm ${reminder.enabled ? 'text-white/85' : 'text-white/35'}`}>{reminder.label}</div>
        <div className="text-[10px] text-white/35 mt-0.5 tabular-nums">{reminder.time}</div>
      </div>
      <button
        onClick={() => fireReminderNow(reminder.id)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-white/35 hover:text-brand-300 hover:bg-white/8 transition shrink-0"
        title="지금 테스트"
        aria-label="지금 테스트"
      >
        <BellRing size={13} />
      </button>
      <Toggle checked={reminder.enabled} onChange={() => toggleReminder(reminder.id)} label={`${reminder.label} 알림`} />
      <button
        onClick={() => removeReminder(reminder.id)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-white/25 hover:text-rose-300 hover:bg-white/8 transition shrink-0"
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
    <div className="flex items-center gap-3 py-3 border-b border-white/6 last:border-0">
      <button
        onClick={() => (done ? uncompleteAction(action.id) : completeAction(action.id))}
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition active:scale-90 ${
          done ? 'bg-emerald-signal border-emerald-signal hover:bg-emerald-signal/80' : 'border-white/20'
        }`}
        aria-label={done ? '완료 취소하기' : '완료하기'}
        title={done ? '탭하면 완료를 취소해요' : undefined}
      >
        {done && <Check size={14} className="text-white" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className={`text-sm ${done ? 'text-white/40 line-through' : 'text-white/90'}`}>{action.title}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {action.dueLabel && <span className="text-[10px] text-white/35">{action.dueLabel}</span>}
          {action.target > 1 && (
            <span className="text-[10px] text-white/35 tabular-nums">
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
        <h1 className="text-xl font-bold text-white mb-1">My Actions</h1>
        <p className="text-xs text-white/40">내가 만든 할 일과 매니저가 보낸 할 일이 한 곳에 있어요.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl bg-white/4 border border-white/8 px-3.5 py-3 flex items-center gap-2.5">
          <Flame size={16} className="text-amber-300 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-bold text-white tabular-nums leading-none">연속 {currentStreakDays}일째</div>
            <div className="text-[10px] text-white/35 mt-1">잘 하고 있어요</div>
          </div>
        </div>
        <div className="flex-1 rounded-xl bg-white/4 border border-white/8 px-3.5 py-3 flex items-center gap-2.5">
          <Check size={16} className="text-emerald-300 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-bold text-white tabular-nums leading-none">이번 주 {weeklyCompletionCount}회</div>
            <div className="text-[10px] text-white/35 mt-1">완료했어요</div>
          </div>
        </div>
        <button
          onClick={() => openSheet({ kind: 'actionCompose' })}
          className="shrink-0 w-11 h-11 rounded-full bg-white text-ink-950 flex items-center justify-center active:scale-95 transition"
          aria-label="할 일 추가"
        >
          <Plus size={18} />
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/30 uppercase tracking-wide">
            <Bell size={11} /> 리마인더
          </div>
          <button
            onClick={() => openSheet({ kind: 'reminderCompose' })}
            className="text-[11px] text-brand-300 font-medium flex items-center gap-0.5"
          >
            <Plus size={12} /> 추가
          </button>
        </div>
        <Card className="space-y-0">
          {shiftReminder && (
            <div className="flex items-center gap-2.5 py-2.5 border-b border-white/6">
              <div className="min-w-0 flex-1">
                <div className={`text-sm ${shiftReminder.enabled ? 'text-white/85' : 'text-white/35'}`}>{shiftReminder.label}</div>
                <div className="flex items-center gap-1 mt-1">
                  {OFFSET_OPTIONS.map((min) => (
                    <button
                      key={min}
                      onClick={() => setShiftReminderOffset(min)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition ${
                        shiftReminder.offsetMinutes === min ? 'bg-white text-ink-950' : 'bg-white/8 text-white/45'
                      }`}
                    >
                      {min}분 전
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => fireReminderNow(shiftReminder.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/35 hover:text-brand-300 hover:bg-white/8 transition shrink-0"
                title="지금 테스트"
                aria-label="지금 테스트"
              >
                <BellRing size={13} />
              </button>
              <Toggle checked={shiftReminder.enabled} onChange={() => toggleReminder(shiftReminder.id)} label="근무 시작 알림" />
            </div>
          )}
          {customReminders.length === 0 ? (
            <p className="text-xs text-white/35 py-2.5">아직 만든 리마인더가 없어요. 위 + 버튼으로 추가해보세요.</p>
          ) : (
            customReminders.map((r) => <ReminderRow key={r.id} reminder={r} />)
          )}
        </Card>
      </div>

      <button
        onClick={() => openSheet({ kind: 'actionCompose' })}
        className="w-full flex items-center gap-2.5 rounded-xl bg-brand-500/10 border border-brand-400/25 px-4 py-3 text-left"
      >
        <Sparkles size={16} className="text-brand-300 shrink-0" />
        <span className="text-xs text-brand-100/90">"오늘 마감할 때 할 일 만들어줘" — AI에게 부탁해보세요</span>
      </button>

      <div>
        <Card className="divide-y-0">
          {active.length === 0 && <p className="text-xs text-white/35 py-2">오늘 할 일이 없어요. + 버튼으로 추가해보세요.</p>}
          {active.map((a) => (
            <ActionRow key={a.id} action={a} />
          ))}
        </Card>
      </div>

      {completed.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-white/30 uppercase tracking-wide">
            <User size={11} /> 완료됨
          </div>
          <Card>
            {completed.map((a) => (
              <ActionRow key={a.id} action={a} />
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}
