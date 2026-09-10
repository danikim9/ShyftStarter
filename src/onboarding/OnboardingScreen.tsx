// 22차 — 온보딩 랜딩 화면. 로그인 버튼 화면(LoginScreen) 앞에 붙는 3장짜리
// 소개 카드다. 처음 앱을 여는 사람이 "이게 뭐 하는 앱이지"부터 시작하지
// 않도록, 3개 탭(My Shift / My Actions / Team) 각각이 주는 가치를 한 장씩
// 짧게 보여준다 — 실제 화면 스크린샷 대신 아이콘 + 카피만 쓰는 가벼운
// 형태(별도 온보딩 전용 에셋/일러스트 제작 없이 지금 구현 가능한 선에서).
// "건너뛰기"는 언제든 바로 로그인 화면으로 넘어갈 수 있게 한다.

import { useState } from 'react'
import { Sun, Sparkles, TrendingUp, ChevronRight } from 'lucide-react'

interface Slide {
  icon: typeof Sun
  tint: string
  title: string
  body: string
}

const SLIDES: Slide[] = [
  {
    icon: Sun,
    tint: 'from-brand-400 to-brand-700',
    title: '오늘, 하나의 행동에만 집중해요',
    body: '근무 시작 전 오늘의 포커스와 10초 마이크로 코칭을 확인하고, 응대에서 딱 하나만 시도해요.',
  },
  {
    icon: Sparkles,
    tint: 'from-emerald-signal to-emerald-700',
    title: '시도한 만큼 기록해요',
    body: '시도할 때마다 +, 끝나면 20초 체크인. 잘한 척이 아니라 실제로 한 것을 남겨요.',
  },
  {
    icon: TrendingUp,
    tint: 'from-amber-signal to-amber-700',
    title: '근거로 성장을 확인해요',
    body: '내 행동 기록과 매니저 관찰이 쌓이면, 어떤 행동이 매장 성과와 함께 움직이는지 보여드려요.',
  },
]

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0)
  const isLast = idx === SLIDES.length - 1
  const slide = SLIDES[idx]
  const Icon = slide.icon

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#f3edff_0%,_#ffffff_55%)] flex items-center justify-center py-0 sm:py-8 px-0 sm:px-4">
      <div className="relative w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:rounded-[2.75rem] sm:border sm:border-ink-950/8 overflow-hidden flex flex-col bg-paper sm:shadow-[0_30px_80px_-20px_rgba(139,92,246,0.25)] px-7">
        {/* 28차 — 실기기(노치/다이나믹 아일랜드)에서 실제 상태 표시줄과 겹치는
            문제 수정 — App.tsx StatusBar와 동일하게 안전 영역만큼 위쪽 여백을
            확보한다(프리뷰에서는 기존 pt-6 그대로, 안전 영역이 더 크면 그만큼). */}
        <div className="flex justify-end" style={{ paddingTop: 'max(1.5rem, var(--safe-top))' }}>
          <button onClick={onDone} className="text-xs text-ink-950/35 font-medium py-1.5 px-2 -mr-2">
            건너뛰기
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div
            key={idx}
            className={`w-20 h-20 rounded-[1.75rem] bg-gradient-to-br ${slide.tint} flex items-center justify-center shadow-lg shadow-brand-500/20 mb-7`}
          >
            <Icon size={32} className="text-white" strokeWidth={1.8} />
          </div>
          <h1 className="text-ink-950 text-xl font-bold mb-2.5 leading-snug">{slide.title}</h1>
          <p className="text-ink-950/45 text-sm leading-relaxed max-w-[280px]">{slide.body}</p>
        </div>

        <div className="pb-10 space-y-5">
          <div className="flex items-center justify-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`${i + 1}번째 화면으로 이동`}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-brand-500' : 'w-1.5 bg-ink-950/15'}`}
              />
            ))}
          </div>
          <button
            onClick={() => (isLast ? onDone() : setIdx((v) => v + 1))}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3.5 text-sm shadow-sm shadow-brand-500/25 active:scale-[0.98] transition"
          >
            {isLast ? '시작하기' : '다음'}
            {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
