import type { ReactNode } from 'react'
import { Card } from '../../components/ui'

export function KpiCard({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: ReactNode
  label: string
  value: string
  sublabel?: string
}) {
  return (
    <Card className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-ink-950/40">
        {icon}
        <span className="text-[11px] font-semibold tracking-wide uppercase">{label}</span>
      </div>
      <div className="text-2xl font-bold text-ink-950 tabular-nums leading-none">{value}</div>
      {sublabel && <div className="text-[11px] text-ink-950/35">{sublabel}</div>}
    </Card>
  )
}
