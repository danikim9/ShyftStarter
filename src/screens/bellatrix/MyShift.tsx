import { useEffect, useMemo, useState } from 'react'
import { CalendarPlus, ChevronRight, Sparkles, MoonStar, Check, CalendarRange, List, Share, Repeat, ArrowLeftRight, Lock } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../lib/bellatrixStore'
import { useAppState } from '../../lib/store'
import { prepForShift, reflectionForShift, nextShiftFor } from '../../lib/selectors'
import { fmtDateKo, fmtShortDate, fmtTimeHM, dateOf } from '../../lib/dates'
import type { Shift } from '../../types/bellatrix'
import type { Shift as LegacyShift } from '../../types'
import { Card, SectionLabel, Badge, PrimaryButton, SecondaryButton } from '../../components/ui'
import { EmptyState, ErrorState, LoadingState } from '../../components/bellatrix/shared'
import { MonthCalendar } from '../../components/MonthCalendar'
import { exportShifts } from '../../lib/shiftExport'

/** Adapter so the legacy month calendar can draw Bellatrix shifts. */
function toLegacy(s: Shift, storeName: string): LegacyShift {
  return {
    id: s.id,
    employeeId: s.user_id,
    date: dateOf(s.start_at),
    start: fmtTimeHM(s.start_at),
    end: fmtTimeHM(s.end_at),
    store: storeName,
    role: '',
    managerName: '',
    status: s.status === 'scheduled' ? 'upcoming' : s.status === 'cancelled' ? 'off' : s.status,
  }
}

function ShiftRow({ shift, hasPrep, hasReflection, isToday }: { shift: Shift; hasPrep: boolean; hasReflection: boolean; isToday: boolean }) {
  const { openSheet } = useBellatrix()
  const date = dateOf(shift.start_at)
  return (
    <button onClick={() => openSheet({ kind: 'shiftDetail', shiftId: shift.id })} className="w-full flex items-center gap-3 py-3 border-b border-ink-950/6 last:border-0 text-left">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink-950/90">
          {isToday ? '오늘' : fmtShortDate(date)}
          <span className="text-ink-950/45 font-normal ml-1.5 tabular-nums">
            {fmtTimeHM(shift.start_at)}–{fmtTimeHM(shift.end_at)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge tone={hasPrep ? 'brand' : 'default'}>
            <Sparkles size={10} /> {hasPrep ? '준비함' : '준비 전'}
          </Badge>
          {(shift.status === 'completed' || isToday) && (
            <Badge tone={hasReflection ? 'emerald' : 'default'}>
              <MoonStar size={10} /> {hasReflection ? '회고 완료' : '회고 전'}
            </Badge>
          )}
          {shift.source === 'roster' && <Badge>매장 근무표</Badge>}
        </div>
      </div>
      <ChevronRight size={16} className="text-ink-950/25 shrink-0" />
    </button>
  )
}

export function MyShift() {
  const ready = useReadyData()
  const { dataset, reload, openSheet, today, trackEvent, showToast } = useBellatrix()
  const legacy = useAppState()
  const [view, setView] = useState<'list' | 'calendar'>('list')

  useEffect(() => {
    if (ready) trackEvent('my_shift_viewed')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!ready])

  const model = useMemo(() => {
    if (!ready) return null
    const { data, user } = ready
    const mine = data.shifts.filter((s) => s.user_id === user.id && s.status !== 'cancelled')
    const nowIso = new Date().toISOString()
    const next = nextShiftFor(data, user.id, nowIso)
    const upcoming = mine.filter((s) => dateOf(s.start_at) >= today).sort((a, b) => a.start_at.localeCompare(b.start_at))
    const past = mine.filter((s) => dateOf(s.start_at) < today).sort((a, b) => b.start_at.localeCompare(a.start_at)).slice(0, 14)
    const flags = (s: Shift) => ({ hasPrep: !!prepForShift(data, user.id, s.id), hasReflection: !!reflectionForShift(data, s.id) })
    const prepped = past.filter((s) => flags(s).hasPrep).length
    const reflected = past.filter((s) => flags(s).hasReflection).length
    return { next, upcoming, past, mine, flags, prepped, reflected, inTeam: user.team_id !== null, storeName: data.store?.name ?? '근무' }
  }, [ready, today])

  if (dataset.status === 'error') return <ErrorState message={dataset.message} onRetry={dataset.retryable ? reload : undefined} />
  if (!model) return <LoadingState />
  const { next, upcoming, past, mine, flags, prepped, reflected, inTeam, storeName } = model

  const handleExport = async () => {
    const result = await exportShifts(upcoming, storeName)
    if (result === 'empty') showToast('내보낼 예정 근무가 없어요')
    else if (result === 'downloaded') showToast('캘린더 파일(.ics)을 내려받았어요')
    else if (result === 'unsupported') showToast('이 환경에서는 내보내기를 지원하지 않아요')
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-950 mb-1">My Shift</h1>
          <p className="text-xs text-ink-950/40">근무마다 준비와 회고를 연결해요. 근무표 앱이 아니에요.</p>
        </div>
        <button onClick={() => openSheet({ kind: 'shiftComposer' })} className="shrink-0 w-11 h-11 rounded-full bg-brand-500 text-white flex items-center justify-center active:scale-95 transition" aria-label="근무 등록">
          <CalendarPlus size={18} />
        </button>
      </div>

      {next ? (
        <button onClick={() => openSheet({ kind: 'shiftDetail', shiftId: next.id })} className="w-full text-left rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 p-5 shadow-lg shadow-brand-900/30 text-white active:scale-[0.99] transition">
          <div className="text-[11px] font-semibold text-white/75 tracking-wide">{dateOf(next.start_at) === today ? '오늘 근무' : '다음 근무'}</div>
          <div className="text-xl font-bold mt-1">{fmtDateKo(dateOf(next.start_at))}</div>
          <div className="text-white/85 text-sm mt-0.5 tabular-nums">
            {fmtTimeHM(next.start_at)} – {fmtTimeHM(next.end_at)}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {flags(next).hasPrep ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 text-xs px-2.5 py-1">
                <Check size={12} /> 준비 완료
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-white text-brand-700 text-xs font-bold px-2.5 py-1">
                <Sparkles size={12} /> Shift Prep 열기
              </span>
            )}
          </div>
        </button>
      ) : (
        <Card>
          <EmptyState icon={<CalendarPlus size={18} />} title="등록된 근무가 없어요" body="다음 근무를 등록하면 준비와 회고를 근무에 묶어 기록할 수 있어요." />
          <PrimaryButton onClick={() => openSheet({ kind: 'shiftComposer' })}>다음 근무 등록</PrimaryButton>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2">
        <SecondaryButton onClick={() => openSheet({ kind: 'shiftComposer' })} className="flex items-center justify-center gap-1.5 !py-2.5">
          <Repeat size={14} /> 반복 근무 편집
        </SecondaryButton>
        <SecondaryButton onClick={() => void handleExport()} className="flex items-center justify-center gap-1.5 !py-2.5">
          <Share size={14} /> 캘린더로 내보내기
        </SecondaryButton>
      </div>

      {inTeam ? (
        <button onClick={() => legacy.openSheet({ kind: 'teamSchedule' })} className="w-full text-left">
          <Card className="flex items-center gap-3 active:scale-[0.99] transition">
            <div className="w-9 h-9 rounded-xl bg-amber-signal/15 text-amber-600 flex items-center justify-center shrink-0">
              <ArrowLeftRight size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ink-950">팀 근무표 · 근무 교대</div>
              <div className="text-[11px] text-ink-950/45">팀원 근무 확인, 교대 요청 보내기 · 받은 요청 승인</div>
            </div>
            <ChevronRight size={16} className="text-ink-950/25 shrink-0" />
          </Card>
        </button>
      ) : (
        <p className="text-[11px] text-ink-950/35 inline-flex items-center gap-1">
          <Lock size={11} /> 팀에 참여하면 팀원과 근무 교대를 요청할 수 있어요.
        </p>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>{view === 'list' ? '예정된 근무' : '월별 보기'}</SectionLabel>
          <button onClick={() => setView((v) => (v === 'list' ? 'calendar' : 'list'))} className="text-xs text-brand-700 font-medium inline-flex items-center gap-1 -mt-2">
            {view === 'list' ? (
              <>
                <CalendarRange size={13} /> 월별로 보기
              </>
            ) : (
              <>
                <List size={13} /> 목록으로 보기
              </>
            )}
          </button>
        </div>
        {view === 'calendar' ? (
          <MonthCalendar shifts={mine.map((s) => toLegacy(s, storeName))} todayDate={today} onSelectShift={(id) => openSheet({ kind: 'shiftDetail', shiftId: id })} />
        ) : (
          <Card>
            {upcoming.length === 0 ? (
              <p className="text-xs text-ink-950/35 py-2">예정된 근무가 없어요.</p>
            ) : (
              upcoming.map((s) => <ShiftRow key={s.id} shift={s} {...flags(s)} isToday={dateOf(s.start_at) === today} />)
            )}
          </Card>
        )}
      </div>

      {view === 'list' && (
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>지난 근무</SectionLabel>
          {past.length > 0 && (
            <span className="text-[10px] text-ink-950/35 -mt-2 tabular-nums">
              준비 {prepped} · 회고 {reflected} / {past.length}
            </span>
          )}
        </div>
        <Card>
          {past.length === 0 ? <p className="text-xs text-ink-950/35 py-2">아직 지난 근무 기록이 없어요.</p> : past.map((s) => <ShiftRow key={s.id} shift={s} {...flags(s)} isToday={false} />)}
        </Card>
      </div>
      )}
    </div>
  )
}
