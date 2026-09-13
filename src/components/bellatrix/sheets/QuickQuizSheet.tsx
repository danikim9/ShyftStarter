import { useMemo } from 'react'
import { useBellatrix, useReadyData } from '../../../lib/bellatrixStore'
import { buildPrepQuiz } from '../../../lib/prepQuiz'
import { cardById } from '../../../lib/selectors'
import { PrepQuiz } from '../PrepQuiz'
import { SecondaryButton } from '../../ui'

/** Growth → "다시 보기 한 문제": the same quiz, outside of Shift Prep. */
export function QuickQuizSheet({ cardId }: { cardId: string }) {
  const ready = useReadyData()
  const { logCardEvent, closeSheet } = useBellatrix()
  const quiz = useMemo(() => {
    if (!ready) return null
    const card = cardById(ready.data, cardId)
    return card ? buildPrepQuiz(card, ready.data.coaching_cards) : null
  }, [ready, cardId])
  if (!ready || !quiz) return <p className="text-sm text-ink-950/50">이 카드에는 확인 문제가 없어요.</p>
  const card = cardById(ready.data, cardId)
  return (
    <div className="space-y-4">
      {card && <div className="text-xs text-ink-950/45">{card.headline}</div>}
      <PrepQuiz quiz={quiz} answered={null} onAnswer={(index, correct) => void logCardEvent({ cardId, type: 'quiz_answered', metadata: { correct, index, context: 'review' } })} />
      <SecondaryButton onClick={closeSheet}>닫기</SecondaryButton>
    </div>
  )
}
