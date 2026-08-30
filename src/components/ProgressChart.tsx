import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { ProgressPoint } from '../types'

export function ProgressChart({ points, color = '#5b5ff2' }: { points: ProgressPoint[]; color?: string }) {
  const data = points.map((p) => ({ name: p.label, score: p.capabilityScore }))
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={['dataMin - 8', 'dataMax + 8']} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            contentStyle={{ background: '#171d38', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: 'white' }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
