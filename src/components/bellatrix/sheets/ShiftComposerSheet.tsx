import { useState } from 'react'
import { useBellatrix } from '../../../lib/bellatrixStore'
import type { ISODate } from '../../../types/bellatrix'
import { addDaysISO, fmtShortDate } from '../../../lib/dates'
import { PrimaryButton } from '../../ui'
import { ChoiceChips, Question, inputClass } from '../shared'

const PRESETS = [
  { id: 'open', label: '오픈 10:00–18:00', start: '10:00', end: '18:00' },
  { id: 'mid', label: '미들 12:00–20:00', start: '12:00', end: '20:00' },
  { id: 'close', label: '마감 13:00–21:00', start: '13:00', end: '21:00' },
] as const

function parseHM(v: string): [number, number] | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim())
  if (!m) return null
  const h = Number(m[1])
  const mi = Number(m[2])
  if (h > 23 || mi > 59) return null
  return [h, mi]
}

/** Register one shift: date + start/end. No roster, no auto-scheduling. */
export function ShiftComposerSheet({ presetDate, onDone }: { presetDate?: ISODate; onDone?: () => void }) {
  const { createShift, closeSheet, today } = useBellatrix()
  const [date, setDate] = useState<ISODate>(presetDate ?? today)
  const [start, setStart] = useState('13:00')
  const [end, setEnd] = useState('21:00')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dates: ISODate[] = Array.from({ length: 7 }, (_, i) => addDaysISO(today, i))

  const submit = async () => {
    const s = parseHM(start)
    const e = parseHM(end)
    if (!s || !e) return setError('시간은 HH:MM 형식으로 입력해주세요 (예: 13:00).')
    if (e[0] * 60 + e[1] <= s[0] * 60 + s[1]) return setError('종료 시각이 시작 시각보다 늦어야 해요.')
    setBusy(true)
    setError(null)
    try {
      await createShift({ date, startHour: s[0], startMinute: s[1], endHour: e[0], endMinute: e[1] })
      onDone?.()
      closeSheet()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Question n={1} text="날짜">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {dates.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDate(d)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-medium ${date === d ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-ink-950/10 text-ink-950/75'}`}
            >
              {d === today ? '오늘' : fmtShortDate(d)}
            </button>
          ))}
        </div>
        <label className="block text-[11px] text-ink-950/45">
          다른 날짜
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className={`${inputClass} mt-1`} />
        </label>
      </Question>
      <Question n={2} text="시간">
        <ChoiceChips
          options={PRESETS.map((p) => ({ value: p.id, label: p.label }))}
          value={PRESETS.find((p) => p.start === start && p.end === end)?.id ?? null}
          onChange={(id) => {
            const p = PRESETS.find((x) => x.id === id)
            if (p) {
              setStart(p.start)
              setEnd(p.end)
            }
          }}
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] text-ink-950/45">
            시작
            <input inputMode="numeric" value={start} onChange={(e) => setStart(e.target.value)} placeholder="13:00" className={`${inputClass} mt-1`} />
          </label>
          <label className="text-[11px] text-ink-950/45">
            종료
            <input inputMode="numeric" value={end} onChange={(e) => setEnd(e.target.value)} placeholder="21:00" className={`${inputClass} mt-1`} />
          </label>
        </div>
      </Question>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <PrimaryButton disabled={busy} onClick={submit}>
        {busy ? '저장 중…' : '근무 등록'}
      </PrimaryButton>
      <p className="text-[11px] text-ink-950/40">ShyftStarter는 근무표를 짜주는 앱이 아니에요. 준비와 회고를 근무에 연결하기 위해서만 날짜를 써요.</p>
    </div>
  )
}
