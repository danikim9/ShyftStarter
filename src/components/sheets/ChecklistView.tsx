import { Check } from 'lucide-react'
import { useAppState } from '../../lib/store'

export function ChecklistView() {
  const { checklist, toggleChecklistItem } = useAppState()

  return (
    <div className="space-y-4">
      <div className="text-[11px] font-semibold text-white/40 tracking-wide">{checklist.title}</div>
      <div className="space-y-2">
        {checklist.items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleChecklistItem(item.id)}
            className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${
              item.checked
                ? 'bg-emerald-signal/10 border-emerald-signal/30'
                : 'bg-white/4 border-white/10'
            }`}
          >
            <span
              className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center ${
                item.checked ? 'bg-emerald-signal border-emerald-signal' : 'border-white/25'
              }`}
            >
              {item.checked && <Check size={13} strokeWidth={3} className="text-ink-950" />}
            </span>
            <span className={`text-sm ${item.checked ? 'text-white/90' : 'text-white/70'}`}>{item.label}</span>
          </button>
        ))}
      </div>
      <p className="text-[12px] text-white/35 leading-relaxed pt-1">
        올바른 행동 순서를 몇 초 안에 이해·실행하기 위한 리마인드예요. 평가가 아니라 참여 신호로만 사용돼요.
      </p>
    </div>
  )
}

export function ChecklistFooter() {
  const { checklist } = useAppState()
  const doneCount = checklist.items.filter((i) => i.checked).length
  return (
    <div className="w-full rounded-xl bg-white/8 py-3 text-center text-sm font-semibold text-white">
      {doneCount} / {checklist.items.length} COMPLETED
    </div>
  )
}
