import { useState } from 'react'
import { Users } from 'lucide-react'
import { useBellatrix } from '../../../lib/bellatrixStore'
import { useAppState } from '../../../lib/store'
import { PrimaryButton } from '../../ui'
import { inputClass } from '../shared'

/** Join a team by invite code. Also flips the legacy feed membership so the
 * Team tab (announcements/handover) opens without a second join step. */
export function JoinTeamSheet({ onDone }: { onDone?: () => void }) {
  const { joinTeam, closeSheet } = useBellatrix()
  const legacy = useAppState()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!code.trim()) return setError('초대 코드를 입력해주세요.')
    setBusy(true)
    setError(null)
    try {
      await joinTeam(code)
      if (legacy.membership !== 'store') legacy.joinTeam(legacy.storeCode)
      onDone?.()
      closeSheet()
    } catch (e) {
      setError(e instanceof Error ? e.message : '참여하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-ink-950/55 text-xs">
        <Users size={14} /> 매니저에게 받은 초대 코드나 링크의 코드를 입력해주세요
      </div>
      <input
        value={code}
        onChange={(e) => {
          setCode(e.target.value)
          setError(null)
        }}
        onKeyDown={(e) => e.key === 'Enter' && void submit()}
        placeholder="예: GN-4821"
        autoCapitalize="characters"
        className={`${inputClass} tracking-wide ${error ? 'border-rose-signal/60' : ''}`}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <PrimaryButton disabled={busy} onClick={submit}>
        {busy ? '참여 중…' : '팀에 참여하기'}
      </PrimaryButton>
      <p className="text-[11px] text-ink-950/40 leading-relaxed">
        팀에 참여하면 팀 공지·인수인계·팀 액션을 받을 수 있어요. 개인 목표·회고·성장 기록은 참여 후에도 나만 볼 수 있어요.
      </p>
    </div>
  )
}
