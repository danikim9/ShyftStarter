import { shifts, todayMission } from '../../data/mockData'
import { SKILLS } from '../../data/skills'
import { PrimaryButton, SecondaryButton, Badge } from '../ui'
import { useAppState } from '../../lib/store'

const dow = ['일', '월', '화', '수', '목', '금', '토']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getMonth() + 1}.${dt.getDate()} (${dow[dt.getDay()]})`
}

export function ShiftDetailView({ shiftId, onViewQuests }: { shiftId: string; onViewQuests: () => void }) {
  const { openSheet } = useAppState()
  const shift = shifts.find((s) => s.id === shiftId)
  if (!shift) return null

  const isToday = shift.status === 'in_progress'
  const focusMeta = SKILLS[todayMission.focusSkillId]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-semibold">{fmtDate(shift.date)}</div>
          <div className="text-xs text-white/45">
            {shift.start}–{shift.end} · {shift.store} · {shift.role}
          </div>
        </div>
        <Badge tone={isToday ? 'brand' : shift.status === 'completed' ? 'default' : 'amber'}>
          {shift.status === 'completed' ? '완료' : isToday ? '진행 중' : '예정'}
        </Badge>
      </div>

      {isToday ? (
        <>
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4">
            <div className="text-[11px] font-semibold text-white/60 tracking-wide mb-1">TODAY'S FOCUS</div>
            <div className="text-white text-lg font-bold">{focusMeta.nameKo}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-white/40 tracking-wide">WHY?</div>
            <p className="text-sm text-white/70 leading-relaxed">{todayMission.why}</p>
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-white/40 tracking-wide">TARGET</div>
            <p className="text-sm text-white/70 leading-relaxed">{todayMission.target}</p>
          </div>
          <div className="rounded-xl bg-amber-signal/10 border border-amber-signal/20 px-3.5 py-2.5">
            <div className="text-[11px] font-semibold text-amber-300/80 mb-0.5">BUSINESS PRIORITY</div>
            <p className="text-xs text-amber-100/80">{todayMission.businessPriority}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PrimaryButton onClick={onViewQuests}>VIEW QUESTS</PrimaryButton>
            <SecondaryButton onClick={() => openSheet({ kind: 'checklist' })}>CHECKLIST</SecondaryButton>
          </div>
        </>
      ) : (
        <p className="text-sm text-white/50 leading-relaxed pt-2">
          {shift.status === 'completed'
            ? '이 시프트는 완료되었어요. 행동 데이터가 성과 프로필에 반영되었습니다.'
            : '이 시프트가 시작되면 AI가 오늘의 미션을 자동으로 생성해드려요.'}
        </p>
      )}
    </div>
  )
}
