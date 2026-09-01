import { useState } from 'react'
import { Copy, Check, QrCode, Lock } from 'lucide-react'
import { STORE_NAME, STORE_CODE, STORE_JOIN_LINK } from '../data/mvpData'
import { Card, SectionLabel } from '../components/ui'
import { useAppState } from '../lib/store'

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const { showToast } = useAppState()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyText(value)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
    showToast(ok ? `${label} 복사했어요` : '복사에 실패했어요 — 직접 선택해 복사해주세요')
  }

  return (
    <div>
      <div className="text-[11px] text-white/40 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 rounded-xl bg-white/6 border border-white/10 px-3.5 py-2.5 text-sm text-white/90 font-mono truncate">
          {value}
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 w-9 h-9 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center text-white/60 hover:text-white/90 transition"
          aria-label={`${label} 복사`}
        >
          {copied ? <Check size={14} className="text-emerald-signal" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  )
}

export function TeamInvite() {
  const { showToast } = useAppState()
  return (
    <div>
      <SectionLabel>팀 초대</SectionLabel>
      <Card className="space-y-4">
        <p className="text-xs text-white/40 leading-relaxed">
          아래 코드나 링크를 매장 단체 채팅방에 공유하면, 직원이 개인 계정으로 로그인 후 입력해 바로{' '}
          {STORE_NAME} 팀에 참여해요 — 공지·인수인계를 그때부터 받기 시작합니다.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <CopyRow label="참여 코드" value={STORE_CODE} />
          <CopyRow label="참여 링크" value={STORE_JOIN_LINK} />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/12 p-3">
          <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center relative shrink-0">
            <QrCode size={26} className="text-white/15" />
            <div className="absolute inset-0 flex items-center justify-center bg-ink-950/40 rounded-lg">
              <Lock size={13} className="text-white/40" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-white/70">QR 코드로 초대</div>
            <div className="text-[11px] text-white/35 leading-relaxed">
              매장에 붙여두고 스캔만으로 참여 — Business 티어부터 제공돼요
            </div>
          </div>
          <button
            onClick={() => showToast('QR 초대는 Business 티어부터 제공돼요')}
            className="ml-auto shrink-0 text-[11px] font-semibold text-white/40 border border-white/12 rounded-full px-2.5 py-1"
          >
            잠금
          </button>
        </div>
      </Card>
    </div>
  )
}
