import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts'
import { team } from '../data/team'
import { computeQuadrant } from '../lib/managerAiEngine'
import { QUADRANT_META } from '../types'
import { Card, SectionLabel } from '../components/ui'
import { useManagerState } from '../lib/managerStore'

const THRESHOLD = 65

export function MatrixView() {
  const { openDetail } = useManagerState()

  const data = team.map((m) => ({
    ...m,
    quadrant: computeQuadrant(m.willScore, m.capabilityScore),
  }))

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-ink-950 mb-1">Will × Capability 매트릭스</h1>
        <p className="text-ink-950/40 text-sm max-w-xl leading-relaxed">
          역량(Capability)은 8개 스킬 점수의 평균, 참여도(Will)는 퀘스트 완료율·넛지 반응률·체크리스트 참여에
          <span className="text-ink-950/60"> 시프트 시작 시 1탭 컨디션 체크인</span>(하트 1~5, 1초 이내 응답)까지 더해
          계산돼요. 매니저의 주관적 평가는 들어가지 않아요.
        </p>
      </div>

      <Card>
        <div className="h-[420px] w-full relative">
          {/* quadrant labels */}
          <div className="absolute inset-4 pointer-events-none grid grid-cols-2 grid-rows-2 text-[11px] font-semibold">
            <div className="flex items-start justify-start p-2 text-ink-950/25">낮은 참여 · 낮은 역량</div>
            <div className="flex items-start justify-end p-2 text-ink-950/25">높은 참여 · 낮은 역량</div>
            <div className="flex items-end justify-start p-2 text-ink-950/25">낮은 참여 · 높은 역량</div>
            <div className="flex items-end justify-end p-2 text-ink-950/25">높은 참여 · 높은 역량</div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <XAxis
                type="number"
                dataKey="willScore"
                name="Will"
                domain={[0, 100]}
                tick={{ fill: 'rgba(43,36,64,0.4)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(43,36,64,0.15)' }}
                tickLine={false}
                label={{ value: 'WILL (참여도) →', position: 'insideBottom', offset: -8, fill: 'rgba(43,36,64,0.35)', fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="capabilityScore"
                name="Capability"
                domain={[0, 100]}
                tick={{ fill: 'rgba(43,36,64,0.4)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(43,36,64,0.15)' }}
                tickLine={false}
                label={{ value: 'CAPABILITY (역량) →', angle: -90, position: 'insideLeft', fill: 'rgba(43,36,64,0.35)', fontSize: 11 }}
              />
              <ZAxis range={[180, 180]} />
              <ReferenceLine x={THRESHOLD} stroke="rgba(43,36,64,0.15)" strokeDasharray="4 4" />
              <ReferenceLine y={THRESHOLD} stroke="rgba(43,36,64,0.15)" strokeDasharray="4 4" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="rounded-xl bg-ink-800 border border-ink-950/10 px-3 py-2 text-xs">
                      <div className="text-ink-950 font-semibold mb-0.5">{d.name}</div>
                      <div className="text-ink-950/50">Will {d.willScore} · Capability {d.capabilityScore}</div>
                    </div>
                  )
                }}
              />
              <Scatter
                data={data}
                onClick={(d: any) => openDetail(d.id)}
                cursor="pointer"
              >
                {data.map((d) => (
                  <Cell key={d.id} fill={QUADRANT_META[d.quadrant].color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div>
        <SectionLabel>사분면 정의 &amp; 권장 액션</SectionLabel>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(Object.keys(QUADRANT_META) as (keyof typeof QUADRANT_META)[]).map((q) => {
            const meta = QUADRANT_META[q]
            const count = data.filter((d) => d.quadrant === q).length
            return (
              <Card key={q} className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: meta.color }} />
                <div>
                  <div className="text-sm font-semibold text-ink-950">
                    {meta.label} <span className="text-ink-950/30 font-normal">· {count}명</span>
                  </div>
                  <div className="text-[11px] text-ink-950/35 mb-1">{meta.short}</div>
                  <div className="text-xs text-ink-950/55">{meta.action}</div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
