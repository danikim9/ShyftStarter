import type { StorePerformance } from '../../types'
import { REGIONS, STORES } from '../../data/execData'
import { ProgressBar } from '../../components/ui'

function fmtAtv(v: number) {
  return `₩${Math.round(v / 1000)}k`
}

function StoreRow({ store }: { store: StorePerformance }) {
  return (
    <div className="grid grid-cols-[1.4fr_0.6fr_1fr_0.9fr_0.9fr] gap-3 items-center py-2.5 border-b border-ink-950/6 last:border-0">
      <div>
        <div className="text-sm text-ink-950 font-medium">{store.name}</div>
        <div className="text-[10px] text-ink-950/35">{store.employeeCount}명</div>
      </div>
      <div className="text-xs text-ink-950/60 tabular-nums text-right">{fmtAtv(store.atv)}</div>
      <div>
        <div className="flex items-center justify-between text-[10px] text-ink-950/40 mb-1">
          <span>역량 {store.capabilityScore}</span>
        </div>
        <ProgressBar value={store.capabilityScore} max={100} colorClass="bg-brand-500" />
      </div>
      <div className="text-xs text-ink-950/60 tabular-nums text-right">{store.checklistCompletionRate}%</div>
      <div className="text-xs text-ink-950/60 tabular-nums text-right">{store.cvr}%</div>
    </div>
  )
}

export function StoreComparisonTable() {
  return (
    <div>
      <div className="grid grid-cols-[1.4fr_0.6fr_1fr_0.9fr_0.9fr] gap-3 px-0 pb-2 text-[10px] font-semibold text-ink-950/30 uppercase tracking-wide">
        <span>매장</span>
        <span className="text-right">ATV</span>
        <span>역량 점수</span>
        <span className="text-right">체크리스트 이수율</span>
        <span className="text-right">CVR</span>
      </div>
      {REGIONS.map((region) => {
        const stores = STORES.filter((s) => s.region === region).sort((a, b) => b.capabilityScore - a.capabilityScore)
        return (
          <div key={region} className="mb-4 last:mb-0">
            <div className="text-[11px] font-semibold text-brand-600/80 mb-1">{region}</div>
            {stores.map((s) => (
              <StoreRow key={s.id} store={s} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
