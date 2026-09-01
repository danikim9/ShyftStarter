import { ChevronRight, MessageSquarePlus, ChevronDown, ChevronUp, CalendarPlus } from 'lucide-react'
import { useState } from 'react'
import { useAppState } from '../lib/store'
import { shifts, todayShift } from '../data/mockData'
import { Card, SectionLabel, Badge, PrimaryButton, SecondaryButton } from '../components/ui'
import { MOOD_EMOJI } from '../components/MoodCheckIn'
import { downloadICS } from '../lib/calendarExport'
import type { Shift } from '../types'

const dow = ['일', '월', '화', '수', '목', '금', '토']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일 (${dow[dt.getDay()]})`
}
function fmtShort(d: string) {
  const dt = new Date(d)
  return `${dt.getMonth() + 1}.${dt.getDate()} (${dow[dt.getDay()]})`
}
function fmtTime(iso: string) {
  const dt = new Date(iso)
  return `${dt.getMonth() + 1}.${dt.getDate()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

function ShiftRow({ shift }: { shift: Shift }) {
  const isToday = shift.status === 'in_progress'
  return (
    <div className="w-full flex items-center justify-between py-3 border-b border-white/6 last:border-0">
      <div>
        <div className="text-sm font-medium text-white/90">{fmtShort(shift.date)}</div>
        <div className="text-xs text-white/40">{shift.start}–{shift.end} · {shift.store}</div>
      </div>
      <Badge tone={isToday ? 'brand' : shift.status === 'completed' ? 'default' : 'amber'}>
        {shift.status === 'completed' ? '완료' : isToday ? '진행 중' : '예정'}
      </Badge>
    </div>
  )
}

export function MyShift() {
  const { employee, todayMood, openSheet, handovers, showToast } = useAppState()
  const [showAll, setShowAll] = useState(false)

  const upcoming = shifts.filter((s) => s.status !== 'completed')
  const past = shifts.filter((s) => s.status === 'completed').slice().reverse()
  const recentHandovers = handovers.slice(0, showAll ? undefined : 2)

  const handleExport = () => {
    const ok = downloadICS('shyftstarter-근무일정.ics', upcoming)
    showToast(ok ? '캘린더 파일을 내려받았어요' : '내보내기에 실패했어요')
  }

  return (
    <div className="px-4 pt-5 pb-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-white/40 text-xs mb-0.5">{fmtDate(todayShift.date)} · {todayShift.store}</div>
          <h1 className="text-xl font-bold text-white">{employee.name}님, 안녕하세요</h1>
        </div>
        {todayMood && (
          <div className="shrink-0 flex items-center gap-1 rounded-full bg-white/6 px-2.5 py-1.5 mt-0.5" title="오늘 컨디션 체크인">
            <span className="text-base leading-none">{MOOD_EMOJI[todayMood]}</span>
          </div>
        )}
      </div>

      {/* Today's shift card */}
      <button
        onClick={() => openSheet({ kind: 'shiftDetail', shiftId: todayShift.id })}
        className="w-full text-left rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 p-5 shadow-lg shadow-brand-900/40 active:scale-[0.99] transition"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-white/70 tracking-wide">
            {todayShift.status === 'in_progress' ? 'TODAY — 진행 중' : 'TODAY'}
          </span>
          <ChevronRight size={16} className="text-white/50" />
        </div>
        <div className="text-white text-xl font-bold mt-1">{todayShift.start}–{todayShift.end}</div>
        <div className="text-white/70 text-sm mt-1">{todayShift.store} · {todayShift.role}</div>
      </button>

      <SecondaryButton onClick={() => openSheet({ kind: 'handoverCompose' })} className="flex items-center justify-center gap-1.5">
        <MessageSquarePlus size={15} /> 인수인계 남기기
      </SecondaryButton>

      {/* Handover feed preview */}
      <div>
        <SectionLabel>최근 인수인계</SectionLabel>
        <Card className="space-y-3">
          {recentHandovers.map((h) => (
            <div key={h.id} className="flex items-start gap-2.5">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ background: '#5b5ff2' }}
              >
                {h.fromEmployeeName[0]}
              </span>
              <div className="min-w-0">
                <div className="text-xs text-white/85 leading-relaxed">
                  <span className="font-semibold">{h.fromEmployeeName}</span> · {h.message}
                </div>
                <div className="text-[10px] text-white/35 mt-0.5">{fmtTime(h.createdAt)}</div>
              </div>
            </div>
          ))}
          {handovers.length > 2 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-[11px] text-brand-300 font-medium flex items-center gap-0.5 pt-1"
            >
              {showAll ? '접기' : `전체 ${handovers.length}건 보기`}
              {showAll ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>예정된 근무</SectionLabel>
          <button onClick={handleExport} className="text-xs text-brand-300 font-medium flex items-center gap-0.5">
            <CalendarPlus size={13} /> 내보내기
          </button>
        </div>
        <Card>
          {upcoming.map((s) => (
            <ShiftRow key={s.id} shift={s} />
          ))}
        </Card>
      </div>

      <div>
        <SectionLabel>지난 근무</SectionLabel>
        <Card>
          {past.map((s) => (
            <ShiftRow key={s.id} shift={s} />
          ))}
        </Card>
      </div>

      <PrimaryButton onClick={() => openSheet({ kind: 'shiftDetail', shiftId: todayShift.id })}>
        {todayShift.status === 'in_progress' ? '오늘 근무 상세 보기' : '다음 근무 준비하기'}
      </PrimaryButton>
    </div>
  )
}
