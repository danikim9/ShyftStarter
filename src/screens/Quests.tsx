import { ChevronRight, Sparkles } from 'lucide-react'
import { useAppState } from '../lib/store'
import { SKILLS } from '../data/skills'
import { Card, SectionLabel, Badge, ProgressBar } from '../components/ui'
import type { Quest } from '../types'

function QuestRow({ quest }: { quest: Quest }) {
  const { openSheet } = useAppState()
  const meta = SKILLS[quest.skillId]
  return (
    <button
      onClick={() => openSheet({ kind: 'questDetail', questId: quest.id })}
      className="w-full text-left py-3 border-b border-ink-950/6 last:border-0"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Badge tone="brand">{meta.nameKo}</Badge>
          <span className="text-sm text-ink-950/85">{quest.title}</span>
        </div>
        <ChevronRight size={15} className="text-ink-950/25 shrink-0" />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={quest.progress} max={quest.target} />
        </div>
        <span className="text-xs text-ink-950/40 tabular-nums w-12 text-right">
          {quest.progress}/{quest.target}
        </span>
      </div>
    </button>
  )
}

export function Quests() {
  const { quests } = useAppState()
  const active = quests.filter((q) => q.status === 'active')
  const completed = quests.filter((q) => q.status === 'completed')

  return (
    <div className="px-4 pt-5 pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-950">Quests</h1>
        <Badge tone="brand">ACTIVE {active.length}</Badge>
      </div>

      <div>
        <SectionLabel>ACTIVE QUESTS</SectionLabel>
        <Card>
          {active.map((q) => (
            <QuestRow key={q.id} quest={q} />
          ))}
          {active.length === 0 && (
            <p className="text-sm text-ink-950/40 py-4 text-center">진행 중인 퀘스트가 없어요. 오늘의 미션을 확인해보세요.</p>
          )}
        </Card>
      </div>

      {completed.length > 0 && (
        <div>
          <SectionLabel>COMPLETED TODAY</SectionLabel>
          <Card className="space-y-2.5">
            {completed.map((q) => (
              <div key={q.id} className="flex items-center gap-2.5 text-sm">
                <Sparkles size={15} className="text-amber-600 shrink-0" />
                <span className="text-ink-950/70">{q.title}</span>
                <span className="ml-auto text-amber-600 font-semibold text-xs">+{q.rewardXp} XP</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}
