import type { ReactNode } from 'react'
import { AlertCircle, Eye, RefreshCw, UserCheck } from 'lucide-react'
import type { ConfidenceLevel, EvidenceSource } from '../../types/bellatrix'
import { CONFIDENCE_LABEL, SOURCE_LABEL, STRENGTH_LABEL, STRENGTH_TONE, type EvidenceStrength } from '../../lib/analytics/confidence'
import { Badge, PrimaryButton } from '../ui'

export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  columns = 0,
}: {
  options: { value: T; label: string }[]
  value: T | null
  onChange: (v: T) => void
  columns?: number
}) {
  const cls = columns > 0 ? `grid grid-cols-${columns} gap-2` : 'flex flex-wrap gap-2'
  return (
    <div className={cls}>
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition active:scale-[0.97] ${
              active ? 'bg-brand-500 border-brand-500 text-white shadow-sm' : 'bg-white border-ink-950/10 text-ink-950/75'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Question({ n, text, children }: { n?: number; text: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-ink-950">
        {n !== undefined && <span className="text-brand-600 mr-1.5">{n}.</span>}
        {text}
      </div>
      {children}
    </div>
  )
}

export const inputClass =
  'w-full rounded-xl bg-white border border-ink-950/10 px-3.5 py-3 text-[16px] text-ink-950 placeholder:text-ink-950/25 outline-none focus:border-brand-400/60'

export function TextArea({ value, onChange, placeholder, rows = 2 }: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  return <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={`${inputClass} resize-none`} />
}

export function NumberField({ label, value, onChange, suffix, placeholder = '0' }: { label: string; value: string; onChange: (v: string) => void; suffix?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-ink-950/45 mb-1 block">{label}</span>
      <div className="relative">
        <input inputMode="decimal" pattern="[0-9]*" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
        {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-ink-950/35">{suffix}</span>}
      </div>
    </label>
  )
}

export function EvidenceSourceBadge({ source, confidence }: { source: EvidenceSource; confidence: ConfidenceLevel }) {
  const tone = source === 'manager_observation' ? 'emerald' : source === 'employee_self_report' ? 'amber' : 'default'
  const Icon = source === 'manager_observation' ? UserCheck : Eye
  return (
    <Badge tone={tone}>
      <Icon size={10} /> {SOURCE_LABEL[source]} · 신뢰도 {CONFIDENCE_LABEL[confidence]}
    </Badge>
  )
}

export function StrengthBadge({ strength }: { strength: EvidenceStrength }) {
  return <Badge tone={STRENGTH_TONE[strength]}>{STRENGTH_LABEL[strength]}</Badge>
}

export function LoadingState({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <div className="px-4 pt-6 space-y-3" aria-busy="true">
      <div className="h-6 w-40 rounded-lg shimmer bg-ink-950/6" />
      <div className="h-28 rounded-2xl shimmer bg-ink-950/6" />
      <div className="h-40 rounded-2xl shimmer bg-ink-950/6" />
      <p className="text-xs text-ink-950/35 text-center pt-2">{label}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="px-6 pt-16 text-center space-y-4">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-signal/10 flex items-center justify-center">
        <AlertCircle size={22} className="text-rose-600" />
      </div>
      <p className="text-sm text-ink-950/70 leading-relaxed">{message}</p>
      {onRetry && (
        <PrimaryButton onClick={onRetry} className="flex items-center justify-center gap-1.5">
          <RefreshCw size={14} /> 다시 시도
        </PrimaryButton>
      )}
    </div>
  )
}

export function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="text-center py-6 space-y-2">
      <div className="w-10 h-10 mx-auto rounded-xl bg-ink-950/6 flex items-center justify-center text-ink-950/40">{icon}</div>
      <div className="text-sm font-semibold text-ink-950/80">{title}</div>
      <p className="text-xs text-ink-950/40 leading-relaxed max-w-[260px] mx-auto">{body}</p>
    </div>
  )
}

