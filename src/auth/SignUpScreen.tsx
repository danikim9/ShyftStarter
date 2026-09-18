// Personal sign-up: name, email, job category, interests. No team required.
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useBellatrix } from '../lib/bellatrixStore'
import type { BehaviourType, JobCategory } from '../types/bellatrix'
import { BEHAVIOUR_LABEL, JOB_LABEL } from '../types/bellatrix'
import { PrimaryButton } from '../components/ui'
import { ChoiceChips, Question, inputClass } from '../components/bellatrix/shared'

const JOBS: JobCategory[] = ['electronics', 'beauty', 'fashion', 'telecom', 'other']
const INTERESTS: BehaviourType[] = ['discovery', 'demo', 'recommendation', 'cross_sell', 'closing']

export function SignUpScreen({ onBack }: { onBack: () => void }) {
  const { signUp, repoMode } = useBellatrix()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [job, setJob] = useState<JobCategory | null>(null)
  const [interests, setInterests] = useState<BehaviourType[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (b: BehaviourType) => setInterests((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : prev.length >= 2 ? prev : [...prev, b]))

  const submit = async () => {
    if (!name.trim()) return setError('이름을 입력해주세요.')
    if (!email.trim()) return setError('이메일을 입력해주세요.')
    if (repoMode === 'supabase' && password.length < 8) return setError('비밀번호는 8자 이상이어야 해요.')
    if (!job) return setError('직군을 골라주세요.')
    setBusy(true)
    setError(null)
    try {
      await signUp({ name, email, password: password || undefined, job_category: job, interests })
    } catch (e) {
      setError(e instanceof Error ? e.message : '가입하지 못했어요.')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#e3faf5_0%,_#ffffff_55%)] flex items-center justify-center py-0 sm:py-8 px-0 sm:px-4">
      <div className="relative w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:rounded-[2.75rem] sm:border sm:border-ink-950/8 overflow-hidden flex flex-col bg-paper sm:shadow-[0_30px_80px_-20px_rgba(13,133,120,0.18)]">
        <div className="shrink-0 px-5 flex items-center" style={{ paddingTop: 'max(1rem, var(--safe-top))' }}>
          <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-ink-950/50 py-2 -ml-1">
            <ArrowLeft size={14} /> 로그인으로
          </button>
        </div>
        <form
          className="flex-1 overflow-y-auto app-scroll px-6 pb-10 space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <div>
            <h1 className="text-xl font-bold text-ink-950">새로 시작하기</h1>
            <p className="text-xs text-ink-950/45 mt-1">팀이 없어도 괜찮아요. 내 근무와 내 목표만으로 시작해요.</p>
          </div>
          <Question text="이름">
            <input id="signup-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 김다니" autoComplete="name" className={inputClass} />
          </Question>
          <Question text="이메일">
            <input id="signup-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
          </Question>
          {repoMode === 'supabase' && (
            <Question text="비밀번호">
              <input id="signup-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8자 이상" className={inputClass} />
            </Question>
          )}
          <Question text="어떤 판매를 하시나요?">
            <ChoiceChips options={JOBS.map((j) => ({ value: j, label: JOB_LABEL[j] }))} value={job} onChange={setJob} />
          </Question>
          <Question text="더 잘하고 싶은 행동 (최대 2개, 선택)">
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((b) => {
                const on = interests.includes(b)
                return (
                  <button key={b} type="button" onClick={() => toggle(b)} className={`rounded-xl border px-3 py-2 text-sm font-medium ${on ? 'bg-brand-500 border-brand-500 text-ink-950' : 'bg-white border-ink-950/10 text-ink-950/75'}`}>
                    {BEHAVIOUR_LABEL[b]}
                  </button>
                )
              })}
            </div>
          </Question>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <PrimaryButton disabled={busy}>{busy ? '만드는 중…' : '시작하기'}</PrimaryButton>
          <p className="text-[11px] text-ink-950/35 leading-relaxed">
            {repoMode === 'local' ? '이 계정은 이 기기에만 저장돼요.' : '가입 확인 메일이 올 수 있어요.'} 마이크·녹음·위치를 쓰지 않아요.
          </p>
        </form>
      </div>
    </div>
  )
}
