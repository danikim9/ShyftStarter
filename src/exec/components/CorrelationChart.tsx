import { ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { STORES } from '../../data/execData'
import { linearRegression, topGroupUplift } from '../../lib/execAnalytics'

export function CorrelationChart() {
  const points = STORES.map((s) => ({ x: s.checklistCompletionRate, y: s.atv, name: s.name }))
  const { slope, intercept } = linearRegression(points.map((p) => p.x), points.map((p) => p.y))
  const { topItems } = topGroupUplift(STORES, (s) => s.checklistCompletionRate, (s) => s.atv, 0.2)
  const topIds = new Set(topItems.map((s) => s.id))

  const xs = points.map((p) => p.x)
  const minX = Math.min(...xs) - 5
  const maxX = Math.max(...xs) + 5
  const regressionLine = [
    { x: minX, y: slope * minX + intercept },
    { x: maxX, y: slope * maxX + intercept },
  ]

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 12, right: 20, bottom: 24, left: 4 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="x"
            type="number"
            domain={[minX, maxX]}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
            tickLine={false}
            label={{ value: '체크리스트 이수율 (%) →', position: 'insideBottom', offset: -14, fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
          />
          <YAxis
            dataKey="y"
            type="number"
            domain={['dataMin - 8000', 'dataMax + 8000']}
            tickFormatter={(v) => `₩${Math.round(v / 1000)}k`}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
            tickLine={false}
            width={54}
            label={{ value: 'ATV →', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              if (d.name === undefined) return null
              return (
                <div className="rounded-xl bg-ink-800 border border-white/10 px-3 py-2 text-xs">
                  <div className="text-white font-semibold mb-0.5">{d.name}</div>
                  <div className="text-white/50">
                    이수율 {d.x}% · ATV ₩{Math.round(d.y / 1000)}k
                  </div>
                </div>
              )
            }}
          />
          <Scatter data={points} fill="#5b5ff2">
            {points.map((_, i) => (
              <Cell key={i} fill={topIds.has(STORES[i].id) ? '#22c55e' : '#5b5ff2'} />
            ))}
          </Scatter>
          <Line data={regressionLine} dataKey="y" stroke="#f5a524" strokeWidth={2} dot={false} activeDot={false} type="linear" legendType="none" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
