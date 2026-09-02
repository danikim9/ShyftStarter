import { useState } from 'react'
import { Check, Clock } from 'lucide-react'
import { useAppState } from '../../lib/store'
import { recommendLearningModule } from '../../lib/aiEngine'
import { SKILLS } from '../../data/skills'
import { Card, SectionLabel, Badge, PrimaryButton } from '../ui'

export function LearnView() {
  const { employee, showToast, closeSheet } = useAppState()
  const module_ = recommendLearningModule(employee)
  const meta = SKILLS[module_.skillId]
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)

  if (!started) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge tone="brand">{meta.nameKo}</Badge>
          <span className="text-xs text-ink-950/40 flex items-center gap-1">
            <Clock size={11} /> {module_.durationMin}분
          </span>
        </div>
        <h4 className="text-lg font-semibold text-ink-950 leading-snug">{module_.title}</h4>
        <Card>
          <SectionLabel>WHY</SectionLabel>
          <p className="text-sm text-ink-950/75 leading-relaxed">{module_.why}</p>
        </Card>
        <Card>
          <SectionLabel>EXPECTED OUTCOME</SectionLabel>
          <p className="text-sm text-ink-950/75 leading-relaxed">{module_.outcome}</p>
        </Card>
        <p className="text-[11px] text-ink-950/30 leading-relaxed">
          단순 강의 목록이 아니에요 — AI가 지금 가장 필요한 학습만 추천해요.
        </p>
        <PrimaryButton onClick={() => setStarted(true)}>START</PrimaryButton>
      </div>
    )
  }

  if (!done) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge tone="brand">{meta.nameKo}</Badge>
          <span className="text-xs text-ink-950/40">{module_.title}</span>
        </div>
        <div className="space-y-2.5">
          {module_.tips.map((tip, i) => (
            <div key={i} className="rounded-xl bg-ink-950/5 border border-ink-950/10 p-3.5 flex gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-brand-500/20 text-brand-700 text-[11px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm text-ink-950/80 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
        <PrimaryButton
          onClick={() => {
            setDone(true)
            showToast('학습 완료! +20 XP')
          }}
        >
          완료로 표시하기
        </PrimaryButton>
      </div>
    )
  }

  return (
    <div className="text-center py-8 space-y-3">
      <div className="w-14 h-14 rounded-full bg-emerald-signal/15 flex items-center justify-center mx-auto">
        <Check size={24} className="text-emerald-600" />
      </div>
      <h4 className="text-ink-950 font-semibold">{module_.title} 완료!</h4>
      <p className="text-sm text-ink-950/50">다음 응대에서 바로 적용해보세요.</p>
      <PrimaryButton onClick={closeSheet} className="mt-2">
        닫기
      </PrimaryButton>
    </div>
  )
}
