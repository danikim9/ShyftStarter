import { useBellatrix } from '../../lib/bellatrixStore'

export function BxToast() {
  const { toast } = useBellatrix()
  return (
    <div className={`absolute inset-x-4 z-[55] flex justify-center transition-all duration-300 ${toast ? 'top-4 opacity-100' : '-top-10 opacity-0'}`} aria-live="polite">
      <div className="max-w-full rounded-full bg-ink-950 text-white text-xs font-semibold px-4 py-2 shadow-xl text-center">{toast}</div>
    </div>
  )
}
