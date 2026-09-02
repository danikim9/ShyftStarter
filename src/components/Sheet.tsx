import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function Sheet({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div
      className={`absolute inset-0 z-40 transition-opacity duration-300 ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`absolute left-0 right-0 bottom-0 max-h-[88%] rounded-t-3xl bg-ink-900 border-t border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/8 shrink-0">
          <div className="w-8" />
          <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 text-white/60">
            <X size={15} />
          </button>
        </div>
        <div className="overflow-y-auto app-scroll px-5 py-4 grow">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-white/8 shrink-0">{footer}</div>}
      </div>
    </div>
  )
}
