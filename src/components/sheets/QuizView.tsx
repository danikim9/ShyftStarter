import { useMemo, useState } from 'react'
import { Check, X, Crown } from 'lucide-react'
import { useAppState } from '../../lib/store'
import { recommendQuizSet } from '../../lib/aiEngine'
import { SKILLS } from '../../data/skills'
import { Card, Badge, PrimaryButton, SecondaryButton, ProgressBar } from '../ui'

// v2 — PRO: Quest 객관식 퀴즈. Role-play(직접 답변 작성)와 상호보완 관계로,
// 한 문제씩 넘어가며 즉시 정답/오답 피드백 + 해설을 보여준 뒤 마지막에
// 종합 점수를 준다. RolePlayView와 동일한 카드/배지/버튼 컴포넌트를 그대로
// 재사용해 톤을 맞췄다.
export function QuizView() {
  const { employee, showToast } = useAppState()
  const quizSet = useMemo(() => recommendQuizSet(employee), [employee])
  const meta = SKILLS[quizSet.skillId]
  const questions = quizSet.questions

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)

  const current = questions[index]
  const isLast = index === questions.length - 1
  const answered = selected !== null
  const isCorrect = answered && selected === current.correctIndex

  const selectOption = (i: number) => {
    if (answered) return
    setSelected(i)
    if (i === current.correctIndex) setCorrectCount((c) => c + 1)
  }

  const next = () => {
    if (isLast) {
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
  }

  const retry = () => {
    setIndex(0)
    setSelected(null)
    setCorrectCount(0)
    setFinished(false)
  }

  if (finished) {
    const pct = Math.round((correctCount / questions.length) * 100)
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge tone="brand">{meta.nameKo}</Badge>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-signal/15 text-amber-600 text-[10px] font-bold px-2 py-0.5">
            <Crown size={10} /> PRO
          </span>
        </div>

        <Card className="text-center">
          <div className="text-[11px] font-semibold text-ink-950/40 tracking-wide mb-1">SCORE</div>
          <div className="text-4xl font-bold text-ink-950 tabular-nums">
            {correctCount}/{questions.length}
          </div>
          <div className="mt-3">
            <ProgressBar value={pct} max={100} colorClass={pct >= 70 ? 'bg-emerald-signal' : 'bg-amber-signal'} />
          </div>
        </Card>

        <Card className="bg-amber-signal/8 border-amber-signal/25">
          <div className="text-[11px] font-semibold text-amber-600/90 tracking-wide mb-1">TIP</div>
          <p className="text-sm text-amber-50/90 leading-relaxed">
            {pct >= 70
              ? `${meta.nameKo} 개념은 잘 잡혀있어요 — 이제 Role-play로 실전 응대에 적용해보세요.`
              : `틀린 문제의 해설을 다시 한번 읽어보고, Role-play로 실전처럼 연습해보는 걸 추천해요.`}
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <SecondaryButton onClick={retry}>TRY AGAIN</SecondaryButton>
          <PrimaryButton onClick={() => showToast(`퀴즈 완료! +${correctCount * 5} XP`)}>완료</PrimaryButton>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge tone="brand">{meta.nameKo}</Badge>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-signal/15 text-amber-600 text-[10px] font-bold px-2 py-0.5">
            <Crown size={10} /> PRO
          </span>
        </div>
        <span className="text-xs text-ink-950/40 tabular-nums">
          {index + 1} / {questions.length}
        </span>
      </div>

      <ProgressBar value={index + (answered ? 1 : 0)} max={questions.length} />

      <h4 className="text-base font-semibold text-ink-950 leading-relaxed">{current.question}</h4>

      <div className="space-y-2">
        {current.options.map((opt, i) => {
          const isSelected = selected === i
          const isRight = i === current.correctIndex
          let tone = 'border-ink-950/10 bg-ink-950/4 text-ink-950/85'
          if (answered && isRight) {
            tone = 'border-emerald-signal/50 bg-emerald-signal/12 text-ink-950'
          } else if (answered && isSelected && !isRight) {
            tone = 'border-rose-signal/50 bg-rose-signal/12 text-ink-950'
          }
          return (
            <button
              key={i}
              onClick={() => selectOption(i)}
              disabled={answered}
              className={`w-full text-left rounded-xl border px-3.5 py-3 text-sm leading-relaxed transition flex items-center justify-between gap-2 disabled:opacity-100 ${tone}`}
            >
              <span>{opt}</span>
              {answered && isRight && <Check size={16} className="text-emerald-600 shrink-0" />}
              {answered && isSelected && !isRight && <X size={16} className="text-rose-600 shrink-0" />}
            </button>
          )
        })}
      </div>

      {answered && (
        <Card className={isCorrect ? 'bg-emerald-signal/8 border-emerald-signal/25' : 'bg-ink-950/5'}>
          <div className={`text-[11px] font-semibold tracking-wide mb-1 ${isCorrect ? 'text-emerald-600' : 'text-ink-950/40'}`}>
            {isCorrect ? '정답이에요' : '아쉬워요'}
          </div>
          <p className="text-sm text-ink-950/80 leading-relaxed">{current.explanation}</p>
        </Card>
      )}

      {answered && <PrimaryButton onClick={next}>{isLast ? '결과 보기' : '다음 문제'}</PrimaryButton>}

      <p className="text-[11px] text-ink-950/30 text-center leading-relaxed">
        객관식 3문제로 개념을 빠르게 점검해요. 음성 녹음·음성 캡처는 사용하지 않아요.
      </p>
    </div>
  )
}
