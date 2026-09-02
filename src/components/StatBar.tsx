import type { EmployeeSkillScore } from '../types'
import { SKILLS } from '../data/skills'
import { scoreTier, TIER_BAR_COLOR, TIER_TEXT_CLASS } from '../lib/skillColor'

export function StatBar({
  skill,
  onClick,
  selected = false,
}: {
  skill: EmployeeSkillScore
  onClick?: () => void
  selected?: boolean
}) {
  const meta = SKILLS[skill.skillId]
  const tier = scoreTier(skill.score)
  const delta = skill.trendDelta

  return (
    <button
      onClick={onClick}
      className={`w-full text-left group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm ${selected ? 'text-ink-950 font-semibold' : 'text-ink-950/80'}`}>
          {meta.nameKo}
          {selected && <span className="ml-1.5 text-brand-600">●</span>}
        </span>
        <span className={`text-sm font-bold tabular-nums ${TIER_TEXT_CLASS[tier]}`}>
          {skill.score}
          {delta !== 0 && (
            <span className="ml-1 text-[10px] font-medium text-ink-950/35">
              {delta > 0 ? '+' : ''}
              {delta}
            </span>
          )}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-ink-950/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${skill.score}%`, background: TIER_BAR_COLOR[tier] }}
        />
      </div>
    </button>
  )
}
