import { useState } from 'react'
import { LogOut, Store, RefreshCw, Database, Shield, Users, Lock, Eye, Briefcase } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../lib/bellatrixStore'
import { JOB_LABEL } from '../../types/bellatrix'
import { Card, SectionLabel, SecondaryButton, Badge, Toggle } from '../../components/ui'
import { LoadingState } from '../../components/bellatrix/shared'
import { storage } from '../../lib/storage'
import { DemoBadge } from '../../components/bellatrix/DemoBadge'
import { CameraPermissionStatus } from '../../components/CameraPermissionStatus'

export function Profile() {
  const ready = useReadyData()
  const { signOut, repoMode, resetDemoData, reload, updateConsent, leaveTeam, openSheet } = useBellatrix()
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)

  if (!ready) return <LoadingState />
  const { user, data } = ready
  const isManager = user.role === 'manager' || user.role === 'admin'

  return (
    <div className="px-4 pt-4 pb-8 space-y-6">
      <div className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-lg font-bold text-white">{user.name[0]}</span>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-ink-950 leading-tight">{user.name}</h1>
          <div className="text-xs text-ink-950/45 truncate">{user.email}</div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Badge tone="brand">{isManager ? '매니저' : '직원'}</Badge>
            <Badge>
              <Briefcase size={10} /> {JOB_LABEL[user.job_category]}
            </Badge>
            {user.is_demo && <DemoBadge label="데모 계정" />}
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>팀</SectionLabel>
        <Card className="space-y-3">
          {data.team ? (
            <>
              <div className="flex items-center gap-2.5">
                <Users size={16} className="text-brand-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink-950">{data.team.name}</div>
                  {data.store && (
                    <div className="text-[11px] text-ink-950/45 flex items-center gap-1">
                      <Store size={10} /> {data.store.name}
                    </div>
                  )}
                </div>
              </div>
              {!isManager &&
                (confirmLeave ? (
                  <div className="rounded-xl bg-ink-950/4 p-3 space-y-2">
                    <p className="text-xs text-ink-950/60">팀을 떠나면 팀 공지·팀 액션을 더 받지 않아요. 개인 목표·회고·성장 기록은 그대로 남아요.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <SecondaryButton onClick={() => setConfirmLeave(false)}>취소</SecondaryButton>
                      <button
                        onClick={async () => {
                          setConfirmLeave(false)
                          await leaveTeam()
                        }}
                        className="rounded-xl bg-ink-950 text-white text-sm font-semibold py-3"
                      >
                        팀 떠나기
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirmLeave(true)} className="w-full text-xs text-ink-950/40 py-1">
                    팀 떠나기
                  </button>
                ))}
            </>
          ) : (
            <>
              <p className="text-xs text-ink-950/55 leading-relaxed">아직 팀에 참여하지 않았어요. 참여는 선택이고, 개인 기능은 지금도 전부 쓸 수 있어요.</p>
              <SecondaryButton onClick={() => openSheet({ kind: 'joinTeam' })}>초대 코드로 참여</SecondaryButton>
            </>
          )}
        </Card>
      </div>

      {!isManager && (
        <div>
          <SectionLabel>누가 무엇을 볼 수 있나요</SectionLabel>
          <Card className="space-y-3">
            <div className="space-y-2 text-xs text-ink-950/65">
              <div className="flex items-start gap-2">
                <Lock size={12} className="mt-0.5 shrink-0 text-ink-950/50" />
                <span>
                  <span className="font-semibold text-ink-950/85">나만 보기</span> — 개인 목표, 시도 기록, Shift Prep, 회고, My Wins, 자신감
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Eye size={12} className="mt-0.5 shrink-0 text-ink-950/50" />
                <span>
                  <span className="font-semibold text-ink-950/85">매니저에게 보임</span> — 팀 액션 완료 여부와 체크인 횟수, 매니저가 직접 남긴 관찰
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Users size={12} className="mt-0.5 shrink-0 text-ink-950/50" />
                <span>
                  <span className="font-semibold text-ink-950/85">팀에 공개</span> — 내가 남긴 공지·인수인계·댓글
                </span>
              </div>
            </div>
            <div className="h-px bg-ink-950/6" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-ink-950/85">회고를 매니저와 공유</div>
                <div className="text-[11px] text-ink-950/40">켜면 앞으로 남기는 회고가 매니저에게 보여요. 지난 회고는 그대로 비공개예요.</div>
              </div>
              <Toggle
                checked={user.consent.share_reflections_with_manager}
                onChange={() => void updateConsent({ ...user.consent, share_reflections_with_manager: !user.consent.share_reflections_with_manager })}
                label="회고 공유"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-ink-950/85">목표 진행을 팀 집계에 포함</div>
                <div className="text-[11px] text-ink-950/40">개별 목표 내용은 공개되지 않고, 팀 전체 시도 횟수에만 더해져요.</div>
              </div>
              <Toggle
                checked={user.consent.share_goal_progress_with_team}
                onChange={() => void updateConsent({ ...user.consent, share_goal_progress_with_team: !user.consent.share_goal_progress_with_team })}
                label="목표 집계 공유"
              />
            </div>
          </Card>
        </div>
      )}

      <div>
        <SectionLabel>데이터 · 개인정보</SectionLabel>
        <Card className="space-y-3">
          <div className="flex items-start gap-2.5">
            <Shield size={14} className="text-ink-950/40 mt-0.5 shrink-0" />
            <p className="text-[11px] text-ink-950/55 leading-relaxed">
              마이크 · 녹음 · 위치 · 얼굴 인식을 쓰지 않아요. 카메라는 인수인계 사진을 붙일 때만, 내가 직접 누를 때 열려요. 기록되는 건 내가 직접 탭한 것과 매니저가 남긴 관찰뿐이에요. 매장 매출 KPI는 매니저 화면에만 있어요.
            </p>
          </div>
          <div className="h-px bg-ink-950/6" />
          <CameraPermissionStatus />
          <div className="h-px bg-ink-950/6" />
          <div className="flex items-center justify-between text-xs text-ink-950/50">
            <span className="inline-flex items-center gap-1.5">
              <Database size={12} /> 저장 위치
            </span>
            <Badge tone={repoMode === 'supabase' ? 'emerald' : 'amber'}>{repoMode === 'supabase' ? 'Supabase (서버)' : '이 기기 (오프라인)'}</Badge>
          </div>
          <SecondaryButton onClick={reload} className="flex items-center justify-center gap-1.5">
            <RefreshCw size={14} /> 데이터 새로고침
          </SecondaryButton>
          {repoMode === 'local' &&
            user.is_demo &&
            (confirmReset ? (
              <div className="rounded-xl bg-rose-signal/8 border border-rose-signal/20 p-3 space-y-2">
                <p className="text-xs text-rose-700">데모 데이터를 초기 상태로 되돌려요. 이 기기에서 만든 계정과 기록이 모두 사라져요.</p>
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

      <SecondaryButton
        onClick={() => void signOut()}
        className="flex items-center justify-center gap-1.5"
      >
        <LogOut size={14} /> 로그아웃
      </SecondaryButton>
      <button
        onClick={() => {
          storage.remove('bellatrix.onboarded')
          void signOut()
        }}
        className="w-full text-xs text-ink-950/40 py-1"
      >
        로그아웃하고 앱 소개부터 다시 보기
      </button>
      <p className="text-center text-[10px] text-ink-950/25">ShyftStarter by Bellatrix · Shift Companion</p>
    </div>
  )
}
