import { Flame, ChevronRight, ScrollText, ListChecks, GraduationCap } from 'lucide-react'
import { useAppState } from '../lib/store'
import { todayShift, todayMission } from '../data/mockData'
import { SKILLS, WHEEL_SKILL_ORDER } from '../data/skills'
import { generateAiNudge, getNextBestAction } from '../lib/aiEngine'
import { Card, SectionLabel, Badge, ProgressBar, PrimaryButton, SecondaryButton } from '../components/ui'
import { StatBar } from '../components/StatBar'
import { MOOD_EMOJI } from '../components/MoodCheckIn'
import type { TabId } from '../components/BottomNav'

const dow = ['일', '월', '화', '수', '목', '금', '토']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일 (${dow[dt.getDay()]})`
}

export function Home({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { employee, quests, openSheet, todayMood } = useAppState()
  const nudge = generateAiNudge(employee.skills)
  const nba = getNextBestAction(employee, quests)
  const focusMeta = SKILLS[todayMission.focusSkillId]

  const activeQuests = quests.filter((q) => q.status === 'active').slice(0, 3)
  const completedToday = quests.filter((q) => q.status === 'completed')
  const snapshotSkills = employee.skills.filter((s) => WHEEL_SKILL_ORDER.includes(s.skillId)).slice(0, 4)

  return (
    <div className="px-4 pt-5 pb-8 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-white/40 text-xs mb-0.5">{fmtDate(todayShift.date)} · {todayShift.start}–{todayShift.end} · {todayShift.store}</div>
          <h1 className="text-xl font-bold text-white">Good morning, {employee.name}님</h1>
        </div>
        {todayMood && (
          <div className="shrink-0 flex items-center gap-1 rounded-full bg-white/6 px-2.5 py-1.5 mt-0.5" title="오늘 컨디션 체크인">
            <span className="text-base leading-none">{MOOD_EMOJI[todayMood]}</span>
          </div>
        )}
      </div>

      {/* Today's Mission */}
      <button
        onClick={() => openSheet({ kind: 'shiftDetail', shiftId: todayShift.id })}
        className="w-full text-left rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 p-5 shadow-lg shadow-brand-900/40 active:scale-[0.99] transition"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-white/70 tracking-wide">TODAY'S MISSION</span>
          <ChevronRight size={16} className="text-white/50" />
        </div>
        <div className="text-white text-xl font-bold mt-1">{focusMeta.nameKo} 개선하기</div>
        <div className="text-white/70 text-sm mt-1">{todayMission.title}</div>
      </button>

      {/* Quests summary */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>QUESTS</SectionLabel>
          <button onClick={() => onNavigate('quests')} className="text-xs text-brand-300 font-medium flex items-center gap-0.5">
            전체 보기 <ChevronRight size={13} />
          </button>
        </div>
        <Card className="space-y-3">
          {activeQuests.map((q) => (
            <button
              key={q.id}
              onClick={() => openSheet({ kind: 'questDetail', questId: q.id })}
              className="w-full text-left"
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/80">{q.title}</span>
                <span className="text-white/40 tabular-nums text-xs">{q.progress}/{q.target}</span>
              </div>
              <ProgressBar value={q.progress} max={q.target} />
            </button>
          ))}
          {completedToday.length > 0 && (
            <div className="pt-2 border-t border-white/8 flex items-center gap-2 text-xs text-emerald-300">
              <Flame size={13} /> {completedToday[0].title} 완료 · +{completedToday[0].rewardXp} XP
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2">
        <SecondaryButton onClick={() => openSheet({ kind: 'killerScript', skillId: todayMission.focusSkillId })} className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px]">
          <ScrollText size={16} /> 킬러 스크립트
        </SecondaryButton>
        <SecondaryButton onClick={() => openSheet({ kind: 'checklist' })} className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px]">
          <ListChecks size={16} /> 체크리스트
        </SecondaryButton>
        <SecondaryButton onClick={() => openSheet({ kind: 'learn' })} className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px]">
          <GraduationCap size={16} /> 3분 학습
        </SecondaryButton>
      </div>

      {/* Today's stats snapshot */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>TODAY'S STATS</SectionLabel>
          <button onClick={() => onNavigate('stats')} className="text-xs text-brand-300 font-medium flex items-center gap-0.5">
            전체 보기 <ChevronRight size={13} />
          </button>
        </div>
        <Card className="space-y-3.5">
          {snapshotSkills.map((s) => (
            <StatBar key={s.skillId} skill={s} selected={s.skillId === todayMission.focusSkillId} />
          ))}
        </Card>
      </div>

      {/* AI Nudge */}
      <Card className="bg-amber-signal/8 border-amber-signal/25">
        <div className="flex items-start gap-2.5">
          <span className="text-lg leading-none mt-0.5">💡</span>
          <div>
            <div className="text-[11px] font-semibold text-amber-300/90 tracking-wide mb-1">AI NUDGE</div>
            <p className="text-sm text-amber-50/90 leading-relaxed">{nudge.message}</p>
          </div>
        </div>
      </Card>

      <PrimaryButton onClick={() => openSheet({ kind: 'shiftDetail', shiftId: todayShift.id })}>
        {todayShift.status === 'in_progress' ? 'VIEW MY SHIFT' : 'START MY SHIFT'}
      </PrimaryButton>

      <div className="text-center">
        <Badge tone="default">Next Best Action · {nba.label}</Badge>
      </div>
    </div>
  )
}
