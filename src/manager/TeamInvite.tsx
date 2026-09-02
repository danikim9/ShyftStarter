import { useState } from 'react'
import { Copy, Check, QrCode, Lock, Crown, Pencil, Shuffle } from 'lucide-react'
import { STORE_NAME } from '../data/mvpData'
import { Card, SectionLabel, PrimaryButton, SecondaryButton } from '../components/ui'
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
    // 27차 — iPhone UI 대응 중 발견한 버그: 이 div에 min-w-0이 없으면
    // "grid sm:grid-cols-2"의 암시적 트랙이 자식의 min-content(잘리지 않은
    // 전체 URL 텍스트 폭)만큼 늘어나면서 복사 버튼이 화면 밖으로 밀려났다
    // (390px 뷰포트에서 버튼이 x=404까지 벗어남). min-w-0을 줘서 그리드
    // 셀 폭 안에서 정상적으로 truncate되도록 수정.
    <div className="min-w-0">
      <div className="text-[11px] text-ink-950/40 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 rounded-xl bg-ink-950/6 border border-ink-950/10 px-3.5 py-2.5 text-sm text-ink-950/90 font-mono truncate">
          {value}
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 w-9 h-9 rounded-xl bg-ink-950/6 border border-ink-950/10 flex items-center justify-center text-ink-950/60 hover:text-ink-950/90 transition"
          aria-label={`${label} 복사`}
        >
          {copied ? <Check size={14} className="text-emerald-signal" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  )
}

function generateRandomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

// 20차 — 매니저 PRO: 참여 코드 커스터마이즈. 랜덤 발급 코드 대신 매장에
// 어울리는 코드를 직접 정하거나(예: GANGNAM2026), 새로 무작위 발급도 할 수
// 있다. PRO 배지를 붙여 유료 티어 기능이라는 것을 정직하게 표기하되, 14차
// 근무 교대 요청 때와 같은 원칙으로 실제로 동작하게 구현했다 — 진짜 코드가
// 바뀌고, 직원 쪽 참여 화면(Team 탭)에서 새 코드로 즉시 참여할 수 있다.
function CodeCustomizer() {
  const { storeCode, setStoreCode } = useAppState()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(storeCode)
  const [error, setError] = useState<string | null>(null)

  const startEditing = () => {
    setDraft(storeCode)
    setError(null)
    setEditing(true)
  }

  const handleSave = () => {
    const result = setStoreCode(draft)
    if (result.ok) {
      setEditing(false)
      setError(null)
    } else {
      setError(result.reason)
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <SectionLabel>코드 커스터마이즈</SectionLabel>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-signal/15 text-amber-600 text-[10px] font-bold px-2 py-0.5 -mt-2">
          <Crown size={10} /> PRO
        </span>
      </div>

      {!editing ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 rounded-xl bg-ink-950/6 border border-ink-950/10 px-3.5 py-2.5 text-sm text-ink-950/90 font-mono truncate">
            {storeCode}
          </div>
          <button
            onClick={startEditing}
            className="shrink-0 w-9 h-9 rounded-xl bg-ink-950/6 border border-ink-950/10 flex items-center justify-center text-ink-950/60 hover:text-ink-950/90 transition"
            aria-label="참여 코드 수정"
          >
            <Pencil size={14} />
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setError(null)
              }}
              placeholder="예: GANGNAM2026"
              autoCapitalize="characters"
              className={`flex-1 min-w-0 rounded-xl bg-ink-950/6 border px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-950/25 outline-none font-mono tracking-wide ${
                error ? 'border-rose-signal/60' : 'border-ink-950/10 focus:border-brand-400/50'
              }`}
            />
            <button
              onClick={() => setDraft(generateRandomCode())}
              className="shrink-0 w-9 h-9 rounded-xl bg-ink-950/6 border border-ink-950/10 flex items-center justify-center text-ink-950/60 hover:text-ink-950/90 transition"
              aria-label="무작위로 코드 생성"
              title="무작위로 생성"
            >
              <Shuffle size={14} />
            </button>
          </div>
          {error && <p className="text-[11px] text-rose-600">{error}</p>}
          <div className="flex gap-2">
            <SecondaryButton className="flex-1" onClick={() => setEditing(false)}>
              취소
            </SecondaryButton>
            <PrimaryButton className="flex-1" onClick={handleSave}>
              저장
            </PrimaryButton>
          </div>
        </div>
      )}

      <p className="text-[11px] text-ink-950/30 leading-relaxed">
        코드를 바꾸면 그 순간부터 이전 코드는 더 이상 쓸 수 없어요 — 이미 참여한 직원은 그대로 유지돼요.
      </p>
    </Card>
  )
}

export function TeamInvite() {
  const { showToast, storeCode, storeJoinLink } = useAppState()
  return (
    <div className="space-y-3">
      <SectionLabel>팀 초대</SectionLabel>
      <Card className="space-y-4">
        <p className="text-xs text-ink-950/40 leading-relaxed">
          아래 코드나 링크를 매장 단체 채팅방에 공유하면, 직원이 개인 계정으로 로그인 후 입력해 바로{' '}
          {STORE_NAME} 팀에 참여해요 — 공지·인수인계를 그때부터 받기 시작합니다.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <CopyRow label="참여 코드" value={storeCode} />
          <CopyRow label="참여 링크" value={storeJoinLink} />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-dashed border-ink-950/12 p-3">
          <div className="w-14 h-14 rounded-lg bg-ink-950/5 flex items-center justify-center relative shrink-0">
            <QrCode size={26} className="text-ink-950/15" />
            <div className="absolute inset-0 flex items-center justify-center bg-ink-950/40 rounded-lg">
              <Lock size={13} className="text-ink-950/40" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-ink-950/70">QR 코드로 초대</div>
            <div className="text-[11px] text-ink-950/35 leading-relaxed">
              매장에 붙여두고 스캔만으로 참여 — Business 티어부터 제공돼요
            </div>
          </div>
          <button
            onClick={() => showToast('QR 초대는 Business 티어부터 제공돼요')}
            className="ml-auto shrink-0 text-[11px] font-semibold text-ink-950/40 border border-ink-950/12 rounded-full px-2.5 py-1"
          >
            잠금
          </button>
        </div>
      </Card>

      <CodeCustomizer />
    </div>
  )
}
