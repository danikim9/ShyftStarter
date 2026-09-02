// v2 — mock social login UX.
//
// Naver/Google/Apple/Kakao "real" login needs OAuth: a registered app +
// API keys with each provider, plus a backend to exchange/verify tokens.
// None of that exists in this frontend-only prototype, so this screen is a
// demo of the intended flow only — pressing any button simulates a
// successful sign-in and drops the user straight into the app. Wiring in
// real OAuth later is a drop-in replacement for `handleLogin` below; the
// screen/UX itself does not need to change.

import { useState, type ReactElement } from 'react'

export type AuthProvider = 'naver' | 'kakao' | 'google' | 'apple'

// 27차 — 직원+매니저 통합 앱(하나의 링크, 하나의 버튼으로 화면 전환) 요청에
// 따라 로그인 시점에 역할(Role)을 함께 받는다. 실제 백엔드/인증이 없는
// 프로토타입이라 "계정에 역할이 귀속된다"(26차에서 논의한 실서비스 설계
// 방향)는 것을 로그인 화면에서 역할을 직접 고르는 것으로 시뮬레이션했다 —
// 어떤 소셜 버튼을 누르든 그 순간 고른 역할로 로그인된다. 기본값은 'employee'
// (안전한 쪽)로 두어, 명시적으로 '매니저'를 선택하지 않으면 매니저 대시보드
// 진입점 자체가 생기지 않는다.
export type UserRole = 'employee' | 'manager'

function NaverMark() {
  // 네이버 브랜드 버튼(초록 배경)은 앱 전체 테마와 무관하게 항상 흰 글자를
  // 쓴다 — 23차 라이트 테마 전환의 자동 치환(white→ink-950) 대상에서
  // 제외해야 하는 지점이라 여기 명시해둔다.
  return (
    <span className="w-5 h-5 rounded-[5px] bg-white/20 flex items-center justify-center text-[11px] font-extrabold text-white shrink-0">
      N
    </span>
  )
}

function KakaoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <ellipse cx="12" cy="11" rx="9" ry="7.2" fill="#191919" />
      <path d="M7.5 15.5 L5.5 20 L10 16.8" fill="#191919" />
    </svg>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
      <circle cx="9" cy="9" r="2.1" fill="#4285F4" />
      <circle cx="9" cy="3.2" r="2.1" fill="#EA4335" />
      <circle cx="14.8" cy="9" r="2.1" fill="#FBBC05" />
      <circle cx="9" cy="14.8" r="2.1" fill="#34A853" />
      <circle cx="3.2" cy="9" r="2.1" fill="#4285F4" opacity="0.85" />
    </svg>
  )
}

function AppleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
      <path
        d="M16.2 3.5c0 1.05-.42 2.02-1.1 2.75-.78.83-2.02 1.47-3.02 1.38-.14-1.02.38-2.08 1.1-2.78.78-.78 2.14-1.35 3.02-1.35zM19.9 17.2c-.5 1.15-.74 1.66-1.38 2.68-.9 1.44-2.16 3.24-3.74 3.26-1.4.02-1.76-.92-3.66-.9-1.9.02-2.3.92-3.7.9-1.58-.02-2.78-1.63-3.68-3.07-2.52-4.02-2.78-8.74-1.22-11.25 1.1-1.78 2.86-2.82 4.5-2.82 1.68 0 2.74 1.02 4.14 1.02 1.36 0 2.18-1.02 4.14-1.02 1.46 0 3 .84 4.1 2.28-3.6 2-3.02 7.2.5 8.92z"
        fill="white"
      />
    </svg>
  )
}

// 23차 — 네이버(초록)/카카오(노랑)/Apple(검정) 버튼은 각 사의 고정 브랜드
// 색이라 라이트 테마로 바뀌어도 그대로 두고, 그 위 글자색만 배경 대비가
// 유지되도록 각각 맞춘다(네이버·Apple은 흰 글자, 카카오·Google은 어두운
// 글자) — 자동 치환 대상에서 제외하고 직접 지정.
const PROVIDERS: { id: AuthProvider; label: string; className: string; mark: () => ReactElement }[] = [
  { id: 'naver', label: '네이버로 계속하기', className: 'bg-[#03C75A] text-white', mark: NaverMark },
  { id: 'kakao', label: '카카오로 계속하기', className: 'bg-[#FEE500] text-[#191919]', mark: KakaoMark },
  { id: 'google', label: 'Google로 계속하기', className: 'bg-white text-ink-950 border border-ink-950/10', mark: GoogleMark },
  { id: 'apple', label: 'Apple로 계속하기', className: 'bg-black text-white border border-black', mark: AppleMark },
]

const ROLES: { id: UserRole; label: string }[] = [
  { id: 'employee', label: '직원' },
  { id: 'manager', label: '매니저' },
]

export function LoginScreen({ onLogin }: { onLogin: (provider: AuthProvider, role: UserRole) => void }) {
  const [role, setRole] = useState<UserRole>('employee')

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#f3edff_0%,_#ffffff_55%)] flex items-center justify-center py-0 sm:py-8 px-0 sm:px-4">
      <div className="relative w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:rounded-[2.75rem] sm:border sm:border-ink-950/8 overflow-hidden flex flex-col bg-paper sm:shadow-[0_30px_80px_-20px_rgba(139,92,246,0.25)] px-7">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-brand-500/30 mb-5">
            S
          </div>
          <h1 className="text-ink-950 text-xl font-bold mb-1.5">ShyftStarter</h1>
          <p className="text-ink-950/40 text-sm text-center leading-relaxed">
            내 근무를 정리하고, 팀과 연결하고,
            <br />
            매일의 일을 더 잘하게 만드는 Shift Companion
          </p>
        </div>

        <div className="pb-10 space-y-4">
          {/* 27차 — 실제 인증/역할(Role) 검증이 붙기 전까지, 로그인 화면에서
              역할을 직접 선택하는 것으로 "계정에 역할이 귀속된다"는 실서비스
              설계를 시뮬레이션한다. 매니저를 선택해야만 로그인 후 매니저
              대시보드로 가는 진입점(상단 전환 버튼)이 생긴다. */}
          <div>
            <p className="text-center text-[11px] text-ink-950/35 mb-2">
              데모 로그인 — 체험할 역할을 선택해주세요
            </p>
            <div className="flex items-center gap-1 rounded-full bg-ink-900 border border-ink-950/8 p-1">
              {ROLES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setRole(id)}
                  className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${
                    role === id ? 'bg-white text-brand-600 shadow-sm' : 'text-ink-950/45 hover:text-ink-950/70'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {PROVIDERS.map(({ id, label, className, mark: Mark }) => (
              <button
                key={id}
                onClick={() => onLogin(id, role)}
                className={`w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-semibold active:scale-[0.98] transition ${className}`}
              >
                <Mark />
                {label}
              </button>
            ))}
          </div>
          <p className="text-center text-[11px] text-ink-950/25 leading-relaxed">
            계속 진행하면 ShyftStarter 이용약관 및
            <br />
            개인정보 처리방침에 동의하는 것으로 간주됩니다
          </p>
        </div>
      </div>
    </div>
  )
}
