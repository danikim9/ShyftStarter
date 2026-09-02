import { team } from '../data/team'
import { Card, SectionLabel } from '../components/ui'
import { AttentionCard, RosterRow } from './components/MemberCard'
import { CULTURE_PRINCIPLES } from '../data/coachingContent'

export function TeamOverview() {
  const attention = team.filter((m) => m.needsAttention)
  const rest = team.filter((m) => !m.needsAttention)
  const todaysPrinciple = CULTURE_PRINCIPLES[new Date().getDate() % CULTURE_PRINCIPLES.length]

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">오늘 확인이 필요해요</h1>
        <p className="text-white/40 text-sm">
          Gangnam · {team.length}명 중 <span className="text-white/70 font-medium">{attention.length}명</span> 주목 필요
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {attention.map((m) => (
          <AttentionCard key={m.id} member={m} />
        ))}
      </div>

      <div>
        <SectionLabel>전체 팀</SectionLabel>
        <Card>
          {rest.map((m) => (
            <RosterRow key={m.id} member={m} />
          ))}
          {attention.map((m) => (
            <RosterRow key={`att-${m.id}`} member={m} />
          ))}
        </Card>
      </div>

      <Card className="bg-white/[0.03]">
        <SectionLabel>오늘의 문화 원칙</SectionLabel>
        <p className="text-sm text-white/60 leading-relaxed">{todaysPrinciple}</p>
      </Card>
    </div>
  )
}
