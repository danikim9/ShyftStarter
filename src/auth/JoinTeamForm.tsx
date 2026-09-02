import { useState } from 'react'
import { Users } from 'lucide-react'
import { useAppState } from '../lib/store'
import { PrimaryButton } from '../components/ui'

export function JoinTeamForm({ onSuccess }: { onSuccess: () => void }) {
  const { joinTeam } = useAppState()
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const submit = () => {
    if (!code.trim()) return
    const ok = joinTeam(code)
    if (ok) {
      onSuccess()
    } else {
      setError(true)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-white/50 text-xs">
        <Users size={14} />
        매니저의 매장 참여 코드나, 동료가 만든 그룹 코드를 입력해주세요
      </div>
      <input
        value={code}
        onChange={(e) => {
          setCode(e.target.value)
          setError(false)
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="예: GN-4821 또는 CREW-9F2Q"
        autoCapitalize="characters"
        className={`w-full rounded-xl bg-white/6 border px-3.5 py-3 text-sm text-white placeholder:text-white/25 outline-none tracking-wide ${
          error ? 'border-rose-signal/60' : 'border-white/10 focus:border-brand-400/50'
        }`}
      />
      {error && <p className="text-[11px] text-rose-300">코드가 올바르지 않아요. 다시 확인해주세요.</p>}
      <PrimaryButton onClick={submit}>참여하기</PrimaryButton>
    </div>
  )
}
