import { useRef, useState } from 'react'
import { Upload, FileText, AlertTriangle, Check } from 'lucide-react'
import { useBellatrix, useManagerData } from '../../lib/bellatrixStore'
import { CSV_TEMPLATE, parseKpiCsv, REQUIRED_COLUMNS, type CsvParseResult } from '../../lib/csvImport'
import { PrimaryButton, SecondaryButton } from '../../components/ui'
import { inputClass } from '../../components/bellatrix/shared'

export function CsvImportSheet() {
  const ready = useManagerData()
  const { importOutcomes, closeSheet } = useBellatrix()
  const fileRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [result, setResult] = useState<CsvParseResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)

  if (!ready) return null
  const { data, store } = ready

  const parse = (raw: string) => {
    setText(raw)
    if (!raw.trim()) return setResult(null)
    setResult(
      parseKpiCsv(raw, {
        knownStoreIds: [store.id],
        knownEmployeeIds: data.users.map((u) => u.id),
        companyId: data.company?.id ?? null,
        attachRateDefinition: store.attach_rate_definition,
      })
    )
  }

  const onFile = (file: File | undefined) => {
    if (!file) return
    setReadError(null)
    const reader = new FileReader()
    reader.onerror = () => setReadError('파일을 읽을 수 없어요.')
    reader.onload = () => parse(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  const doImport = async () => {
    if (!result || result.rows.length === 0) return
    setBusy(true)
    try {
      await importOutcomes(result.rows)
      closeSheet()
    } catch {
      // toast
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-950/50 leading-relaxed">
        필수 컬럼: <span className="font-mono text-[11px] text-ink-950/70">{REQUIRED_COLUMNS.join(', ')}</span>
        <br />
        선택: <span className="font-mono text-[11px] text-ink-950/70">employee_id, accessory_units, accessory_transactions</span> · 날짜는 YYYY-MM-DD
      </p>
      <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <div className="grid grid-cols-2 gap-2">
        <SecondaryButton onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-1.5">
          <Upload size={14} /> CSV 파일 선택
        </SecondaryButton>
        <SecondaryButton onClick={() => parse(CSV_TEMPLATE)} className="flex items-center justify-center gap-1.5">
          <FileText size={14} /> 예시 불러오기
        </SecondaryButton>
      </div>
      <textarea value={text} onChange={(e) => parse(e.target.value)} rows={5} placeholder="또는 CSV 내용을 여기에 붙여넣기" className={`${inputClass} font-mono text-[12px] resize-none`} />
      {readError && <p className="text-xs text-rose-600">{readError}</p>}

      {result && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <Check size={13} /> 유효 {result.rows.length}행
            </span>
            <span className={`inline-flex items-center gap-1 font-semibold ${result.errors.length ? 'text-rose-600' : 'text-ink-950/40'}`}>
              <AlertTriangle size={13} /> 오류 {result.errors.length}건
            </span>
            <span className="text-ink-950/35">/ 전체 {result.totalDataLines}행</span>
          </div>
          {result.errors.length > 0 && (
            <div className="rounded-xl bg-rose-signal/6 border border-rose-signal/20 p-3 max-h-40 overflow-y-auto space-y-1">
              {result.errors.slice(0, 30).map((e, i) => (
                <div key={i} className="text-[11px] text-rose-700">
                  <span className="font-mono">L{e.line}</span>
                  {e.column && <span className="font-mono"> [{e.column}]</span>} {e.message}
                </div>
              ))}
              {result.errors.length > 30 && <div className="text-[11px] text-rose-700">…외 {result.errors.length - 30}건</div>}
            </div>
          )}
          {result.rows.length > 0 && (
            <div className="rounded-xl border border-ink-950/8 overflow-x-auto">
              <table className="text-[11px] w-full min-w-[420px]">
                <thead className="bg-ink-950/4 text-ink-950/50">
                  <tr>
                    {['date', 'visitors', 'trx', 'revenue', 'units', 'acc', 'CVR', 'ATV', 'Attach'].map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.slice(0, 8).map((r, i) => (
                    <tr key={i} className="border-t border-ink-950/6 tabular-nums">
                      <td className="px-2 py-1.5">{r.outcome_date}</td>
                      <td className="px-2 py-1.5">{r.visitors}</td>
                      <td className="px-2 py-1.5">{r.transactions}</td>
                      <td className="px-2 py-1.5">{r.revenue?.toLocaleString()}</td>
                      <td className="px-2 py-1.5">{r.units}</td>
                      <td className="px-2 py-1.5">{r.accessory_units ?? '—'}</td>
                      <td className="px-2 py-1.5">{r.cvr === null ? '—' : `${(r.cvr * 100).toFixed(1)}%`}</td>
                      <td className="px-2 py-1.5">{r.atv === null ? '—' : Math.round(r.atv).toLocaleString()}</td>
                      <td className="px-2 py-1.5">{r.attach_rate === null ? '—' : `${(r.attach_rate * 100).toFixed(1)}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.rows.length > 8 && <div className="text-[10px] text-ink-950/35 px-2 py-1.5">…외 {result.rows.length - 8}행</div>}
            </div>
          )}
        </div>
      )}
      <PrimaryButton disabled={busy || !result || result.rows.length === 0} onClick={doImport}>
        {busy ? '가져오는 중…' : result && result.rows.length > 0 ? `${result.rows.length}행 가져오기${result.errors.length ? ' (오류 행 제외)' : ''}` : '가져오기'}
      </PrimaryButton>
    </div>
  )
}
