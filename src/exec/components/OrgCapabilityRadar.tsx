import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { ORG_CAPABILITY_MAP } from '../../data/execData'
import { SKILLS } from '../../data/skills'

export function OrgCapabilityRadar() {
  const data = ORG_CAPABILITY_MAP.map((p) => ({
    skill: SKILLS[p.skillId].nameKo,
    '도입 전': p.baseline,
    현재: p.current,
  }))

  return (
    <div className="h-72 w-full -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="rgba(255,255,255,0.12)" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: 'rgba(255,255,255,0.75)', fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }} axisLine={false} />
          <Radar name="도입 전" dataKey="도입 전" stroke="rgba(255,255,255,0.35)" fill="rgba(255,255,255,0.08)" fillOpacity={1} strokeWidth={1.5} strokeDasharray="3 3" />
          <Radar name="현재" dataKey="현재" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} strokeWidth={2} />
          <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }} iconType="circle" />
          <Tooltip contentStyle={{ background: '#171d38', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: 'white' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
