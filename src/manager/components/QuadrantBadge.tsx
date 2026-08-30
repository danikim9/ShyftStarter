import { QUADRANT_META, type WillCapabilityQuadrant } from '../../types'

export function QuadrantBadge({ quadrant }: { quadrant: WillCapabilityQuadrant }) {
  const meta = QUADRANT_META[quadrant]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: `${meta.color}22`, color: meta.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  )
}
