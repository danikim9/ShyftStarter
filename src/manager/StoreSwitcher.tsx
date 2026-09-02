import { useState } from 'react'
import { Check, ChevronDown, Store } from 'lucide-react'
import { STORES } from '../data/stores'
import { useManagerState } from '../lib/managerStore'

// 27차 — iPhone UI 대응: 모바일 상단 바에서도 재사용할 수 있도록 여백을
// 컴포넌트 자체가 아니라 호출부(className prop)에서 결정하게 했다. 기본값은
// 기존 사이드바 여백 그대로라 데스크톱 쪽은 동작 변화 없음.
export function StoreSwitcher({ className = 'px-2 mb-4' }: { className?: string }) {
  const { selectedStoreId, setSelectedStoreId } = useManagerState()
  const [open, setOpen] = useState(false)
  const current = STORES.find((s) => s.id === selectedStoreId) ?? STORES[0]

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-xl bg-ink-950/6 hover:bg-ink-950/10 border border-ink-950/10 px-3 py-2.5 transition"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Store size={14} className="text-brand-600 shrink-0" />
          <span className="text-sm font-semibold text-ink-950 truncate">{current.name}</span>
        </span>
        <ChevronDown size={14} className={`text-ink-950/40 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-2 right-2 top-full mt-1.5 z-40 rounded-xl bg-ink-900 border border-ink-950/10 shadow-2xl overflow-hidden">
            {STORES.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedStoreId(s.id)
                  setOpen(false)
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-ink-950/6 transition text-left"
              >
                <span className="min-w-0">
                  <span className="text-sm text-ink-950/85 block truncate">{s.name}</span>
                  {!s.ready && <span className="text-[10px] text-ink-950/30">데이터 준비 중</span>}
                </span>
                {s.id === selectedStoreId && <Check size={14} className="text-brand-600 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
