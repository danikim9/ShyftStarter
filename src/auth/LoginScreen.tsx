// Login. Two modes, chosen by the repository:
//  - local (no Supabase env): pick a seeded demo account — for TestFlight pilots
//    before the backend is connected.
//  - supabase: email + password via Supabase Auth. Role and store come from the
//    `users` profile row, never from the client.
import { useEffect, useState } from 'react'
import { Store, ChevronRight, Lock } from 'lucide-react'
import { useBellatrix } from '../lib/bellatrixStore'
import type { User } from '../types/bellatrix'
import { PrimaryButton, Badge } from '../components/ui'
import { inputClass } from '../components/bellatrix/shared'

export type UserRole = 'employee' | 'manager'

const ROLE_LABEL: Record<User['role'], string> = { employee: '직원', manager: '매니저', admin: '관리자' }

export function LoginScreen() {
  const { repoMode, signIn, listDemoAccounts } = useBellatrix()
  const [accounts, setAccounts] = useState<User[] | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (repoMode === 'local') listDemoAccounts().then(setAccounts).catch(() => setAccounts([]))
  }, [repoMode, listDemoAccounts])

  const go = async (mail: string, pw?: string) => {
    setBusy(mail)
    setError(null)
    try {
      await signIn(mail, pw)
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인에 실패했어요.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#f3edff_0%,_#ffffff_55%)] flex items-center justify-center py-0 sm:py-8 px-0 sm:px-4">
      <div className="relative w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:rounded-[2.75rem] sm:border sm:border-ink-950/8 overflow-hidden flex flex-col bg-paper sm:shadow-[0_30px_80px_-20px_rgba(139,92,246,0.25)] px-7">
        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-brand-500/30 mb-5">S</div>
          <h1 className="text-ink-950 text-xl font-bold mb-1.5">ShyftStarter</h1>
          <p className="text-ink-950/40 text-sm text-center leading-relaxed">
            오늘 하나의 행동에 집중하고,
            <br />
            그 변화가 성과로 이어지는지 함께 확인해요
          </p>
        </div>

        <div className="pb-10 space-y-4 overflow-y-auto app-scroll">
          {repoMode === 'local' ? (
            <>
              <p className="text-center text-[11px] text-ink-950/35">파일럿 데모 — 계정을 선택하면 바로 로그인돼요</p>
              <div className="space-y-2">
                {accounts === null && <div className="h-14 rounded-xl shimmer bg-ink-950/6" />}
                {accounts?.map((u) => (
                  <button
                    key={u.id}
                    disabled={busy !== null}
                    onClick={() => go(u.email)}
                    className="w-full flex items-center gap-3 rounded-xl bg-white border border-ink-950/10 px-4 py-3 text-left active:scale-[0.98] transition disabled:opacity-60"
                  >
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${u.role === 'manager' ? 'bg-ink-950' : 'bg-brand-500'}`}>{u.name[0]}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-ink-950">{u.name}</span>
                        <Badge tone={u.role === 'manager' ? 'amber' : 'brand'}>{ROLE_LABEL[u.role]}</Badge>
                      </span>
                      <span className="text-[11px] text-ink-950/40 flex items-center gap-1 mt-0.5">
                        <Store size={10} /> Gangnam Flagship
                      </span>
                    </span>
                    <ChevronRight size={16} className="text-ink-950/25 shrink-0" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                void go(email, password)
              }}
            >
              <input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" className={inputClass} required />
              <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" className={inputClass} required />
              <PrimaryButton disabled={busy !== null}>
                <span className="inline-flex items-center gap-1.5">
                  <Lock size={14} /> {busy ? '로그인 중…' : '로그인'}
                </span>
              </PrimaryButton>
            </form>
          )}
          {error && <p className="text-xs text-rose-600 text-center">{error}</p>}
          <p className="text-center text-[11px] text-ink-950/25 leading-relaxed">
            마이크·녹음·위치 추적 없음 · 기록은 코칭과 성장 근거로만 쓰여요
          </p>
        </div>
      </div>
    </div>
  )
}
