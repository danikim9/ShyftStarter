import { useEffect } from 'react'
import { Users, ChevronRight, Lock, Sparkles } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../lib/bellatrixStore'
import { useAppState } from '../../lib/store'
import { assignmentsFor, viewAssignments } from '../../lib/selectors'
import { TeamFeed } from '../TeamFeed'
import { Card, PrimaryButton } from '../../components/ui'
import { EmptyState, LoadingState } from '../../components/bellatrix/shared'
import type { TabId } from '../../components/BottomNav'

/** Team tab = announcements + handover + team missions + shared tips.
 * Not a chat. Joining is optional; without a team the page explains what it
 * unlocks and offers the invite-code sheet. */
export function Team({ onNavigate, embedded = false }: { onNavigate: (t: TabId) => void; embedded?: boolean }) {
  const ready = useReadyData()
  const { openSheet, today } = useBellatrix()
  const legacy = useAppState()
  const inTeam = ready?.user.team_id !== null && ready?.user.team_id !== undefined

  // Keep the legacy feed's membership in step with the Bellatrix team membership.
  useEffect(() => {
    if (inTeam && legacy.membership !== 'store') legacy.joinTeam(legacy.storeCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inTeam, legacy.membership])

  if (!ready) return <LoadingState />
  const { user, data } = ready

  if (!inTeam) {
    return (
      <div className={`px-4 ${embedded ? 'pt-2' : 'pt-5'} pb-8 space-y-4`}>
        {!embedded && (
          <div>
            <h1 className="text-xl font-bold text-ink-950 mb-1">Team</h1>
            <p className="text-xs text-ink-950/40">공지 · 인수인계 · 팀 미션 · 응대 팁. 자유 채팅방은 아니에요.</p>
          </div>
        )}
        <Card className="space-y-4 py-6">
          <EmptyState icon={<Users size={18} />} title="팀 없이도 잘 쓰고 있어요" body="매니저나 동료에게 초대 코드를 받으면 팀 공지, 인수인계, 팀 미션을 여기서 받을 수 있어요." />
          <PrimaryButton onClick={() => openSheet({ kind: 'joinTeam' })}>초대 코드로 참여</PrimaryButton>
          <div className="flex items-start gap-1.5 text-[11px] text-ink-950/45 justify-center">
            <Lock size={12} className="shrink-0 mt-0.5" /> 참여해도 내 목표 · 회고 · 성장 기록은 나만 볼 수 있어요.
          </div>
        </Card>
      </div>
    )
  }

  const missions = viewAssignments(data, assignmentsFor(data, user.id, today))
  const done = missions.filter((m) => m.isDone).length

  return (
    <div>
      {missions.length > 0 && (
        <div className="px-4 pt-5">
          <button onClick={() => onNavigate('actions')} className="w-full text-left">
            <Card className="flex items-center gap-3 border-brand-200 bg-brand-50 active:scale-[0.99] transition">
              <div className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-700 flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink-950">오늘 팀 미션 {missions.length}개</div>
                <div className="text-[11px] text-ink-950/50">
                  {done}개 완료 · {data.team?.name ?? '우리 팀'}
                </div>
              </div>
              <ChevronRight size={16} className="text-brand-600 shrink-0" />
            </Card>
          </button>
        </div>
      )}
      <TeamFeed embedded={embedded} />
    </div>
  )
}
