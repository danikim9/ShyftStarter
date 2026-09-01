// v2 — Shift Companion: calendar export
//
// Generates a standards-compliant .ics (iCalendar) file from the user's
// shifts. This is a genuine, working one-way "export" — any calendar app
// (Google, Apple, Outlook, Naver) can import the resulting file. It is NOT
// a live two-way sync: that would require OAuth + each provider's calendar
// API (Google Calendar API, etc.) plus a backend, which is out of scope for
// this frontend-only prototype. See claude/shyftstarter-v2-strategy-b2c-pivot.md.
//
// Note: when this app is viewed through the Claude Artifact preview iframe,
// the browser sandbox blocks page-initiated downloads (incl. blob: hrefs),
// so clicking "export" there may not visibly save a file. The same code
// works normally when the app is run locally (`npm run dev`) or deployed to
// real hosting — this is a preview-sandbox limitation, not a bug.

import type { Shift } from '../types'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toICSDateTime(dateStr: string, time: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`
}

function escapeICS(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function timestampNow() {
  const now = new Date()
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(
    now.getMinutes()
  )}${pad(now.getSeconds())}Z`
}

export function generateICS(shifts: Shift[]): string {
  const stamp = timestampNow()

  const events = shifts.map((s) => {
    const dtStart = toICSDateTime(s.date, s.start)
    const dtEnd = toICSDateTime(s.date, s.end)
    return [
      'BEGIN:VEVENT',
      `UID:${s.id}@shyftstarter.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeICS(`근무 · ${s.store}`)}`,
      `DESCRIPTION:${escapeICS(`${s.role} · ${s.managerName}`)}`,
      `LOCATION:${escapeICS(s.store)}`,
      'END:VEVENT',
    ].join('\r\n')
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ShyftStarter//Shift Export//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

/** Returns true if a browser download was actually attempted. */
export function downloadICS(filename: string, shifts: Shift[]): boolean {
  if (shifts.length === 0) return false
  try {
    const content = generateICS(shifts)
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return true
  } catch {
    return false
  }
}
