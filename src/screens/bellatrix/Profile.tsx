import { useState } from 'react'
import { LogOut, Store, ChevronRight, RefreshCw, Database, Megaphone, CalendarDays, Shield } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../lib/bellatrixStore'
import { Card, SectionLabel, SecondaryButton, Badge } from '../../components/ui'
import { LoadingState } from '../../components/bellatrix/shared'

export type LegacyScreen = 'teamFeed' | 'myShift'

export function Profile({ onOpenLegacy }: { onOpenLegacy: (s: LegacyScreen) => void }) {
  const ready = useReadyData()
  const { signOut, repoMode, resetDemoData, reload } = useBellatrix()
  const [confirmReset, setConfirmReset] = useState(false)

  if (!ready) return <LoadingState />
  const { user, data } = ready
  const initial = user.name[0]

  return (
    <div className="px-4 pt-4 pb-8 space-y-6">
      <div className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-lg font-bold text-white">{initial}</span>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-ink-950 leading-tight">{user.name}</h1>
          <div className="text-xs text-ink-950/45 truncate">{user.email}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge tone="brand">{user.role === 'manager' ? '매니저' : user.role === 'admin' ? '관리자' : '직원'}</Badge>
            <Badge>
              <Store size={10} /> {data.store.name}
            </Badge>
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>팀 · 근무</SectionLabel>
        <Card className="p-0 overflow-hidden">
          <button onClick={() => onOpenLegacy('teamFeed')} className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-ink-950/6 text-left">
            <Megaphone size={16} className="text-ink-950/45" />
            <span className="flex-1 text-sm text-ink-950/85">팀 공지 · 인수인계</span>
            <ChevronRight size={15} className="text-ink-950/25" />
          </button>
          <button onClick={() => onOpenLegacy('myShift')} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
            <CalendarDays size={16} className="text-ink-950/45" />
            <span className="flex-1 text-sm text-ink-950/85">근무 일정 (전체)</span>
            <ChevronRight size={15} className="text-ink-950/25" />
          </button>
        </Card>
      </div>

      <div>
        <SectionLabel>데이터 · 개인정보</SectionLabel>
        <Card className="space-y-3">
          <div className="flex items-start gap-2.5">
            <Shield size={14} className="text-ink-950/40 mt-0.5 shrink-0" />
            <p className="text-[11px] text-ink-950/55 leading-relaxed">
              이 앱은 마이크·오디오 녹음·위치 추적을 사용하지 않아요. 기록되는 것은 내가 직접 남긴 체크인, 액션 진행, 회고와 매니저의 관찰 메모예요. 매장 매출 KPI는 매니저만 볼 수 있어요.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-ink-950/50">
            <span className="inline-flex items-center gap-1.5">
              <Database size={12} /> 저장 위치
            </span>
            <Badge tone={repoMode === 'supabase' ? 'emerald' : 'amber'}>{repoMode === 'supabase' ? 'Supabase (서버)' : '이 기기 (오프라인 데모)'}</Badge>
          </div>
          <SecondaryButton onClick={reload} className="flex items-center justify-center gap-1.5">
            <RefreshCw size={14} /> 데이터 새로고침
          </SecondaryButton>
          {repoMode === 'local' &&
            (confirmReset ? (
              <div className="rounded-xl bg-rose-signal/8 border border-rose-signal/20 p-3 space-y-2">
                <p className="text-xs text-rose-700">데모 데이터를 초기 상태로 되돌려요. 이 기기에서 기록한 내용이 모두 사라져요.</p>
                <div className="grid grid-cols-2 gap-2">
                  <SecondaryButton onClick={() => setConfirmReset(false)}>취소</SecondaryButton>
                  <button
                    onClick={async () => {
                      setConfirmReset(false)
                      await resetDemoData()
                    }}
                    className="rounded-xl bg-rose-600 text-white text-sm font-semibold py-3"
                  >
                    초기화
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmReset(true)} className="w-full text-xs text-ink-950/40 py-1">
                데모 데이터 초기화
              </button>
            ))}
        </Card>
      </div>

      <SecondaryButton onClick={() => void signOut()} className="flex items-center justify-center gap-1.5">
        <LogOut size={14} /> 로그아웃
      </SecondaryButton>
      <p className="text-center text-[10px] text-ink-950/25">ShyftStarter by Bellatrix · Frontline Behavioral Intelligence</p>
    </div>
  )
}
