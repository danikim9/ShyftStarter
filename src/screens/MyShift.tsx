import { ChevronRight, MessageSquarePlus, ChevronDown, ChevronUp, CalendarPlus, CalendarDays, Lock, Wallet, CalendarRange, List } from 'lucide-react'
import { useState } from 'react'
import { useAppState } from '../lib/store'
import { shifts, todayShift } from '../data/mockData'
import { Card, SectionLabel, Badge, PrimaryButton, SecondaryButton } from '../components/ui'
import { MOOD_EMOJI } from '../components/MoodCheckIn'
import { MonthCalendar } from '../components/MonthCalendar'
import { downloadICS } from '../lib/calendarExport'
import { fmtWon, sumExtraPay, sumShiftPay } from '../lib/wageCalc'
import type { Shift } from '../types'
import type { TabId } from '../components/BottomNav'

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
  const isOff = shift.status === 'off'
  return (
    <div className={`w-full flex items-center justify-between py-3 border-b border-white/6 last:border-0 ${isOff ? 'opacity-60' : ''}`}>
      <div>
        <div className="text-sm font-medium text-white/90">{fmtShort(shift.date)}</div>
        <div className="text-xs text-white/40">{isOff ? '쉬는 날' : `${shift.start}–${shift.end} · ${shift.store}`}</div>
      </div>
      <Badge tone={isOff ? 'default' : isToday ? 'brand' : shift.status === 'completed' ? 'default' : 'amber'}>
        {isOff ? '휴무' : shift.status === 'completed' ? '완료' : isToday ? '진행 중' : '예정'}
      </Badge>
    </div>
  )
}

// 21차 — 솔로 UX 리뷰 피드백 #1(예상 급여 계산기). 매 근무 후 습관적으로
// 확인할 만한 위치(오늘 근무 카드 바로 아래)에 미리보기를 두고, 탭하면 상세
// 계산 시트(WageCalculatorView)로 들어간다. 시급을 아직 설정하지 않았으면
// 금액 대신 설정 유도 문구를 보여준다.
function WagePreviewCard() {
  const { wageSettings, extraPayEntries, openSheet } = useAppState()
  const confirmed = shifts.filter((s) => s.status === 'completed' || s.status === 'in_progress')
  const upcoming = shifts.filter((s) => s.status === 'upcoming')
  const total =
    sumShiftPay(confirmed, wageSettings.hourlyWage) +
    sumShiftPay(upcoming, wageSettings.hourlyWage) +
    sumExtraPay(extraPayEntries, wageSettings.hourlyWage, wageSettings.overtimeMultiplier)
  const noWage = wageSettings.hourlyWage <= 0

  return (
    <button onClick={() => openSheet({ kind: 'wageCalculator' })} className="w-full text-left">
      <Card className="flex items-center gap-3 active:scale-[0.99] transition">
        <div className="w-10 h-10 rounded-xl bg-emerald-signal/15 flex items-center justify-center shrink-0">
          <Wallet size={18} className="text-emerald-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-white/40">예상 급여 (세전)</div>
          {noWage ? (
            <div className="text-sm font-semibold text-white/70 mt-0.5">시급을 설정하고 확인해보세요</div>
          ) : (
            <div className="text-lg font-bold text-white mt-0.5 tabular-nums">{fmtWon(total)}</div>
          )}
        </div>
        <ChevronRight size={16} className="text-white/30 shrink-0" />
      </Card>
    </button>
  )
}

export function MyShift({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const { employee, todayMood, openSheet, handovers, membership, showToast } = useAppState()
  const [showAll, setShowAll] = useState(false)
  const [scheduleView, setScheduleView] = useState<'list' | 'calendar'>('list')

  const upcoming = shifts.filter((s) => s.status !== 'completed')
  const past = shifts.filter((s) => s.status === 'completed').slice().reverse()
  const recentHandovers = handovers.slice(0, showAll ? undefined : 2)
  const hasHandoverAccess = membership === 'store'

  const handleExport = () => {
    const ok = downloadICS('shyftstarter-근무일정.ics', upcoming.filter((s) => s.status !== 'off'))
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

      <WagePreviewCard />

      {/* Handover feed preview — 21차: membership이 'store'일 때만 열려요.
          예전엔 참여 여부와 무관하게 항상 열려 있어서, Team 탭에서는 "아직
          참여 안 함"이라 안내하면서 여기서는 동료 인수인계가 그대로 보이는
          모순이 있었어요 — 두 화면의 신호를 하나로 맞췄습니다. */}
      <div>
        <SectionLabel>최근 인수인계</SectionLabel>
        {hasHandoverAccess ? (
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
        ) : (
          <Card className="text-center py-6 space-y-2">
            <Lock size={16} className="text-white/25 mx-auto" />
            <p className="text-xs text-white/40 leading-relaxed">인수인계는 매장 팀에 참여하면 시작돼요</p>
            <button
              onClick={() => onNavigate('teamFeed')}
              className="text-xs text-brand-300 font-medium"
            >
              Team 탭에서 참여하기
            </button>
          </Card>
        )}
      </div>

      {hasHandoverAccess && (
        <SecondaryButton onClick={() => openSheet({ kind: 'handoverCompose' })} className="flex items-center justify-center gap-1.5">
          <MessageSquarePlus size={15} /> 인수인계 남기기
        </SecondaryButton>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>{scheduleView === 'list' ? '예정된 근무' : '근무 캘린더'}</SectionLabel>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScheduleView((v) => (v === 'list' ? 'calendar' : 'list'))}
              className="text-xs text-brand-300 font-medium flex items-center gap-0.5"
            >
              {scheduleView === 'list' ? (
                <>
                  <CalendarRange size={13} /> 캘린더로 보기
                </>
              ) : (
                <>
                  <List size={13} /> 목록으로 보기
                </>
              )}
            </button>
            <button
              onClick={() => openSheet({ kind: 'teamSchedule' })}
              className="text-xs text-brand-300 font-medium flex items-center gap-0.5"
            >
              <CalendarDays size={13} /> 근무 일정
            </button>
            <button onClick={handleExport} className="text-xs text-brand-300 font-medium flex items-center gap-0.5">
              <CalendarPlus size={13} /> 내보내기
            </button>
          </div>
        </div>
        {scheduleView === 'calendar' ? (
          <MonthCalendar
            shifts={shifts}
            todayDate={todayShift.date}
            onSelectShift={(shiftId) => openSheet({ kind: 'shiftDetail', shiftId })}
          />
        ) : (
          <Card>
            {upcoming.map((s) => (
              <ShiftRow key={s.id} shift={s} />
            ))}
          </Card>
        )}
      </div>

      {scheduleView === 'list' && (
        <div>
          <SectionLabel>지난 근무</SectionLabel>
          <Card>
            {past.map((s) => (
              <ShiftRow key={s.id} shift={s} />
            ))}
          </Card>
        </div>
      )}

      <PrimaryButton onClick={() => openSheet({ kind: 'shiftDetail', shiftId: todayShift.id })}>
        {todayShift.status === 'in_progress' ? '오늘 근무 상세 보기' : '다음 근무 준비하기'}
      </PrimaryButton>
    </div>
  )
}
