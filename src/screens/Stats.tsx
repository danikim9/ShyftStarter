import { useState } from 'react'
import { useAppState } from '../lib/store'
import { SKILLS, ALL_SKILL_ORDER } from '../data/skills'
import { LEVEL_LABELS, type PerformanceLevel } from '../types'
import { Card, SectionLabel, ProgressBar } from '../components/ui'
import { StatBar } from '../components/StatBar'
import { BalanceWheel } from '../components/BalanceWheel'
import { TrendLine } from '../components/TrendLine'
import { pickFocusSkill } from '../lib/aiEngine'
import { TIER_BAR_COLOR, scoreTier } from '../lib/skillColor'

export function Stats() {
  const { employee } = useAppState()
  const [selected, setSelected] = useState(pickFocusSkill(employee.skills))

  const orderedSkills = ALL_SKILL_ORDER.map((id) => employee.skills.find((s) => s.skillId === id)!)
  const selectedSkill = employee.skills.find((s) => s.skillId === selected)!
  const selectedMeta = SKILLS[selected]
  const tier = scoreTier(selectedSkill.score)

  return (
    <div className="px-4 pt-5 pb-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-950 mb-3">My Performance</h1>
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-ink-950">
              Level {employee.level} — {LEVEL_LABELS[employee.level]}
            </span>
            <span className="text-xs text-ink-950/40 tabular-nums">
              {employee.xp.toLocaleString()} / {employee.xpToNextLevel.toLocaleString()} XP
            </span>
          </div>
          <ProgressBar value={employee.xp} max={employee.xpToNextLevel} colorClass="bg-gradient-to-r from-brand-400 to-brand-600" />
        </Card>
      </div>

      {/* Balance Wheel */}
      <div>
        <SectionLabel>CAPABILITY STAT WHEEL</SectionLabel>
        <Card>
          <BalanceWheel skills={employee.skills} />
          <p className="text-[11px] text-ink-950/35 text-center -mt-2">입사 시 대비 현재 6대 핵심 역량 밸런스</p>
        </Card>
      </div>

      {/* Bar stats */}
      <div>
        <SectionLabel>CAPABILITY SCORE</SectionLabel>
        <Card className="space-y-3.5">
          {orderedSkills.map((s) => (
            <StatBar key={s.skillId} skill={s} selected={s.skillId === selected} onClick={() => setSelected(s.skillId)} />
          ))}
        </Card>
      </div>

      {/* Selected skill detail */}
      <div>
        <SectionLabel>{selectedMeta.nameEn.toUpperCase()} — SHIFT-BY-SHIFT GROWTH</SectionLabel>
        <Card>
          <TrendLine points={selectedSkill.history} color={TIER_BAR_COLOR[tier]} />
          <div className="grid grid-cols-4 gap-2 mt-2 pt-3 border-t border-ink-950/8 text-center">
            <div>
              <div className="text-ink-950 font-bold text-sm">{selectedSkill.score}</div>
              <div className="text-[10px] text-ink-950/35 mt-0.5">Score</div>
            </div>
            <div>
              <div className="text-ink-950 font-bold text-sm">{Math.round(selectedSkill.confidence * 100)}%</div>
              <div className="text-[10px] text-ink-950/35 mt-0.5">Confidence</div>
            </div>
            <div>
              <div className="text-ink-950 font-bold text-sm">{selectedSkill.evidenceCount}건</div>
              <div className="text-[10px] text-ink-950/35 mt-0.5">Evidence</div>
            </div>
            <div>
              <div className={`font-bold text-sm ${selectedSkill.trendDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {selectedSkill.trendDelta >= 0 ? '+' : ''}
                {selectedSkill.trendDelta}
              </div>
              <div className="text-[10px] text-ink-950/35 mt-0.5">Trend</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Level ladder */}
      <div>
        <SectionLabel>PERFORMANCE LEVEL</SectionLabel>
        <Card className="space-y-1.5">
          {([1, 2, 3, 4, 5] as PerformanceLevel[]).map((lv) => (
            <div
              key={lv}
              className={`flex items-center gap-3 py-1.5 px-2 rounded-lg ${
                lv === employee.level ? 'bg-brand-500/15' : ''
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  lv === employee.level ? 'bg-brand-500 text-white' : 'bg-ink-950/8 text-ink-950/40'
                }`}
              >
                {lv}
              </span>
              <span className={`text-sm ${lv === employee.level ? 'text-ink-950 font-semibold' : 'text-ink-950/45'}`}>
                {LEVEL_LABELS[lv]}
              </span>
              {lv === employee.level && <span className="ml-auto text-[10px] text-brand-600 font-semibold">CURRENT</span>}
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
