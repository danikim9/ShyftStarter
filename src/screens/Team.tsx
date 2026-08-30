import { useMemo, useState, type ReactNode } from 'react'
import { Trophy, Users, Sparkles, EyeOff } from 'lucide-react'
import { LEADERBOARD, TEAM_CHALLENGE, RECOGNITION_FEED } from '../data/teamFeedData'
import { generateChallengeInsight } from '../lib/aiEngine'
import { Card, SectionLabel, ProgressBar } from '../components/ui'
import type { RecognitionSource } from '../types'

const SOURCE_META: Record<RecognitionSource, { label: string; icon: ReactNode; tone: string }> = {
  manager: { label: '매니저', icon: <Users size={12} />, tone: 'text-brand-300' },
  peer: { label: '동료', icon: <Users size={12} />, tone: 'text-emerald-300' },
  ai: { label: 'AI', icon: <Sparkles size={12} />, tone: 'text-amber-300' },
}

function LeaderboardToggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/6 text-[11px] font-medium text-white/60"
    >
      <span className={`w-7 h-4 rounded-full relative transition ${enabled ? 'bg-brand-500' : 'bg-white/15'}`}>
        <span
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
            enabled ? 'left-3.5' : 'left-0.5'
          }`}
        />
      </span>
      리더보드 {enabled ? 'ON' : 'OFF'}
    </button>
  )
}

export function Team() {
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true)
  const challengeInsight = useMemo(
    () => generateChallengeInsight(TEAM_CHALLENGE.progress, TEAM_CHALLENGE.target),
    []
  )

  return (
    <div className="px-4 pt-5 pb-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white mb-1">Team</h1>
        <p className="text-xs text-white/40">강남점 동료들과 함께 성장해요 — 비교가 아니라 응원을 위한 공간이에요.</p>
      </div>

      {/* Team challenge */}
      <div>
        <SectionLabel>TEAM CHALLENGE</SectionLabel>
        <Card className="bg-brand-600/15 border-brand-400/25">
          <div className="text-sm font-semibold text-white mb-1">{TEAM_CHALLENGE.title}</div>
          <p className="text-xs text-white/60 leading-relaxed mb-3">{TEAM_CHALLENGE.description}</p>
          <div className="flex items-center justify-between text-xs text-white/50 mb-1.5">
            <span className="tabular-nums">
              {TEAM_CHALLENGE.progress} / {TEAM_CHALLENGE.target} {TEAM_CHALLENGE.unit}
            </span>
            <span>{TEAM_CHALLENGE.endsIn}</span>
          </div>
          <ProgressBar
            value={TEAM_CHALLENGE.progress}
            max={TEAM_CHALLENGE.target}
            colorClass="bg-gradient-to-r from-brand-400 to-emerald-signal"
          />
          <div className="mt-3 pt-3 border-t border-white/10 flex items-start gap-2">
            <span className="text-sm leading-none mt-0.5">🤖</span>
            <p className="text-xs text-white/70 leading-relaxed">{challengeInsight}</p>
          </div>
          <div className="mt-2 text-[10px] text-white/40">{TEAM_CHALLENGE.rewardNote}</div>
        </Card>
      </div>

      {/* Recognition feed */}
      <div>
        <SectionLabel>RECOGNITION</SectionLabel>
        <Card className="space-y-3">
          {RECOGNITION_FEED.map((r) => {
            const meta = SOURCE_META[r.fromRole]
            return (
              <div key={r.id} className="flex items-start gap-2.5">
                <span className={`mt-0.5 shrink-0 ${meta.tone}`}>{meta.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs text-white/85 leading-relaxed">
                    <span className="font-semibold">{r.employeeName}</span> · {r.message}
                  </div>
                  <div className="text-[10px] text-white/35 mt-0.5">
                    {meta.label} · {r.date}
                  </div>
                </div>
              </div>
            )
          })}
        </Card>
      </div>

      {/* Leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>LEADERBOARD</SectionLabel>
          <LeaderboardToggle enabled={leaderboardEnabled} onChange={setLeaderboardEnabled} />
        </div>
        {leaderboardEnabled ? (
          <Card className="space-y-1">
            {LEADERBOARD.map((entry, i) => (
              <div
                key={entry.employeeId}
                className={`flex items-center gap-3 py-2 px-2 rounded-xl ${
                  entry.isMe ? 'bg-brand-500/15' : ''
                }`}
              >
                <span
                  className={`w-6 text-center text-xs font-bold shrink-0 ${
                    i === 0 ? 'text-amber-300' : i === 1 ? 'text-white/70' : i === 2 ? 'text-orange-300' : 'text-white/30'
                  }`}
                >
                  {i === 0 ? <Trophy size={14} className="inline" /> : i + 1}
                </span>
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{ backgroundColor: entry.avatarColor }}
                >
                  {entry.name[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white font-medium truncate">
                    {entry.name} {entry.isMe && <span className="text-brand-300 text-[10px] font-semibold">나</span>}
                  </div>
                  <div className="text-[10px] text-white/35">{entry.role}</div>
                </div>
                <div className="text-sm font-bold text-white tabular-nums">{entry.score}</div>
              </div>
            ))}
            <p className="text-[10px] text-white/30 pt-2 mt-1 border-t border-white/8 leading-relaxed">
              역량 종합 점수 기준 순위예요. 참여도·컨디션 등 민감한 지표는 리더보드에 노출되지 않아요.
            </p>
          </Card>
        ) : (
          <Card className="flex items-center gap-3 text-white/40">
            <EyeOff size={18} />
            <p className="text-xs leading-relaxed">
              리더보드가 꺼져 있어요. 이 기능은 기업/매장 단위로 관리자가 켜고 끌 수 있어요 (기업별 On/Off).
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
