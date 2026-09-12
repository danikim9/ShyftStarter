// One-way calendar export of the user's Bellatrix shifts as .ics. On iOS the
// Web Share API with a File opens the share sheet (Calendar / Files / Mail);
// elsewhere we fall back to a normal download.
import type { Shift } from '../types/bellatrix'

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function icsLocal(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
}
function esc(t: string) {
  return t.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function generateShiftICS(shifts: Shift[], storeName: string | null): string {
  const now = new Date()
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`
  const events = shifts.map((s) =>
    [
      'BEGIN:VEVENT',
      `UID:${s.id}@shyftstarter.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsLocal(s.start_at)}`,
      `DTEND:${icsLocal(s.end_at)}`,
      `SUMMARY:${esc(storeName ? `근무 · ${storeName}` : '근무')}`,
      `DESCRIPTION:${esc('ShyftStarter에서 내보낸 근무 일정')}`,
      ...(storeName ? [`LOCATION:${esc(storeName)}`] : []),
      'END:VEVENT',
    ].join('\r\n')
  )
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ShyftStarter//Shift Export//KO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...events, 'END:VCALENDAR'].join('\r\n')
}

export type ExportResult = 'shared' | 'downloaded' | 'unsupported' | 'empty'

export async function exportShifts(shifts: Shift[], storeName: string | null): Promise<ExportResult> {
  if (shifts.length === 0) return 'empty'
  const content = generateShiftICS(shifts, storeName)
  const filename = 'shyftstarter-shifts.ics'
  try {
    const file = new File([content], filename, { type: 'text/calendar' })
    const nav = typeof navigator !== 'undefined' ? navigator : null
    if (nav && typeof nav.share === 'function' && (!nav.canShare || nav.canShare({ files: [file] }))) {
      await nav.share({ files: [file], title: '근무 일정' })
      return 'shared'
    }
  } catch (e) {
    // user cancelled the share sheet → not an error
    if (e instanceof Error && e.name === 'AbortError') return 'shared'
  }
  try {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return 'downloaded'
  } catch {
    return 'unsupported'
  }
}
