import { useState, type ReactNode } from 'react'
import { X, Sparkles } from 'lucide-react'
import { getTeamMember } from '../data/team'
import { suggestQuestDraft } from '../lib/managerAiEngine'
import type { ManagerQuestDraft } from '../types'
import { useManagerState } from '../lib/managerStore'
import { useAppState } from '../lib/store'
import { PrimaryButton, SecondaryButton } from '../components/ui'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-ink-950/40 tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  )
}

// 33차 — text-sm(15px)이 iOS 자동 확대 문턱(16px)보다 작아 입력창 탭 시
// 화면이 확대되는 원인이었을 가능성이 높아, 이 앱의 모든 input/textarea/
// select에 공통으로 text-[16px]를 적용했다(index.html 참고).
const inputClass =
  'w-full rounded-lg bg-ink-950/6 border border-ink-950/10 px-3 py-2.5 text-[16px] text-ink-950 placeholder:text-ink-950/25 outline-none focus:border-brand-400/50 transition'

function QuestForm({ memberId, onClose }: { memberId: string; onClose: () => void }) {
  const member = getTeamMember(memberId)
  const [draft, setDraft] = useState<ManagerQuestDraft>(() => suggestQuestDraft(member))
  const { showToast } = useAppState()

  const set = <K extends keyof ManagerQuestDraft>(key: K, value: ManagerQuestDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  return (
    <>
      <div className="overflow-y-auto app-scroll px-6 py-5 grow space-y-4">
        <div className="flex items-center gap-2 rounded-lg bg-brand-500/10 border border-brand-400/20 px-3 py-2 text-xs text-brand-700">
          <Sparkles size={13} className="shrink-0" />
          AI가 {member.name}님의 가장 낮은 역량({draft.kpiConnection})을 기준으로 초안을 자동 생성했어요. 자유롭게 수정하세요.
        </div>

        <Field label="NAME">
          <input className={inputClass} value={draft.name} onChange={(e) => set('name', e.target.value)} />
        </Field>

        <Field label="BEHAVIOR (행동 정의)">
          <textarea
            className={`${inputClass} resize-none`}
            rows={2}
            value={draft.behavior}
            onChange={(e) => set('behavior', e.target.value)}
          />
        </Field>

        <Field label="ASSIGN TO">
          <input className={inputClass} value={draft.assignTo} disabled />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="START">
            <input className={inputClass} value={draft.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </Field>
          <Field label="END">
            <input className={inputClass} value={draft.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="DIFFICULTY">
            <select
              className={inputClass}
              value={draft.difficulty}
              onChange={(e) => set('difficulty', Number(e.target.value) as 1 | 2 | 3)}
            >
              <option value={1}>Level 1</option>
              <option value={2}>Level 2</option>
              <option value={3}>Level 3</option>
            </select>
          </Field>
          <Field label="REWARD">
            <input
              type="number"
              className={inputClass}
              value={draft.rewardXp}
              onChange={(e) => set('rewardXp', Number(e.target.value))}
            />
          </Field>
        </div>

        <Field label="KPI CONNECTION">
          <input className={inputClass} value={draft.kpiConnection} onChange={(e) => set('kpiConnection', e.target.value)} />
        </Field>

        <button
          onClick={() => set('aiPersonalization', !draft.aiPersonalization)}
          className="w-full flex items-center justify-between rounded-lg bg-ink-950/6 border border-ink-950/10 px-3 py-2.5"
        >
          <span className="text-sm text-ink-950/80">AI Personalization</span>
          <span
            className={`w-9 h-5 rounded-full relative transition-colors ${draft.aiPersonalization ? 'bg-brand-500' : 'bg-ink-950/15'}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                draft.aiPersonalization ? 'left-4' : 'left-0.5'
              }`}
            />
          </span>
        </button>
        <p className="text-[11px] text-ink-950/30 -mt-2">직원별로 문구·난이도·목표 수치를 자동 조정해요. 최종 실행은 매니저가 결정해요.</p>
      </div>

      <div className="px-6 py-4 border-t border-ink-950/8 shrink-0 flex gap-2">
        <SecondaryButton onClick={onClose} className="flex-1">
          취소
        </SecondaryButton>
        <PrimaryButton
          className="flex-1"
          onClick={() => {
            showToast(`"${draft.name}" 퀘스트를 ${member.name}님에게 배정했어요`)
            onClose()
          }}
        >
          CREATE & ASSIGN
        </PrimaryButton>
      </div>
    </>
  )
}

export function QuestCreateModal() {
  const { questModalMemberId, closeQuestModal } = useManagerState()
  const open = !!questModalMemberId

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={closeQuestModal} />
      <div
        className={`relative w-full max-w-md max-h-[85vh] rounded-2xl bg-ink-900 border border-ink-950/10 shadow-2xl flex flex-col transition-all duration-300 ${
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-ink-950/8 shrink-0">
          <h3 className="text-sm font-semibold text-ink-950">CREATE QUEST</h3>
          <button onClick={closeQuestModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-ink-950/8 text-ink-950/60">
            <X size={15} />
          </button>
        </div>
        {questModalMemberId && <QuestForm key={questModalMemberId} memberId={questModalMemberId} onClose={closeQuestModal} />}
      </div>
    </div>
  )
}
