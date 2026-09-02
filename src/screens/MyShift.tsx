import { ChevronRight, MessageSquarePlus, ChevronDown, ChevronUp, CalendarPlus, CalendarDays, Lock, CalendarRange, List } from 'lucide-react'
import { useState } from 'react'
import { useAppState } from '../lib/store'
import { shifts, todayShift } from '../data/mockData'
import { Card, SectionLabel, Badge, PrimaryButton, SecondaryButton } from '../components/ui'
import { MOOD_EMOJI } from '../components/MoodCheckIn'
import { MonthCalendar } from '../components/MonthCalendar'
import { downloadICS } from '../lib/calendarExport'
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
    <div className={`w-full flex items-center justify-between py-3 border-b border-ink-950/6 last:border-0 ${isOff ? 'opacity-60' : ''}`}>
      <div>
        <div className="text-sm font-medium text-ink-950/90">{fmtShort(shift.date)}</div>
        <div className="text-xs text-ink-950/40">{isOff ? '쉬는 날' : `${shift.start}–${shift.end} · ${shift.store}`}</div>
      </div>
      <Badge tone={isOff ? 'default' : isToday ? 'brand' : shift.status === 'completed' ? 'default' : 'amber'}>
        {isOff ? '휴무' : shift.status === 'completed' ? '완료' : isToday ? '진행 중' : '예정'}
      </Badge>
    </div>
  )
}

export function MyShift({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const { employee, todayMood, openSheet, handovers, membership, showToast } = useAppState()
  const [showAll, setShowAll] = useState(false)
  const [scheduleView, setScheduleView] = useState<'list' | 'calendar'>('list')
  // 22차 — 솔로 UX 피드백 #5: "최근 인수인계" 배너 전체를 접었다 폈다 할 수
  // 있게. 기존 "전체 N건 보기"는 배너 안에서 목록을 더 보여줄지를 정하는
  // 토글이고, 이건 배너 자체(카드 내용 전부)를 접는 별도의 상위 토글이다.
  const [handoverBannerOpen, setHandoverBannerOpen] = useState(true)

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
          <div className="text-ink-950/40 text-xs mb-0.5">{fmtDate(todayShift.date)} · {todayShift.store}</div>
          <h1 className="text-xl font-bold text-ink-950">{employee.name}님, 안녕하세요</h1>
        </div>
        {todayMood && (
          <div className="shrink-0 flex items-center gap-1 rounded-full bg-ink-950/6 px-2.5 py-1.5 mt-0.5" title="오늘 컨디션 체크인">
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
          <span className="text-[11px] font-semibold text-white/80 tracking-wide">
            {todayShift.status === 'in_progress' ? 'TODAY — 진행 중' : 'TODAY'}
          </span>
          <ChevronRight size={16} className="text-white/70" />
        </div>
        <div className="text-white text-xl font-bold mt-1">{todayShift.start}–{todayShift.end}</div>
        <div className="text-white/80 text-sm mt-1">{todayShift.store} · {todayShift.role}</div>
      </button>

      {/* Handover feed preview — 21차: membership이 'store'일 때만 열려요.
          예전엔 참여 여부와 무관하게 항상 열려 있어서, Team 탭에서는 "아직
          참여 안 함"이라 안내하면서 여기서는 동료 인수인계가 그대로 보이는
          모순이 있었어요 — 두 화면의 신호를 하나로 맞췄습니다.
          22차 — 솔로 UX 피드백 #5: 배너 자체를 접었다 폈다 할 수 있게, 라벨
          옆에 상위 토글(chevron)을 추가했다. 닫혀 있어도 몇 건 있는지는
          바로 보이도록 라벨 옆에 카운트를 남긴다. */}
      <div>
        <button
          onClick={() => setHandoverBannerOpen((v) => !v)}
          className="w-full flex items-center justify-between mb-2"
        >
          <div className="flex items-center gap-1.5">
            <SectionLabel>최근 인수인계</SectionLabel>
            {hasHandoverAccess && handovers.length > 0 && (
              <span className="text-[10px] text-ink-950/30 -mt-2">{handovers.length}건</span>
            )}
          </div>
          {handoverBannerOpen ? (
            <ChevronUp size={14} className="text-ink-950/30" />
          ) : (
            <ChevronDown size={14} className="text-ink-950/30" />
          )}
        </button>
        {handoverBannerOpen &&
          (hasHandoverAccess ? (
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
                    <div className="text-xs text-ink-950/85 leading-relaxed">
                      <span className="font-semibold">{h.fromEmployeeName}</span> · {h.message}
                    </div>
                    <div className="text-[10px] text-ink-950/35 mt-0.5">{fmtTime(h.createdAt)}</div>
                  </div>
                </div>
              ))}
              {handovers.length > 2 && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="text-[11px] text-brand-600 font-medium flex items-center gap-0.5 pt-1"
                >
                  {showAll ? '접기' : `전체 ${handovers.length}건 보기`}
                  {showAll ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              )}
            </Card>
          ) : (
            <Card className="text-center py-6 space-y-2">
              <Lock size={16} className="text-ink-950/25 mx-auto" />
              <p className="text-xs text-ink-950/40 leading-relaxed">인수인계는 매장 팀에 참여하면 시작돼요</p>
              <button
                onClick={() => onNavigate('teamFeed')}
                className="text-xs text-brand-600 font-medium"
              >
                Team 탭에서 참여하기
              </button>
            </Card>
          ))}
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
              className="text-xs text-brand-600 font-medium flex items-center gap-0.5"
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
              className="text-xs text-brand-600 font-medium flex items-center gap-0.5"
            >
              <CalendarDays size={13} /> 근무 일정
            </button>
            <button onClick={handleExport} className="text-xs text-brand-600 font-medium flex items-center gap-0.5">
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
