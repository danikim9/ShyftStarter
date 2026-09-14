import { useState } from 'react'
import { useBellatrix, useManagerData } from '../../lib/bellatrixStore'
import type { ISODate } from '../../types/bellatrix'
import { dateOf, fmtDateKo, fmtTimeHM } from '../../lib/dates'
import { PrimaryButton, SecondaryButton, Toggle } from '../../components/ui'
import { ChoiceChips, Question, inputClass } from '../../components/bellatrix/shared'

const PRESETS = [
  { id: 'open', label: '오픈 10–18', start: '10:00', end: '18:00' },
  { id: 'mid', label: '미들 12–20', start: '12:00', end: '20:00' },
  { id: 'close', label: '마감 13–21', start: '13:00', end: '21:00' },
] as const

function parseHM(v: string): [number, number] | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim())
  if (!m) return null
  const h = Number(m[1])
  const mi = Number(m[2])
  return h > 23 || mi > 59 ? null : [h, mi]
}

export function RosterCellSheet({ userId, date }: { userId: string; date: ISODate }) {
  const ready = useManagerData()
  const { setRosterShift, closeSheet } = useBellatrix()
  const existing = ready?.data.shifts.find((s) => s.user_id === userId && dateOf(s.start_at) === date && s.status !== 'cancelled') ?? null
  const user = ready?.data.users.find((u) => u.id === userId)
  const [start, setStart] = useState(existing ? fmtTimeHM(existing.start_at) : '13:00')
  const [end, setEnd] = useState(existing ? fmtTimeHM(existing.end_at) : '21:00')
  const [nextWeek, setNextWeek] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!ready || !user) return null

  const save = async (off: boolean) => {
    setBusy(true)
    setError(null)
    try {
      if (off) await setRosterShift({ userId, date, entry: 'off', alsoNextWeek: nextWeek })
      else {
        const s = parseHM(start)
        const e = parseHM(end)
        if (!s || !e) return setError('시간은 HH:MM 형식으로 입력해주세요.')
        if (e[0] * 60 + e[1] <= s[0] * 60 + s[1]) return setError('종료 시각이 시작 시각보다 늦어야 해요.')
        await setRosterShift({ userId, date, entry: { startHour: s[0], startMinute: s[1], endHour: e[0], endMinute: e[1] }, alsoNextWeek: nextWeek })
      }
      closeSheet()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-base font-bold text-ink-950">{user.name}</div>
        <div className="text-sm text-ink-950/50">
          {fmtDateKo(date)}
          {existing ? ` · 현재 ${fmtTimeHM(existing.start_at)}–${fmtTimeHM(existing.end_at)}${existing.source === 'self' ? ' (직원 직접 등록)' : ''}` : ' · 현재 휴무'}
        </div>
      </div>
      <Question text="근무 시간">
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
          columns={3}
        />
        <div className="grid grid-cols-2 gap-2">
          <input inputMode="numeric" value={start} onChange={(e) => setStart(e.target.value)} placeholder="13:00" className={inputClass} aria-label="시작 시각" />
          <input inputMode="numeric" value={end} onChange={(e) => setEnd(e.target.value)} placeholder="21:00" className={inputClass} aria-label="종료 시각" />
        </div>
      </Question>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-ink-950/85">다음 주 같은 요일에도</div>
          <div className="text-[11px] text-ink-950/40">반복 근무를 빠르게 깔 때</div>
        </div>
        <Toggle checked={nextWeek} onChange={() => setNextWeek((v) => !v)} label="다음 주에도 적용" />
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <PrimaryButton disabled={busy} onClick={() => void save(false)}>
        {busy ? '저장 중…' : '근무 저장'}
      </PrimaryButton>
      <SecondaryButton disabled={busy} onClick={() => void save(true)}>
        휴무로 표시
      </SecondaryButton>
    </div>
  )
}
