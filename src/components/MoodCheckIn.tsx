import { useState } from 'react'
import type { MoodValue } from '../types'
import { useAppState } from '../lib/store'

const HEART_LABELS: Record<MoodValue, string> = {
  1: '많이 힘들어요',
  2: '조금 힘들어요',
  3: '보통이에요',
  4: '괜찮아요',
  5: '아주 좋아요',
}

export function MoodCheckIn() {
  const { moodCheckedIn, submitMood, skipMoodCheckIn } = useAppState()
  const [hover, setHover] = useState<MoodValue | null>(null)
  const open = !moodCheckedIn

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center p-6 transition-opacity duration-300 ${
        open ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-xs rounded-3xl bg-ink-900 border border-white/10 shadow-2xl p-6 text-center transition-all duration-300 ${
          open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="text-3xl mb-2">👋</div>
        <h3 className="text-white font-bold text-base mb-1">오늘 컨디션 어때요?</h3>
        <p className="text-white/40 text-xs mb-5">하트 하나만 눌러주세요 · 1초면 끝나요</p>

        <div className="flex items-center justify-center gap-2 mb-3">
          {([1, 2, 3, 4, 5] as MoodValue[]).map((v) => (
            <button
              key={v}
              onClick={() => submitMood(v)}
              onMouseEnter={() => setHover(v)}
              onMouseLeave={() => setHover(null)}
              className="text-3xl leading-none transition-transform active:scale-90 hover:scale-110"
              aria-label={HEART_LABELS[v]}
            >
              {(hover ?? 0) >= v ? '❤️' : '🤍'}
            </button>
          ))}
        </div>
        <div className="h-4 text-xs text-white/35 mb-4">{hover ? HEART_LABELS[hover] : ' '}</div>

        <button onClick={skipMoodCheckIn} className="text-xs text-white/30 hover:text-white/50 transition">
          다음에 할게요
        </button>
      </div>
    </div>
  )
}
