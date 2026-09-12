import { useEffect, useState } from 'react'
import { Camera, ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react'
import { ACCESS_LABEL, checkCameraAccess, requestCameraAccess, SETTINGS_HINT, type CameraAccess } from '../lib/cameraAccess'
import { Badge, SecondaryButton } from './ui'

/** Shows the OS camera/photo permission state and lets the user request it.
 * Used in Profile → 데이터·개인정보 and inline in the handover composer. */
export function CameraPermissionStatus({ compact = false }: { compact?: boolean }) {
  const [access, setAccess] = useState<CameraAccess | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = async () => setAccess(await checkCameraAccess())
  useEffect(() => {
    void refresh()
  }, [])

  if (!access) return <div className="h-5 w-32 rounded shimmer bg-ink-950/6" />

  const tone = (s: CameraAccess['camera']) => (s === 'granted' ? 'emerald' : s === 'denied' ? 'rose' : s === 'web' ? 'default' : 'amber')
  const ask = async () => {
    setBusy(true)
    try {
      await requestCameraAccess('camera')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-ink-950/55">
        <Camera size={12} />
        카메라 권한 <Badge tone={tone(access.camera)}>{ACCESS_LABEL[access.camera]}</Badge>
        {access.camera === 'prompt' && (
          <button onClick={ask} disabled={busy} className="text-brand-700 font-medium">
            지금 확인
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-ink-950/50">
        <span className="inline-flex items-center gap-1.5">
          <Camera size={12} /> 카메라 권한
        </span>
        <Badge tone={tone(access.camera)}>{ACCESS_LABEL[access.camera]}</Badge>
      </div>
      <div className="flex items-center justify-between text-xs text-ink-950/50">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={12} /> 사진 보관함
        </span>
        <Badge tone={tone(access.photos)}>{ACCESS_LABEL[access.photos]}</Badge>
      </div>
      {access.camera === 'web' && <p className="text-[11px] text-ink-950/40 leading-relaxed">브라우저에서는 사진을 첨부할 때 브라우저가 직접 권한을 물어요. 앱(TestFlight)에서는 여기서 상태를 확인하고 요청할 수 있어요.</p>}
      {access.camera === 'prompt' && (
        <SecondaryButton disabled={busy} onClick={ask} className="flex items-center justify-center gap-1.5 !py-2.5">
          <Camera size={14} /> {busy ? '확인 중…' : '카메라 권한 확인하기'}
        </SecondaryButton>
      )}
      {access.camera === 'denied' && (
        <div className="flex items-start gap-1.5 rounded-lg bg-rose-signal/8 border border-rose-signal/20 px-3 py-2 text-[11px] text-rose-700">
          <ShieldAlert size={12} className="shrink-0 mt-0.5" /> {SETTINGS_HINT}
        </div>
      )}
      {access.camera !== 'web' && (
        <button onClick={() => void refresh()} className="text-[11px] text-ink-950/40 inline-flex items-center gap-1">
          <RefreshCw size={11} /> 상태 새로고침
        </button>
      )}
      <p className="text-[11px] text-ink-950/40">카메라는 인수인계 사진에만 쓰여요. 마이크·위치 권한은 요청하지 않아요.</p>
    </div>
  )
}
