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
      <div className="flex items-center gap-2 text-ink-950/50 text-xs">
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
        // 33차 — 이 입력창이 정확히 사용자가 "확대된다"고 짚어준 그 지점
        // (매장 코드 입력)이다. text-sm(15px)이 iOS의 "16px 미만 입력창은
        // 탭하면 자동으로 확대" 동작 기준선보다 작아서, 여길 탭하는 순간
        // iOS/WKWebView가 스스로 화면을 확대하고 — 포커스를 벗어나거나
        // "참여하기"를 눌러도 확대 상태가 자동으로 안 풀리는 게 실제
        // 트리거였을 가능성이 매우 높다(index.html의 user-scalable=no와
        // 별개로, 애초에 확대 유발 자체를 없애는 근본 수정). text-[16px]로
        // 16px 문턱을 넘겨 이 자동 확대가 걸리지 않도록 했다.
        className={`w-full rounded-xl bg-ink-950/6 border px-3.5 py-3 text-[16px] text-ink-950 placeholder:text-ink-950/25 outline-none tracking-wide ${
          error ? 'border-rose-signal/60' : 'border-ink-950/10 focus:border-brand-400/50'
        }`}
      />
      {error && <p className="text-[11px] text-rose-600">코드가 올바르지 않아요. 다시 확인해주세요.</p>}
      <PrimaryButton onClick={submit}>참여하기</PrimaryButton>
    </div>
  )
}
