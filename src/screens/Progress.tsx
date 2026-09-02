import { useMemo, useState, type ReactNode } from 'react'
import { Flame, Trophy, Target, GraduationCap } from 'lucide-react'
import { useAppState } from '../lib/store'
import { SKILLS, ALL_SKILL_ORDER } from '../data/skills'
import type { ProgressRange, SkillId } from '../types'
import { CAPABILITY_TREND, SKILL_TRAJECTORY, PROGRESS_SUMMARY, MILESTONES, skillDelta } from '../data/progressData'
import { generateProgressInsight } from '../lib/aiEngine'
import { Card, SectionLabel, Badge } from '../components/ui'
import { ProgressChart } from '../components/ProgressChart'

function RangeToggle({ range, onChange }: { range: ProgressRange; onChange: (r: ProgressRange) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-ink-950/6 p-1">
      {(['weekly', 'monthly'] as ProgressRange[]).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            range === r ? 'bg-white text-ink-950' : 'text-ink-950/50'
          }`}
        >
          {r === 'weekly' ? '주간' : '월간'}
        </button>
      ))}
    </div>
  )
}

function StatTile({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl bg-ink-950/4 border border-ink-950/8 px-3 py-3 flex flex-col gap-1">
      <div className="text-brand-600">{icon}</div>
      <div className="text-lg font-bold text-ink-950 tabular-nums leading-none">{value}</div>
      <div className="text-[10px] text-ink-950/40">{label}</div>
    </div>
  )
}

export function Progress() {
  const { employee } = useAppState()
  const [range, setRange] = useState<ProgressRange>('weekly')
  const [selectedSkill, setSelectedSkill] = useState<SkillId>('closing')

  const trend = CAPABILITY_TREND[range]
  const insight = useMemo(() => generateProgressInsight(range, trend), [range, trend])

  const deltas = ALL_SKILL_ORDER.map((id) => ({ id, delta: skillDelta(id, range) })).sort(
    (a, b) => b.delta - a.delta
  )
  const selectedTrajectory = SKILL_TRAJECTORY[range][selectedSkill]

  return (
    <div className="px-4 pt-5 pb-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-950 mb-1">My Progress</h1>
        <p className="text-xs text-ink-950/40">
          {employee.name}님이 시간에 따라 어떻게 성장하고 있는지 보여줘요 — 이번 시프트가 아니라, 지금까지의 여정이에요.
        </p>
      </div>

      {/* Streak + summary tiles */}
      <div className="grid grid-cols-4 gap-2">
        <StatTile icon={<Flame size={16} />} value={`${PROGRESS_SUMMARY.currentStreakDays}일`} label="연속 활동" />
        <StatTile icon={<Trophy size={16} />} value={`${PROGRESS_SUMMARY.longestStreakDays}일`} label="최장 기록" />
        <StatTile icon={<Target size={16} />} value={`${PROGRESS_SUMMARY.totalQuestsCompleted}`} label="퀘스트 완료" />
        <StatTile icon={<GraduationCap size={16} />} value={`${PROGRESS_SUMMARY.totalLearningCompleted}`} label="학습 완료" />
      </div>

      {/* Capability trend */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>CAPABILITY TREND</SectionLabel>
          <RangeToggle range={range} onChange={setRange} />
        </div>
        <Card>
          <ProgressChart points={trend} color="#5b5ff2" />
          <div className="mt-3 pt-3 border-t border-ink-950/8 flex items-start gap-2">
            <span className="text-sm leading-none mt-0.5">🤖</span>
            <p className="text-xs text-ink-950/70 leading-relaxed">{insight}</p>
          </div>
        </Card>
      </div>

      {/* Skill trajectory */}
      <div>
        <SectionLabel>SKILL TRAJECTORY</SectionLabel>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {deltas.map(({ id, delta }) => (
            <button
              key={id}
              onClick={() => setSelectedSkill(id)}
              className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition ${
                selectedSkill === id
                  ? 'bg-brand-500/20 border-brand-400/40 text-brand-700'
                  : 'bg-ink-950/4 border-ink-950/8 text-ink-950/55'
              }`}
            >
              {SKILLS[id].nameKo}{' '}
              <span className={delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {delta >= 0 ? '+' : ''}
                {delta}
              </span>
            </button>
          ))}
        </div>
        <Card>
          <div className="text-xs text-ink-950/50 mb-1">
            {SKILLS[selectedSkill].nameKo} · {range === 'weekly' ? '8주간' : '6개월간'} 변화
          </div>
          <ProgressChart points={selectedTrajectory} color="#22c55e" />
        </Card>
      </div>

      {/* Milestones */}
      <div>
        <SectionLabel>MILESTONES</SectionLabel>
        <Card className="grid grid-cols-2 gap-3">
          {MILESTONES.map((m) => (
            <div key={m.id} className="flex items-start gap-2">
              <span className="text-xl leading-none">{m.emoji}</span>
              <div>
                <div className="text-xs font-semibold text-ink-950 leading-tight">{m.title}</div>
                <div className="text-[10px] text-ink-950/40 leading-tight mt-0.5">{m.detail}</div>
                <Badge tone="default">{m.achievedDate}</Badge>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
