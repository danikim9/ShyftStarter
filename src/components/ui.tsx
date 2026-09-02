import type { ReactNode } from 'react'

// 23차 — 밝고 귀여운 라이트 테마. 페이지 배경 자체가 흰색이라, 카드는 살짝
// 떠 보이는 아주 옅은 라벤더 그레이(ink-900)로 채우고 얇은 보더로 경계를
// 준다(예전엔 어두운 배경 위에 반투명 흰색 + blur로 "떠 있는" 느낌을 냈지만,
// 흰 배경 위에서는 blur가 의미가 없어 제거).
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-ink-950/7 bg-ink-900 p-4 ${className}`}>
      {children}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-semibold tracking-wide text-ink-950/40 uppercase mb-2">{children}</div>
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'brand' | 'amber' | 'rose' | 'emerald' }) {
  const tones: Record<string, string> = {
    default: 'bg-ink-950/8 text-ink-950/70',
    brand: 'bg-brand-500/20 text-brand-700',
    amber: 'bg-amber-signal/15 text-amber-600',
    rose: 'bg-rose-signal/15 text-rose-600',
    emerald: 'bg-emerald-signal/15 text-emerald-600',
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
    <div className="h-2 w-full rounded-full bg-ink-950/8 overflow-hidden">
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
      className={`w-full rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 text-sm shadow-sm shadow-brand-500/25 active:scale-[0.98] transition disabled:opacity-40 disabled:active:scale-100 ${className}`}
    >
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${checked ? 'bg-brand-500' : 'bg-ink-950/15'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-4' : 'left-0.5'}`} />
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
      className={`w-full rounded-xl bg-ink-950/8 hover:bg-ink-950/12 text-ink-950 font-medium py-3 text-sm active:scale-[0.98] transition disabled:opacity-40 disabled:active:scale-100 ${className}`}
    >
      {children}
    </button>
  )
}
