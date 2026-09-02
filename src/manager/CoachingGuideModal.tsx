import { X, MessageCircle } from 'lucide-react'
import { getTeamMember } from '../data/team'
import { generateCoachingGuide } from '../lib/managerAiEngine'
import { useManagerState } from '../lib/managerStore'
import { useAppState } from '../lib/store'
import { PrimaryButton } from '../components/ui'

export function CoachingGuideModal() {
  const { coachingGuideMemberId, closeCoachingGuide } = useManagerState()
  const { showToast } = useAppState()
  const open = !!coachingGuideMemberId
  const member = coachingGuideMemberId ? getTeamMember(coachingGuideMemberId) : null
  const steps = member ? generateCoachingGuide(member) : []

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={closeCoachingGuide} />
      <div
        className={`relative w-full max-w-lg max-h-[85vh] rounded-2xl bg-ink-900 border border-ink-950/10 shadow-2xl flex flex-col transition-all duration-300 ${
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {member && (
          <>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-ink-950/8 shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle size={16} className="text-brand-600" />
                <h3 className="text-sm font-semibold text-ink-950">1:1 코칭 대화 가이드 — {member.name}</h3>
              </div>
              <button onClick={closeCoachingGuide} className="w-8 h-8 flex items-center justify-center rounded-full bg-ink-950/8 text-ink-950/60">
                <X size={15} />
              </button>
            </div>

            <div className="overflow-y-auto app-scroll px-6 py-5 grow space-y-3">
              <p className="text-xs text-ink-950/40 leading-relaxed mb-2">
                평가가 아닌 대화를 위한 가이드예요. 행동 데이터를 근거로, 판단 없이 대화를 이끌어보세요.
              </p>
              {steps.map((s, i) => (
                <div key={i} className="rounded-xl bg-ink-950/5 border border-ink-950/10 p-3.5">
                  <div className="text-[11px] font-semibold text-brand-600 mb-1">{s.step}</div>
                  <p className="text-sm text-ink-950/80 leading-relaxed">{s.prompt}</p>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-ink-950/8 shrink-0">
              <PrimaryButton
                onClick={() => {
                  showToast(`${member.name}님과의 1:1 코칭이 기록됐어요`)
                  closeCoachingGuide()
                }}
              >
                코칭 완료로 기록하기
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
