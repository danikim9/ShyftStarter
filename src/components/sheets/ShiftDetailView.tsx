import { shifts } from '../../data/mockData'
import { PrimaryButton, SecondaryButton, Badge } from '../ui'
import { useAppState } from '../../lib/store'

const dow = ['일', '월', '화', '수', '목', '금', '토']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getMonth() + 1}.${dt.getDate()} (${dow[dt.getDay()]})`
}

export function ShiftDetailView({ shiftId, onViewQuests }: { shiftId: string; onViewQuests: () => void }) {
  const { openSheet, handovers } = useAppState()
  const shift = shifts.find((s) => s.id === shiftId)
  if (!shift) return null

  const isToday = shift.status === 'in_progress'
  const relevantHandovers = handovers.slice(0, 3)

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
          <div className="grid grid-cols-2 gap-2">
            <PrimaryButton onClick={onViewQuests}>오늘 할 일 보기</PrimaryButton>
            <SecondaryButton onClick={() => openSheet({ kind: 'handoverCompose' })}>인수인계 남기기</SecondaryButton>
          </div>
          <div className="space-y-1 pt-2">
            <div className="text-[11px] font-semibold text-white/40 tracking-wide">최근 인수인계</div>
            <div className="space-y-2 pt-1">
              {relevantHandovers.map((h) => (
                <p key={h.id} className="text-xs text-white/60 leading-relaxed">
                  <span className="text-white/85 font-medium">{h.fromEmployeeName}</span> · {h.message}
                </p>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-white/50 leading-relaxed pt-2">
          {shift.status === 'completed'
            ? '이 시프트는 완료되었어요.'
            : '이 시프트가 시작되면 인수인계와 오늘 할 일을 여기서 확인할 수 있어요.'}
        </p>
      )}
    </div>
  )
}
