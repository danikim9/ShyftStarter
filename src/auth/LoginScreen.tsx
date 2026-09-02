// v2 — mock social login UX.
//
// Naver/Google/Apple/Kakao "real" login needs OAuth: a registered app +
// API keys with each provider, plus a backend to exchange/verify tokens.
// None of that exists in this frontend-only prototype, so this screen is a
// demo of the intended flow only — pressing any button simulates a
// successful sign-in and drops the user straight into the app. Wiring in
// real OAuth later is a drop-in replacement for `handleLogin` below; the
// screen/UX itself does not need to change.

import type { ReactElement } from 'react'

export type AuthProvider = 'naver' | 'kakao' | 'google' | 'apple'

function NaverMark() {
  return (
    <span className="w-5 h-5 rounded-[5px] bg-white/15 flex items-center justify-center text-[11px] font-extrabold text-white shrink-0">
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

const PROVIDERS: { id: AuthProvider; label: string; className: string; mark: () => ReactElement }[] = [
  { id: 'naver', label: '네이버로 계속하기', className: 'bg-[#03C75A] text-white', mark: NaverMark },
  { id: 'kakao', label: '카카오로 계속하기', className: 'bg-[#FEE500] text-[#191919]', mark: KakaoMark },
  { id: 'google', label: 'Google로 계속하기', className: 'bg-white text-ink-900 border border-black/10', mark: GoogleMark },
  { id: 'apple', label: 'Apple로 계속하기', className: 'bg-black text-white border border-white/15', mark: AppleMark },
]

export function LoginScreen({ onLogin }: { onLogin: (provider: AuthProvider) => void }) {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#1b2140_0%,_#0b0e1a_60%)] flex items-center justify-center py-0 sm:py-8 px-0 sm:px-4">
      <div className="relative w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:rounded-[2.75rem] sm:border sm:border-white/10 overflow-hidden flex flex-col bg-ink-950 sm:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] px-7">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-brand-900/40 mb-5">
            S
          </div>
          <h1 className="text-white text-xl font-bold mb-1.5">ShyftStarter</h1>
          <p className="text-white/40 text-sm text-center leading-relaxed">
            내 근무를 정리하고, 팀과 연결하고,
            <br />
            매일의 일을 더 잘하게 만드는 Shift Companion
          </p>
        </div>

        <div className="pb-10 space-y-2.5">
          {PROVIDERS.map(({ id, label, className, mark: Mark }) => (
            <button
              key={id}
              onClick={() => onLogin(id)}
              className={`w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-semibold active:scale-[0.98] transition ${className}`}
            >
              <Mark />
              {label}
            </button>
          ))}
          <p className="text-center text-[11px] text-white/25 pt-3 leading-relaxed">
            계속 진행하면 ShyftStarter 이용약관 및
            <br />
            개인정보 처리방침에 동의하는 것으로 간주됩니다
          </p>
        </div>
      </div>
    </div>
  )
}
