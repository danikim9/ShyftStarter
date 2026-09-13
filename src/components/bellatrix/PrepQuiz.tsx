import { useState } from 'react'
import { Check, X, Zap } from 'lucide-react'
import type { PrepQuiz as PrepQuizModel } from '../../lib/prepQuiz'

/** One tap, ten seconds. Shows the right line either way — that IS the coaching. */
export function PrepQuiz({ quiz, answered, onAnswer }: { quiz: PrepQuizModel; answered: { correct: boolean } | null; onAnswer: (index: number, correct: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  const done = answered !== null || picked !== null
  const correct = answered?.correct ?? (picked !== null ? picked === quiz.correctIndex : null)

  return (
    <div className="rounded-xl border border-ink-950/8 bg-white px-3.5 py-3 space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-950/40 uppercase tracking-wide">
        <Zap size={12} /> 10초 확인
      </div>
      <div className="text-sm font-semibold text-ink-950 leading-snug">{quiz.question}</div>
      <div className="space-y-1.5">
        {quiz.options.map((o, i) => {
          const isCorrect = i === quiz.correctIndex
          const isPicked = picked === i
          const show = done && (isCorrect || isPicked)
          return (
            <button
              key={i}
              type="button"
              disabled={done}
              onClick={() => {
                setPicked(i)
                onAnswer(i, i === quiz.correctIndex)
              }}
              className={`w-full text-left rounded-lg border px-3 py-2 text-sm leading-snug transition ${
                show ? (isCorrect ? 'border-emerald-signal/50 bg-emerald-signal/10 text-emerald-800' : 'border-rose-signal/40 bg-rose-signal/8 text-rose-700') : 'border-ink-950/10 text-ink-950/80 active:scale-[0.99]'
              } disabled:opacity-100`}
            >
              <span className="flex items-start gap-2">
                {show && (isCorrect ? <Check size={14} className="shrink-0 mt-0.5" /> : <X size={14} className="shrink-0 mt-0.5" />)}
                <span>{o}</span>
              </span>
            </button>
          )
        })}
      </div>
      {done && (
        <p className="text-[11px] text-ink-950/55 leading-relaxed">
          {correct ? '맞아요. 이 문장 그대로 오늘 한 번 써보세요.' : '괜찮아요. 초록색 문장이 오늘의 답이에요. 한 번만 소리 내 읽어보세요.'}
        </p>
      )}
    </div>
  )
}
