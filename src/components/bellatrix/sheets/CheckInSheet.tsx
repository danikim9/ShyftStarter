import { useState } from 'react'
import { useBellatrix, useReadyData } from '../../../lib/bellatrixStore'
import type { AttemptBucket, HelpfulnessLevel } from '../../../types/bellatrix'
import { ATTEMPT_BUCKET_LABEL, HELPFULNESS_LABEL } from '../../../types/bellatrix'
import { PrimaryButton } from '../../ui'
import { ChoiceChips, Question, TextArea } from '../shared'

const ATTEMPTS: { value: AttemptBucket; label: string }[] = (['0', '1-2', '3-5', '5+'] as AttemptBucket[]).map((v) => ({ value: v, label: ATTEMPT_BUCKET_LABEL[v] }))
const HELP: { value: HelpfulnessLevel; label: string }[] = (['not_really', 'a_little', 'very_helpful'] as HelpfulnessLevel[]).map((v) => ({
  value: v,
  label: HELPFULNESS_LABEL[v],
}))

/** 20–30 second behaviour evidence check-in. Stored as employee_self_report
 * (low confidence) — never treated as verified behaviour. */
export function CheckInSheet({ assignmentId }: { assignmentId: string }) {
  const ready = useReadyData()
  const { submitCheckIn, closeSheet } = useBellatrix()
  const [attempts, setAttempts] = useState<AttemptBucket | null>(null)
  const [help, setHelp] = useState<HelpfulnessLevel | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!ready) return null
  const assignment = ready.data.assignments.find((a) => a.id === assignmentId)
  const action = assignment && ready.data.actions.find((a) => a.id === assignment.action_id)
  if (!assignment || !action) return <p className="text-sm text-ink-950/50">액션을 찾을 수 없어요.</p>

  const submit = async () => {
    if (!attempts || !help) {
      setError('두 질문에 모두 답해주세요.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await submitCheckIn({ assignmentId, attempts, helpfulness: help, note, complete: true })
      closeSheet()
    } catch {
      setError('저장하지 못했어요. 네트워크를 확인하고 다시 시도해주세요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold text-ink-950/40 uppercase tracking-wide">행동 체크인</div>
        <h4 className="text-base font-bold text-ink-950 leading-snug mt-0.5">{action.title}</h4>
        <p className="text-[11px] text-ink-950/40 mt-1">솔직하게 답해주세요 — 잘한 것보다 실제로 한 것이 더 중요해요.</p>
      </div>
      <Question n={1} text="오늘 몇 번 시도했나요?">
        <ChoiceChips options={ATTEMPTS} value={attempts} onChange={setAttempts} columns={4} />
      </Question>
      <Question n={2} text="도움이 됐나요?">
        <ChoiceChips options={HELP} value={help} onChange={setHelp} columns={3} />
      </Question>
      <Question text="무슨 일이 있었나요? (선택)">
        <TextArea value={note} onChange={setNote} placeholder="예: 케이스 제안했더니 2명 중 1명이 구매" />
      </Question>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <PrimaryButton disabled={busy} onClick={submit}>
        {busy ? '저장 중…' : '기록하고 완료'}
      </PrimaryButton>
    </div>
  )
}
