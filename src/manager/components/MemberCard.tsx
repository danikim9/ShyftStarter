import type { TeamMember } from '../../types'
import { QUADRANT_META } from '../../types'
import { computeQuadrant } from '../../lib/managerAiEngine'
import { QuadrantBadge } from './QuadrantBadge'
import { useManagerState } from '../../lib/managerStore'
import { useAppState } from '../../lib/store'

function actionsFor(quadrant: ReturnType<typeof computeQuadrant>) {
  switch (quadrant) {
    case 'star':
      return ['recognize', 'quest'] as const
    case 'grower':
      return ['quest', 'nudge'] as const
    case 'disengaged':
      return ['coach', 'nudge'] as const
    default:
      return ['quest', 'coach'] as const
  }
}

const ACTION_LABEL: Record<string, string> = {
  recognize: '인정하기',
  quest: '퀘스트 배정',
  nudge: '넛지 보내기',
  coach: '1:1 코칭 시작',
}

export function MemberActionButton({ member, action }: { member: TeamMember; action: string }) {
  const { openQuestModal, openCoachingGuide } = useManagerState()
  const { showToast } = useAppState()

  const handle = () => {
    if (action === 'quest') openQuestModal(member.id)
    else if (action === 'coach') openCoachingGuide(member.id)
    else if (action === 'nudge') showToast(`${member.name}님에게 넛지를 보냈어요`)
    else if (action === 'recognize') showToast(`${member.name}님에게 인정 메시지를 보냈어요 🎉`)
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        handle()
      }}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/14 text-white/85 transition"
    >
      {ACTION_LABEL[action]}
    </button>
  )
}

export function AttentionCard({ member }: { member: TeamMember }) {
  const quadrant = computeQuadrant(member.willScore, member.capabilityScore)
  const meta = QUADRANT_META[quadrant]
  const { openDetail } = useManagerState()

  return (
    <button
      onClick={() => openDetail(member.id)}
      className="w-full text-left rounded-2xl border p-4 transition hover:brightness-110"
      style={{ background: `${meta.color}0d`, borderColor: `${meta.color}33` }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: member.avatarColor }}
          >
            {member.name[0]}
          </span>
          <div>
            <div className="text-white font-semibold text-sm">{member.name}</div>
            <div className="text-white/40 text-xs">{member.role} · {member.tenure}</div>
          </div>
        </div>
        <QuadrantBadge quadrant={quadrant} />
      </div>
      <p className="text-sm text-white/70 leading-relaxed mb-3">{member.signal}</p>
      <div className="flex items-center gap-2">
        {actionsFor(quadrant).map((a) => (
          <MemberActionButton key={a} member={member} action={a} />
        ))}
      </div>
    </button>
  )
}

export function RosterRow({ member }: { member: TeamMember }) {
  const quadrant = computeQuadrant(member.willScore, member.capabilityScore)
  const { openDetail } = useManagerState()

  return (
    <button
      onClick={() => openDetail(member.id)}
      className="w-full flex items-center gap-3 py-3 border-b border-white/6 last:border-0 text-left"
    >
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ background: member.avatarColor }}
      >
        {member.name[0]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-white/90 font-medium">{member.name}</div>
        <div className="text-xs text-white/40">{member.role} · {member.tenure}</div>
      </div>
      <div className="hidden sm:block text-xs text-white/40 tabular-nums w-24 text-right">
        역량 {member.capabilityScore}
      </div>
      <div className="hidden sm:block text-xs text-white/40 tabular-nums w-24 text-right">
        참여 {member.willScore}
      </div>
      <QuadrantBadge quadrant={quadrant} />
    </button>
  )
}
