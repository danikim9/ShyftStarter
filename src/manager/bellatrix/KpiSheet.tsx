import { useEffect, useMemo, useState } from 'react'
import { useBellatrix, useReadyData } from '../../lib/bellatrixStore'
import type { ISODate } from '../../types/bellatrix'
import { addDaysISO, fmtShortDate } from '../../lib/dates'
import { ATTACH_RATE_DEFINITION_LABEL, deriveKpis, formatMetric } from '../../lib/analytics/metrics'
import { PrimaryButton } from '../../components/ui'
import { ChoiceChips, NumberField, Question } from '../../components/bellatrix/shared'

function num(s: string): number | null | 'invalid' {
  const t = s.trim().replace(/[,₩\s]/g, '')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 ? n : 'invalid'
}

export function KpiSheet({ presetDate }: { presetDate?: ISODate }) {
  const ready = useReadyData()
  const { submitKpi, closeSheet, today } = useBellatrix()
  const [date, setDate] = useState<ISODate>(presetDate ?? today)
  const [f, setF] = useState({ visitors: '', transactions: '', revenue: '', units: '', accessory_units: '', accessory_transactions: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existing = useMemo(() => ready?.data.outcomes.find((o) => o.outcome_date === date && o.user_id === null) ?? null, [ready, date])

  useEffect(() => {
    if (existing) {
      const s = (v: number | null) => (v === null ? '' : String(v))
      setF({
        visitors: s(existing.visitors),
        transactions: s(existing.transactions),
        revenue: s(existing.revenue),
        units: s(existing.units),
        accessory_units: s(existing.accessory_units),
        accessory_transactions: s(existing.accessory_transactions),
      })
    } else setF({ visitors: '', transactions: '', revenue: '', units: '', accessory_units: '', accessory_transactions: '' })
  }, [existing])

  if (!ready) return null
  const { data } = ready
  const parsed = {
    visitors: num(f.visitors),
    transactions: num(f.transactions),
    revenue: num(f.revenue),
    units: num(f.units),
    accessory_units: num(f.accessory_units),
    accessory_transactions: num(f.accessory_transactions),
  }
  const invalid = Object.values(parsed).some((v) => v === 'invalid')
  const clean = Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, v === 'invalid' ? null : v])) as Record<keyof typeof parsed, number | null>
  const preview = deriveKpis(clean, data.store.attach_rate_definition)

  const submit = async () => {
    if (invalid) return setError('숫자만 입력해주세요.')
    if (clean.visitors === null || clean.transactions === null || clean.revenue === null) return setError('방문자·거래 건수·매출은 필수예요.')
    if (clean.transactions > clean.visitors) return setError('거래 건수가 방문자 수보다 많을 수 없어요.')
    setBusy(true)
    setError(null)
    try {
      await submitKpi({ date, storeId: data.store.id, ...clean })
      closeSheet()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-5">
      <Question n={1} text="날짜">
        <ChoiceChips
          options={[
            { value: today, label: `오늘 ${fmtShortDate(today)}` },
            { value: addDaysISO(today, -1), label: `어제 ${fmtShortDate(addDaysISO(today, -1))}` },
            { value: addDaysISO(today, -2), label: fmtShortDate(addDaysISO(today, -2)) },
          ]}
          value={date}
          onChange={setDate}
          columns={3}
        />
        <div className="text-[11px] text-ink-950/40">
          매장: <span className="font-medium text-ink-950/70">{data.store.name}</span>
          {existing && <span className="ml-2 text-amber-600">이미 입력된 날 — 저장하면 덮어써요</span>}
        </div>
      </Question>
      <Question n={2} text="오늘 성과">
        <div className="grid grid-cols-2 gap-2.5">
          <NumberField label="방문자 *" value={f.visitors} onChange={set('visitors')} suffix="명" />
          <NumberField label="거래 건수 *" value={f.transactions} onChange={set('transactions')} suffix="건" />
          <NumberField label="매출 *" value={f.revenue} onChange={set('revenue')} suffix="원" />
          <NumberField label="판매 수량" value={f.units} onChange={set('units')} suffix="개" />
          <NumberField label="부가상품 수량" value={f.accessory_units} onChange={set('accessory_units')} suffix="개" />
          <NumberField label="부가상품 포함 거래" value={f.accessory_transactions} onChange={set('accessory_transactions')} suffix="건" />
        </div>
      </Question>
      <div className="rounded-xl bg-ink-950/4 border border-ink-950/8 p-3.5">
        <div className="text-[10px] font-semibold text-ink-950/40 uppercase tracking-wide mb-2">자동 계산</div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {(['cvr', 'atv', 'upt', 'attach_rate'] as const).map((m) => (
            <div key={m}>
              <div className="text-[10px] text-ink-950/40">{m === 'attach_rate' ? 'Attach' : m.toUpperCase()}</div>
              <div className="text-sm font-bold text-ink-950 tabular-nums">{formatMetric(m, preview[m])}</div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-ink-950/35 mt-2">Attach Rate 정의: {ATTACH_RATE_DEFINITION_LABEL[data.store.attach_rate_definition]}</div>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <PrimaryButton disabled={busy} onClick={submit}>
        {busy ? '저장 중…' : existing ? '수정 저장' : '성과 저장'}
      </PrimaryButton>
    </div>
  )
}
