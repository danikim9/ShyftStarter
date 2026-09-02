import { useState } from 'react'
import { Pin, MessageCircle, Plus, Megaphone, Users, Copy, Check } from 'lucide-react'
import { useAppState } from '../lib/store'
import type { FeedItem } from '../types'
import { Card, Badge, PrimaryButton, SecondaryButton } from '../components/ui'
import { JoinTeamForm } from '../auth/JoinTeamForm'

const QUICK_REACTIONS = ['👍', '🙌', '❤️']

function fmtTime(iso: string) {
  const dt = new Date(iso)
  const diffMin = Math.round((Date.now() - dt.getTime()) / 60000)
  if (diffMin < 60) return `${Math.max(diffMin, 1)}분 전`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}시간 전`
  return `${dt.getMonth() + 1}.${dt.getDate()}`
}

// 19차 — 공지 작성 권한이 팀원 전체로 열리면서, 매니저가 남긴 공지와 동료가
// 남긴 공지를 시각적으로 구분해야 한다. 매니저 공지는 앰버 톤 + 확성기
// 아이콘 + "관리자 공지" 배지로, 동료 공지는 기존 브랜드 톤 아바타(이니셜)로
// 구분한다 — 권위 있는 공지라는 신호를 주되 위계적으로 느껴지지 않게.
function AnnouncementCard({ item }: { item: Extract<FeedItem, { type: 'announcement' }> }) {
  const { toggleReaction, addComment, employee } = useAppState()
  const a = item.data
  const isManager = a.authorRole === 'manager'
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)

  return (
    <Card className={a.pinned ? 'bg-brand-600/10 border-brand-400/25' : ''}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${
              isManager ? 'bg-amber-signal/80' : 'bg-brand-500'
            }`}
          >
            {isManager ? <Megaphone size={13} /> : a.authorName[0]}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white">{a.authorName}</span>
              {isManager && <Badge tone="amber">관리자 공지</Badge>}
            </div>
            <div className="text-[10px] text-white/35">
              {isManager ? '매니저' : '팀원'} · {fmtTime(a.createdAt)}
            </div>
          </div>
        </div>
        {a.pinned && <Pin size={13} className="text-brand-300 shrink-0" />}
      </div>
      <p className="text-sm text-white/85 leading-relaxed mb-3">{a.message}</p>

      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_REACTIONS.map((emoji) => {
          const r = a.reactions.find((x) => x.emoji === emoji)
          const mine = r?.employeeIds.includes(employee.id)
          return (
            <button
              key={emoji}
              onClick={() => toggleReaction(a.id, emoji)}
              className={`text-xs px-2 py-1 rounded-full border transition ${
                mine ? 'bg-brand-500/20 border-brand-400/40' : 'bg-white/4 border-white/8'
              }`}
            >
              {emoji} {r?.employeeIds.length ?? ''}
            </button>
          )
        })}
        <button
          onClick={() => setShowComments((v) => !v)}
          className="text-xs px-2 py-1 rounded-full bg-white/4 border border-white/8 text-white/50 flex items-center gap-1"
        >
          <MessageCircle size={11} /> {a.comments.length}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-white/8 space-y-2.5">
          {a.comments.map((c) => (
            <div key={c.id} className="text-xs">
              <span className="text-white/85 font-medium">{c.employeeName}</span>{' '}
              <span className="text-white/55">{c.message}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글 달기..."
              className="flex-1 rounded-lg bg-white/6 border border-white/10 px-3 py-1.5 text-xs text-white placeholder:text-white/25 outline-none focus:border-brand-400/50"
            />
            <button
              onClick={() => {
                addComment(a.id, commentText)
                setCommentText('')
              }}
              disabled={!commentText.trim()}
              className="text-[11px] font-semibold text-brand-300 disabled:text-white/20 shrink-0"
            >
              등록
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}

function HandoverCard({ item }: { item: Extract<FeedItem, { type: 'handover' }> }) {
  const h = item.data
  return (
    <Card>
      <div className="flex items-start gap-2.5">
        <span className="w-7 h-7 rounded-full bg-emerald-signal flex items-center justify-center text-[11px] font-bold text-white shrink-0">
          {h.fromEmployeeName[0]}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-semibold text-white">{h.fromEmployeeName}</span>
            <Badge tone="emerald">인수인계</Badge>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">{h.message}</p>
          <div className="text-[10px] text-white/35 mt-1">{fmtTime(h.createdAt)}</div>
        </div>
      </div>
    </Card>
  )
}

// 19차 — 처음 로그인 후 매장/그룹 코드를 입력하던 별도 온보딩 화면(App.tsx의
// 'join' 스테이지)을 없애고, 그 내용을 Team 탭 안으로 그대로 옮겼다. 코드가
// 없는 사람은 바로 아래 "동료 그룹 만들기"로 스스로 그룹을 시작할 수 있다.
function OnboardingJoinSection() {
  const { createCrew } = useAppState()
  return (
    <Card className="text-center py-7 space-y-4">
      <div>
        <div className="w-12 h-12 rounded-2xl bg-white/8 flex items-center justify-center mx-auto text-xl mb-3">🏬</div>
        <p className="text-sm font-semibold text-white/85 mb-1">근무하는 매장에 참여해보세요</p>
        <p className="text-xs text-white/40 leading-relaxed">
          매니저나 동료가 공유한 코드가 있다면
          <br />
          지금 입력하고 팀 공지·인수인계를 바로 받아보세요
        </p>
      </div>
      <div className="text-left">
        <JoinTeamForm onSuccess={() => {}} />
      </div>
      <div className="flex items-center gap-2 text-white/20 text-[10px]">
        <div className="h-px flex-1 bg-white/8" />
        또는
        <div className="h-px flex-1 bg-white/8" />
      </div>
      <SecondaryButton onClick={() => createCrew()}>동료 그룹 만들기</SecondaryButton>
    </Card>
  )
}

// §9-1 — 동료 그룹(crew)만으로는 공지·인수인계 피드가 열리지 않는다(그건
// 여전히 매니저가 매장을 개설해야 열리는 Team 티어 가치). 그렇다고 "아직
// 참여한 팀이 없어요"라고 하면 부정확하니, 동료 그룹에는 있지만 이 기능은
// 아직이라는 걸 정직하게 설명하는 별도 프롬프트. 19차부터는 동료 그룹 코드
// 카드도 여기(Team 탭)에 함께 보여준다 — 예전엔 근무 일정 시트에 있었다.
function CrewFeedPrompt() {
  const { openSheet, crewCode, showToast } = useAppState()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!crewCode) return
    try {
      await navigator.clipboard.writeText(crewCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      showToast('동료 그룹 코드를 복사했어요')
    } catch {
      showToast('복사에 실패했어요 — 직접 선택해 복사해주세요')
    }
  }

  return (
    <div className="space-y-3">
      {crewCode && (
        <Card className="flex items-center gap-3 bg-white/[0.03]">
          <Users size={16} className="text-brand-300 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/70 font-medium">동료 그룹 코드</p>
            <p className="text-[11px] text-white/35 font-mono tracking-wide mt-0.5">{crewCode}</p>
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 w-8 h-8 rounded-lg bg-white/6 border border-white/10 flex items-center justify-center text-white/60 hover:text-white/90 transition"
            aria-label="동료 그룹 코드 복사"
          >
            {copied ? <Check size={13} className="text-emerald-signal" /> : <Copy size={13} />}
          </button>
        </Card>
      )}
      <Card className="text-center py-8 space-y-3">
        <div className="w-11 h-11 rounded-full bg-white/6 flex items-center justify-center mx-auto text-white/50">
          <Users size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white/85 mb-1">동료 그룹에 참여 중이에요</p>
          <p className="text-xs text-white/40 leading-relaxed">
            공지·인수인계는 매니저가 매장을 개설하면 열려요
            <br />
            지금은 근무 일정 공유와 근무 교대까지 무료로 쓸 수 있어요
          </p>
        </div>
        <PrimaryButton onClick={() => openSheet({ kind: 'joinTeam' })} className="max-w-[200px] mx-auto">
          매장 코드로 참여하기
        </PrimaryButton>
      </Card>
    </div>
  )
}

export function TeamFeed() {
  const { announcements, handovers, openSheet, membership } = useAppState()

  const feed: FeedItem[] = [
    ...announcements.map((a) => ({ type: 'announcement' as const, data: a })),
    ...handovers.map((h) => ({ type: 'handover' as const, data: h })),
  ].sort((a, b) => {
    const aPinned = a.type === 'announcement' && a.data.pinned
    const bPinned = b.type === 'announcement' && b.data.pinned
    if (aPinned !== bPinned) return aPinned ? -1 : 1
    return new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
  })

  return (
    <div className="px-4 pt-5 pb-8 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Team</h1>
          <p className="text-xs text-white/40">공지 + 인수인계만 모아둔 곳이에요 — 자유 채팅방은 아니에요.</p>
        </div>
        {membership === 'store' && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => openSheet({ kind: 'announcementCompose' })}
              className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-white/70"
              aria-label="공지 작성"
            >
              <Megaphone size={16} />
            </button>
            <button
              onClick={() => openSheet({ kind: 'handoverCompose' })}
              className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-white/70"
              aria-label="인수인계 추가"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      {membership === 'store' ? (
        <div className="space-y-3">
          {feed.map((item) =>
            item.type === 'announcement' ? (
              <AnnouncementCard key={item.data.id} item={item} />
            ) : (
              <HandoverCard key={item.data.id} item={item} />
            )
          )}
        </div>
      ) : membership === 'crew' ? (
        <CrewFeedPrompt />
      ) : (
        <OnboardingJoinSection />
      )}
    </div>
  )
}
