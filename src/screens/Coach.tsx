import { useMemo } from 'react'
import { MessageSquareText, GraduationCap } from 'lucide-react'
import { useAppState } from '../lib/store'
import { generateCoachingCard, recommendLearningModule } from '../lib/aiEngine'
import { SKILLS } from '../data/skills'
import { Card, SectionLabel, Badge, PrimaryButton, SecondaryButton } from '../components/ui'

export function Coach() {
  const { employee, openSheet } = useAppState()
  const card = useMemo(() => generateCoachingCard(employee), [employee])
  const meta = SKILLS[card.skillId]
  const learningModule = recommendLearningModule(employee)

  return (
    <div className="px-4 pt-5 pb-8 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white mb-1">AI Coach</h1>
        <p className="text-xs text-white/40">Your AI performance companion — 감시가 아닌, 성장을 위한 코치예요.</p>
      </div>

      <div className="flex items-center gap-2">
        <Badge tone="brand">{meta.nameKo}</Badge>
        <span className="text-[11px] text-white/35">방금 생성됨</span>
      </div>

      <Card>
        <SectionLabel>WHAT HAPPENED?</SectionLabel>
        <p className="text-sm text-white/85 leading-relaxed">{card.what}</p>
      </Card>

      <Card>
        <SectionLabel>WHY DOES IT MATTER?</SectionLabel>
        <p className="text-sm text-white/85 leading-relaxed">{card.why}</p>
      </Card>

      <Card className="bg-brand-600/20 border-brand-400/30">
        <SectionLabel>WHAT SHOULD I DO NEXT?</SectionLabel>
        <p className="text-base text-white font-medium leading-snug">{card.nextAction.label}</p>
        <div className="mt-1 text-xs text-white/50">예상 소요 시간 · {card.nextAction.durationMin}분</div>
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        <PrimaryButton onClick={() => openSheet({ kind: 'rolePlay' })} className="flex items-center justify-center gap-1.5">
          <MessageSquareText size={15} /> START ROLE-PLAY
        </PrimaryButton>
        <SecondaryButton onClick={() => openSheet({ kind: 'learn' })} className="flex items-center justify-center gap-1.5">
          <GraduationCap size={15} /> {learningModule.durationMin}분 학습
        </SecondaryButton>
      </div>

      <div className="rounded-xl bg-white/4 border border-white/8 px-4 py-3 flex items-start gap-2.5">
        <p className="text-[11px] text-white/40 leading-relaxed">
          범용 챗봇 UI가 아니에요 — AI Coach는 항상 "무슨 일이 있었나 → 왜 중요한가 → 지금 무엇을 하나"에만 답해요.
          Role-play는 텍스트 기반 시뮬레이션이며, 음성 녹음·음성 캡처는 어떤 단계에서도 사용하지 않아요.
        </p>
      </div>
    </div>
  )
}
