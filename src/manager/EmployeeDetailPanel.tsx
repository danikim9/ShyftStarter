import { X } from 'lucide-react'
import { getTeamMember } from '../data/team'
import { computeQuadrant, lowestSkill, strongestSkill } from '../lib/managerAiEngine'
import { SKILLS, ALL_SKILL_ORDER } from '../data/skills'
import { Card, SectionLabel, ProgressBar } from '../components/ui'
import { StatBar } from '../components/StatBar'
import { BalanceWheel } from '../components/BalanceWheel'
import { QuadrantBadge } from './components/QuadrantBadge'
import { useManagerState } from '../lib/managerStore'
import { useAppState } from '../lib/store'
import { MOOD_EMOJI } from '../components/MoodCheckIn'

export function EmployeeDetailPanel() {
  const { detailMemberId, closeDetail, openQuestModal, openCoachingGuide } = useManagerState()
  const { showToast } = useAppState()
  const open = !!detailMemberId
  const member = detailMemberId ? getTeamMember(detailMemberId) : null

  const quadrant = member ? computeQuadrant(member.willScore, member.capabilityScore) : 'grower'
  const orderedSkills = member ? ALL_SKILL_ORDER.map((id) => member.skills.find((s) => s.skillId === id)!) : []

  return (
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeDetail}
      />
      <div
        className={`absolute right-0 top-0 bottom-0 w-full max-w-lg bg-ink-900 border-l border-ink-950/10 shadow-2xl transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {member && (
          <>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-ink-950/8 shrink-0">
              <div className="flex items-center gap-3">
                <span
                  className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
                  style={{ background: member.avatarColor }}
                >
                  {member.name[0]}
                </span>
                <div>
                  <div className="text-ink-950 font-semibold">{member.name}</div>
                  <div className="text-xs text-ink-950/40">{member.role} · {member.store} · {member.tenure}</div>
                </div>
              </div>
              <button onClick={closeDetail} className="w-8 h-8 flex items-center justify-center rounded-full bg-ink-950/8 text-ink-950/60">
                <X size={15} />
              </button>
            </div>

            <div className="overflow-y-auto app-scroll px-5 py-4 grow space-y-5">
              <QuadrantBadge quadrant={quadrant} />

              {/* Capability */}
              <div>
                <SectionLabel>CAPABILITY</SectionLabel>
                <Card className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-ink-950 tabular-nums">{member.capabilityScore}</span>
                    <div className="text-right text-xs text-ink-950/45">
                      <div>강점 · {SKILLS[strongestSkill(member).skillId].nameKo} {strongestSkill(member).score}</div>
                      <div className="text-rose-600">약점 · {SKILLS[lowestSkill(member).skillId].nameKo} {lowestSkill(member).score}</div>
                    </div>
                  </div>
                  <BalanceWheel skills={member.skills} />
                  <div className="space-y-3 pt-1 border-t border-ink-950/8">
                    {orderedSkills.map((s) => (
                      <StatBar key={s.skillId} skill={s} />
                    ))}
                  </div>
                </Card>
              </div>

              {/* Activity */}
              <div>
                <SectionLabel>ACTIVITY</SectionLabel>
                <Card className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-ink-950/50 mb-1">
                      <span>Quest Completion</span>
                      <span className="tabular-nums">{member.activity.questCompletionRate}%</span>
                    </div>
                    <ProgressBar value={member.activity.questCompletionRate} max={100} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div>
                      <div className="text-ink-950 font-bold text-sm">{member.activity.coachingHistoryCount}건</div>
                      <div className="text-[10px] text-ink-950/35 mt-0.5">Coaching History</div>
                    </div>
                    <div>
                      <div className="text-ink-950 font-bold text-sm">{member.activity.learningCompletedCount}</div>
                      <div className="text-[10px] text-ink-950/35 mt-0.5">Learning</div>
                    </div>
                    <div>
                      <div className="text-ink-950 font-bold text-sm">{member.kpi.cvr}%</div>
                      <div className="text-[10px] text-ink-950/35 mt-0.5">CVR</div>
                    </div>
                  </div>
                  <div className="text-center text-xs text-ink-950/40 pt-1 border-t border-ink-950/8">
                    AOV ₩{member.kpi.aov.toLocaleString()}
                  </div>
                </Card>
              </div>

              {/* Will score basis */}
              <div>
                <SectionLabel>WILL(참여도) 근거</SectionLabel>
                <Card className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink-950/50">최근 5시프트 컨디션 체크인</span>
                    <span className="text-xs text-ink-950/40 tabular-nums">
                      평균 {(member.moodHistory.reduce((a, b) => a + b, 0) / member.moodHistory.length).toFixed(1)}/5
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {member.moodHistory.map((v, i) => (
                      <span key={i} className="text-xl leading-none" title={`Shift ${i + 1}: ${v}/5`}>
                        {MOOD_EMOJI[v]}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-ink-950/45 leading-relaxed pt-1 border-t border-ink-950/8">{member.willBasis}</p>
                </Card>
              </div>

              {/* AI Summary */}
              <div>
                <SectionLabel>AI SUMMARY</SectionLabel>
                <Card className="space-y-3 bg-brand-600/10 border-brand-400/20">
                  <div>
                    <div className="text-[11px] font-semibold text-brand-700 mb-1">WHAT MATTERS</div>
                    <p className="text-sm text-ink-950/80 leading-relaxed">{member.aiSummary.whatMatters}</p>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-brand-700 mb-1">WHY</div>
                    <p className="text-sm text-ink-950/80 leading-relaxed">{member.aiSummary.why}</p>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-brand-700 mb-1">WHAT TO DO</div>
                    <p className="text-sm text-ink-950/80 leading-relaxed">{member.aiSummary.whatToDo}</p>
                  </div>
                </Card>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-ink-950/8 shrink-0 grid grid-cols-3 gap-2">
              <button
                onClick={() => openQuestModal(member.id)}
                className="rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 text-xs active:scale-[0.98] transition"
              >
                ASSIGN QUEST
              </button>
              <button
                onClick={() => showToast(`${member.name}님에게 학습 콘텐츠를 배정했어요`)}
                className="rounded-xl bg-ink-950/8 hover:bg-ink-950/12 text-ink-950 font-medium py-2.5 text-xs transition"
              >
                ASSIGN LEARNING
              </button>
              <button
                onClick={() => openCoachingGuide(member.id)}
                className="rounded-xl bg-ink-950/8 hover:bg-ink-950/12 text-ink-950 font-medium py-2.5 text-xs transition"
              >
                SEND NUDGE / COACH
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
