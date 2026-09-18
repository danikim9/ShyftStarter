// First-run setup for a new personal user: team (skippable) → next shift
// (skippable) → one goal. Demo accounts skip this entirely.
import { useState } from 'react'
import { Users, CalendarPlus, Target, ChevronRight } from 'lucide-react'
import { useBellatrix } from '../lib/bellatrixStore'
import { JoinTeamSheet } from '../components/bellatrix/sheets/JoinTeamSheet'
import { ShiftComposerSheet } from '../components/bellatrix/sheets/ShiftComposerSheet'
import { GoalComposerSheet } from '../components/bellatrix/sheets/GoalComposerSheet'
import { BxToast } from '../components/bellatrix/BxToast'

type Step = 'team' | 'shift' | 'goal'
const ORDER: Step[] = ['team', 'shift', 'goal']

const META: Record<Step, { icon: typeof Users; title: string; body: string; skip: string }> = {
  team: { icon: Users, title: '팀이 있다면 참여해요', body: '초대 코드가 없어도 괜찮아요. 개인 기능은 전부 쓸 수 있어요.', skip: '나중에 할게요' },
  shift: { icon: CalendarPlus, title: '다음 근무는 언제예요?', body: '근무를 등록하면 근무 전 30초 준비와 근무 후 5초 회고를 제때 열어줘요.', skip: '나중에 등록할게요' },
  goal: { icon: Target, title: '오늘 시도할 행동 하나만', body: '추천 목표에서 고르면 10초예요. 나만 보는 목표예요.', skip: '나중에 고를게요' },
}

export function SetupFlow({ onDone }: { onDone: () => void }) {
  const { trackEvent } = useBellatrix()
  const [idx, setIdx] = useState(0)
  const step = ORDER[idx]
  const meta = META[step]
  const Icon = meta.icon

  const next = () => {
    if (idx >= ORDER.length - 1) onDone()
    else setIdx((i) => i + 1)
  }
  const skip = () => {
    if (step === 'team') trackEvent('team_skipped')
    next()
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#e3faf5_0%,_#ffffff_55%)] flex items-center justify-center py-0 sm:py-8 px-0 sm:px-4">
      <div className="relative w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:rounded-[2.75rem] sm:border sm:border-ink-950/8 overflow-hidden flex flex-col bg-paper sm:shadow-[0_30px_80px_-20px_rgba(13,133,120,0.18)]" style={{ transform: 'translateZ(0)' }}>
        <div className="shrink-0 px-6 flex items-center justify-between" style={{ paddingTop: 'max(1rem, var(--safe-top))' }}>
          <div className="flex items-center gap-1.5">
            {ORDER.map((s, i) => (
              <span key={s} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-brand-500' : i < idx ? 'w-1.5 bg-brand-300' : 'w-1.5 bg-ink-950/15'}`} />
            ))}
          </div>
          <button onClick={skip} className="text-xs text-ink-950/40 py-2 inline-flex items-center gap-0.5">
            {meta.skip} <ChevronRight size={13} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto app-scroll px-6 pb-10 pt-4 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center text-ink-950 shadow-md shadow-brand-500/25 shrink-0">
              <Icon size={22} strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-ink-950 leading-snug">{meta.title}</h1>
              <p className="text-xs text-ink-950/45 mt-0.5 leading-relaxed">{meta.body}</p>
            </div>
          </div>
          <div key={step}>
            {step === 'team' && <JoinTeamSheet onDone={next} />}
            {step === 'shift' && <ShiftComposerSheet onDone={next} />}
            {step === 'goal' && <GoalComposerSheet onDone={next} />}
          </div>
        </div>
        <BxToast />
      </div>
    </div>
  )
}
