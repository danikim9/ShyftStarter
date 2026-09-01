import { Plus, Check, Flame, Sparkles, User } from 'lucide-react'
import { useAppState } from '../lib/store'
import { Card, Badge, ProgressBar } from '../components/ui'
import type { Action } from '../types'

const SOURCE_BADGE: Record<Action['createdBy'], { label: string; tone: 'default' | 'brand' | 'amber' } | null> = {
  self: null,
  manager: { label: '매니저가 보냄', tone: 'brand' },
  ai: { label: 'AI 추천', tone: 'amber' },
}

function ActionRow({ action }: { action: Action }) {
  const { completeAction } = useAppState()
  const done = !!action.completedAt
  const badge = SOURCE_BADGE[action.createdBy]

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/6 last:border-0">
      <button
        onClick={() => !done && completeAction(action.id)}
        disabled={done}
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition ${
          done ? 'bg-emerald-signal border-emerald-signal' : 'border-white/20 active:scale-90'
        }`}
        aria-label={done ? '완료됨' : '완료하기'}
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
  const { actions, weeklyCompletionCount, openSheet } = useAppState()
  const active = actions.filter((a) => !a.completedAt)
  const completed = actions.filter((a) => a.completedAt)

  return (
    <div className="px-4 pt-5 pb-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white mb-1">My Actions</h1>
        <p className="text-xs text-white/40">내가 만든 할 일과 매니저가 보낸 할 일이 한 곳에 있어요.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl bg-white/4 border border-white/8 px-3.5 py-3 flex items-center gap-2.5">
          <Flame size={16} className="text-amber-300 shrink-0" />
          <div>
            <div className="text-sm font-bold text-white tabular-nums leading-none">이번 주 {weeklyCompletionCount}회 완료</div>
            <div className="text-[10px] text-white/35 mt-1">잘 하고 있어요</div>
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
