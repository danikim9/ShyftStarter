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
      <div className="flex items-center gap-2 text-white/40">
        {icon}
        <span className="text-[11px] font-semibold tracking-wide uppercase">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white tabular-nums leading-none">{value}</div>
      {sublabel && <div className="text-[11px] text-white/35">{sublabel}</div>}
    </Card>
  )
}
