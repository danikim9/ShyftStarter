import { useMemo } from 'react'
import { Users, CalendarDays, Eye, ListPlus, ChevronRight, Lock, AlertCircle, Sun } from 'lucide-react'
import { useBellatrix, useManagerData } from '../../lib/bellatrixStore'
import { useManagerState } from '../../lib/managerStore'
import { buildTeamProfiles, COACHED_BEHAVIOURS, type TeamMemberProfile } from '../../lib/analytics/team'
import { BEHAVIOUR_LABEL } from '../../types/bellatrix'
import { Card, SectionLabel, Badge } from '../../components/ui'
import { EmptyState, ErrorState, LoadingState } from '../../components/bellatrix/shared'
import { DemoBadge } from '../../components/bellatrix/DemoBadge'
import { RosterGrid } from './RosterGrid'

const READING_CLS: Record<TeamMemberProfile['behaviours'][number]['reading'], string> = {
  strong: 'bg-emerald-signal/15 text-emerald-700 border-emerald-signal/30',
  gap: 'bg-amber-signal/15 text-amber-700 border-amber-signal/30',
  unknown: 'bg-ink-950/4 text-ink-950/40 border-ink-950/8',
}

function MemberCard({ p }: { p: TeamMemberProfile }) {
  const { openSheet } = useBellatrix()
  const first = p.user.name
  return (
    <Card className="space-y-3">
      <button onClick={() => openSheet({ kind: 'member', userId: p.user.id })} className="w-full text-left flex items-start gap-3">
        <span className="w-10 h-10 rounded-full bg-brand-500/15 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">{first[0]}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink-950">{first}</span>
            {p.workingToday && (
              <Badge tone="brand">
                <Sun size={10} /> 오늘 근무
              </Badge>
            )}
            {p.coachingFlags > 0 && (
              <Badge tone="amber">
                <AlertCircle size={10} /> 코칭 필요 {p.coachingFlags}
              </Badge>
            )}
          </div>
          <div className="text-xs text-ink-950/55 mt-1 leading-relaxed">{p.signals[0] ?? '특이 신호 없음'}</div>
        </div>
        <ChevronRight size={16} className="text-ink-950/25 shrink-0 mt-2" />
      </button>
      <div className="flex flex-wrap gap-1.5">
        {p.behaviours.map((b) => (
          <span key={b.behaviour} className={`text-[11px] px-2 py-1 rounded-full border ${READING_CLS[b.reading]}`} title={`관찰 ${b.observation.numerator}/${b.observation.denominator} · 팀 액션 ${b.completion.numerator}/${b.completion.denominator}`}>
            {BEHAVIOUR_LABEL[b.behaviour]}
            {b.reading === 'strong' ? ' ↑' : b.reading === 'gap' ? ' ·' : ''}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => openSheet({ kind: 'observe', presetUserId: p.user.id })} className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-700 inline-flex items-center gap-1">
          <Eye size={12} /> 관찰
        </button>
        <button onClick={() => openSheet({ kind: 'assign', presetUserId: p.user.id })} className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-ink-950/6 text-ink-950/70 inline-flex items-center gap-1">
          <ListPlus size={12} /> 배정
        </button>
        <button onClick={() => openSheet({ kind: 'member', userId: p.user.id })} className="ml-auto text-[11px] font-semibold text-brand-700">
          코칭 가이드
        </button>
      </div>
    </Card>
  )
}

export function TeamView() {
  const ready = useManagerData()
  const { dataset, reload, today } = useBellatrix()
  const { teamSegment, setTeamSegment } = useManagerState()
  const profiles = useMemo(() => (ready ? buildTeamProfiles(ready.data, today) : []), [ready, today])

  if (dataset.status === 'error') return <ErrorState message={dataset.message} onRetry={dataset.retryable ? reload : undefined} />
  if (!ready) return <LoadingState />

  const attention = profiles.filter((p) => p.priority >= 3)
  const rest = profiles.filter((p) => p.priority < 3)

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-ink-950 mb-1">팀</h1>
        <p className="text-sm text-ink-950/45">팀원의 행동 근거와 코칭 가이드, 그리고 근무표를 한곳에서.</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {ready.user.is_demo && <DemoBadge />}
          <Badge>
            <Lock size={10} /> 개인 목표·회고는 포함되지 않아요
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-full bg-ink-950/6 p-1 max-w-sm">
        <button onClick={() => setTeamSegment('members')} className={`flex-1 rounded-full py-2 text-xs font-semibold transition inline-flex items-center justify-center gap-1.5 ${teamSegment === 'members' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-950/50'}`}>
          <Users size={13} /> 팀원 {profiles.length}
        </button>
        <button onClick={() => setTeamSegment('roster')} className={`flex-1 rounded-full py-2 text-xs font-semibold transition inline-flex items-center justify-center gap-1.5 ${teamSegment === 'roster' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-950/50'}`}>
          <CalendarDays size={13} /> 근무표
        </button>
      </div>

      {teamSegment === 'roster' ? (
        <RosterGrid />
      ) : profiles.length === 0 ? (
        <Card>
          <EmptyState icon={<Users size={18} />} title="아직 팀원이 없어요" body="직원이 초대 코드로 참여하면 여기에 나타나요." />
        </Card>
      ) : (
        <>
          {attention.length > 0 && (
            <div>
              <SectionLabel>이번 주 먼저 볼 사람</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                {attention.map((p) => (
                  <MemberCard key={p.user.id} p={p} />
                ))}
              </div>
            </div>
          )}
          <div>
            <SectionLabel>{attention.length > 0 ? '나머지 팀원' : '팀원'}</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {rest.map((p) => (
                <MemberCard key={p.user.id} p={p} />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-ink-950/40">
            근거는 매니저 관찰과 팀 액션 실행 기록만 씁니다. 점수가 아니라 "꾸준히 보임 ↑ / 더 볼 것 ·" 두 가지로만 읽어요. {COACHED_BEHAVIOURS.length}개 행동 기준.
          </p>
        </>
      )}
    </div>
  )
}
