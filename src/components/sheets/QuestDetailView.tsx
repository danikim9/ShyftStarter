import { SKILLS } from '../../data/skills'
import { PrimaryButton, SecondaryButton, ProgressBar, Badge } from '../ui'
import { useAppState } from '../../lib/store'

export function QuestDetailView({ questId }: { questId: string }) {
  const { quests, markQuestProgress, openSheet } = useAppState()
  const quest = quests.find((q) => q.id === questId)
  if (!quest) return null

  const meta = SKILLS[quest.skillId]
  const isComplete = quest.status === 'completed'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge tone="brand">{meta.nameKo}</Badge>
        {isComplete && <Badge tone="emerald">완료</Badge>}
      </div>
      <h4 className="text-lg font-semibold text-ink-950 leading-snug">{quest.title}</h4>
      <p className="text-sm text-ink-950/65 leading-relaxed">{quest.behavior}</p>

      <div>
        <div className="flex justify-between text-xs text-ink-950/50 mb-1.5">
          <span>진행률</span>
          <span className="tabular-nums">
            {quest.progress} / {quest.target} {quest.unit}
          </span>
        </div>
        <ProgressBar value={quest.progress} max={quest.target} colorClass={isComplete ? 'bg-emerald-signal' : 'bg-brand-500'} />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-ink-950/5 border border-ink-950/10 px-4 py-3">
        <span className="text-xs text-ink-950/50">보상</span>
        <span className="text-sm font-semibold text-amber-600">+{quest.rewardXp} XP</span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <SecondaryButton onClick={() => openSheet({ kind: 'killerScript', skillId: quest.skillId })}>
          킬러 스크립트
        </SecondaryButton>
        <SecondaryButton onClick={() => openSheet({ kind: 'checklist' })}>체크리스트</SecondaryButton>
      </div>

      <PrimaryButton disabled={isComplete} onClick={() => markQuestProgress(quest.id)}>
        {isComplete ? '완료됨' : 'MARK PROGRESS'}
      </PrimaryButton>
    </div>
  )
}
