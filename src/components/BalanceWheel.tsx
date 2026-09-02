import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import type { EmployeeSkillScore } from '../types'
import { SKILLS, WHEEL_SKILL_ORDER } from '../data/skills'

export function BalanceWheel({ skills }: { skills: EmployeeSkillScore[] }) {
  const data = WHEEL_SKILL_ORDER.map((id) => {
    const s = skills.find((sk) => sk.skillId === id)!
    return {
      skill: SKILLS[id].nameKo,
      입사시: s.history[0]?.score ?? s.score,
      현재: s.score,
    }
  })

  return (
    <div className="h-72 w-full -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="rgba(43,36,64,0.12)" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: 'rgba(43,36,64,0.75)', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'rgba(43,36,64,0.25)', fontSize: 9 }}
            axisLine={false}
          />
          <Radar
            name="입사 시"
            dataKey="입사시"
            stroke="rgba(43,36,64,0.35)"
            fill="rgba(43,36,64,0.08)"
            fillOpacity={1}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          <Radar
            name="현재"
            dataKey="현재"
            stroke="#8184fb"
            fill="#5b5ff2"
            fillOpacity={0.35}
            strokeWidth={2}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'rgba(43,36,64,0.7)' }}
            iconType="circle"
          />
          <Tooltip
            contentStyle={{
              background: '#ffffff',
              border: '1px solid rgba(43,36,64,0.1)',
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: '#2b2440' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
