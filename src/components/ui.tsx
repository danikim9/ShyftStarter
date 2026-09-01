import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/8 bg-ink-800/70 backdrop-blur-sm p-4 ${className}`}>
      {children}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-semibold tracking-wide text-white/40 uppercase mb-2">{children}</div>
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'brand' | 'amber' | 'rose' | 'emerald' }) {
  const tones: Record<string, string> = {
    default: 'bg-white/8 text-white/70',
    brand: 'bg-brand-500/20 text-brand-200',
    amber: 'bg-amber-signal/15 text-amber-300',
    rose: 'bg-rose-signal/15 text-rose-300',
    emerald: 'bg-emerald-signal/15 text-emerald-300',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, max, colorClass = 'bg-brand-500' }: { value: number; max: number; colorClass?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="h-2 w-full rounded-full bg-white/8 overflow-hidden">
      <div className={`h-full rounded-full ${colorClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function PrimaryButton({
  children,
  onClick,
  className = '',
  disabled = false,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl bg-white text-ink-950 font-semibold py-3 text-sm active:scale-[0.98] transition disabled:opacity-40 disabled:active:scale-100 ${className}`}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  onClick,
  className = '',
  disabled = false,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl bg-white/8 hover:bg-white/12 text-white font-medium py-3 text-sm active:scale-[0.98] transition disabled:opacity-40 disabled:active:scale-100 ${className}`}
    >
      {children}
    </button>
  )
}
