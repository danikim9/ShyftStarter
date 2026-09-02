import { useAppState } from '../lib/store'

export function Toast() {
  const { toast } = useAppState()
  return (
    <div
      className={`absolute left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        toast ? 'top-4 opacity-100' : '-top-10 opacity-0'
      }`}
    >
      <div className="rounded-full bg-ink-950 text-white text-xs font-semibold px-4 py-2 shadow-xl whitespace-nowrap">
        {toast}
      </div>
    </div>
  )
}
