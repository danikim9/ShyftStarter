import { useState } from 'react'
import { Pin, MessageCircle, Plus, Megaphone, Users, Copy, Check, Share2, ChevronDown, ChevronUp, History } from 'lucide-react'
import { useAppState } from '../lib/store'
import type { FeedItem } from '../types'
import { Card, Badge, PrimaryButton } from '../components/ui'
import { JoinTeamForm } from '../auth/JoinTeamForm'
import { buildStoreJoinLink } from '../data/mvpData'

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
function AnnouncementCard({
  item,
  onAck,
}: {
  item: Extract<FeedItem, { type: 'announcement' }>
  onAck?: () => void
}) {
  const { toggleReaction, addComment, employee } = useAppState()
  const a = item.data
  const isManager = a.authorRole === 'manager'
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)

  return (
    // 32차 — 이 카드가 렌더되는 순간(매장 코드로 참여한 뒤 Team 피드)이
    // 사용자가 실기기에서 "화면이 확대된다"고 짚어준 정확한 재현 지점이라,
    // 실기기 폰트 렌더링이 이 카드 안 콘텐츠(배지+이름 줄)를 이 환경에서
    // 테스트한 것보다 넓게 그리더라도 카드 밖으로 새어나가 화면을 밀어
    // 넓히지 않도록 `overflow-hidden`을 추가하고, 이름+배지 줄에는
    // `min-w-0`(플렉스 기본값인 min-width:auto를 풀어 필요시 줄어들 수 있게)과
    // `flex-wrap`(공간이 부족하면 배지가 다음 줄로 넘어가게)을 함께 줬다.
    <Card className={`overflow-hidden ${a.pinned ? 'bg-brand-600/10 border-brand-400/25' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${
              isManager ? 'bg-amber-signal/80' : 'bg-brand-500'
            }`}
          >
            {isManager ? <Megaphone size={13} /> : a.authorName[0]}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-ink-950">{a.authorName}</span>
              {isManager && <Badge tone="amber">관리자 공지</Badge>}
            </div>
            <div className="text-[10px] text-ink-950/35">
              {isManager ? '매니저' : '팀원'} · {fmtTime(a.createdAt)}
            </div>
          </div>
        </div>
        {a.pinned && <Pin size={13} className="text-brand-600 shrink-0" />}
      </div>
      <p className="text-sm text-ink-950/85 leading-relaxed mb-3">{a.message}</p>

      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_REACTIONS.map((emoji) => {
          const r = a.reactions.find((x) => x.emoji === emoji)
          const mine = r?.employeeIds.includes(employee.id)
          return (
            <button
              key={emoji}
              onClick={() => toggleReaction(a.id, emoji)}
              className={`text-xs px-2 py-1 rounded-full border transition ${
                mine ? 'bg-brand-500/20 border-brand-400/40' : 'bg-ink-950/4 border-ink-950/8'
              }`}
            >
              {emoji} {r?.employeeIds.length ?? ''}
            </button>
          )
        })}
        <button
          onClick={() => setShowComments((v) => !v)}
          className="text-xs px-2 py-1 rounded-full bg-ink-950/4 border border-ink-950/8 text-ink-950/50 flex items-center gap-1"
        >
          <MessageCircle size={11} /> {a.comments.length}
        </button>
        {onAck && (
          <button
            onClick={onAck}
            className="ml-auto text-[11px] px-2.5 py-1 rounded-full bg-emerald-signal/12 border border-emerald-signal/25 text-emerald-600 font-medium flex items-center gap-1"
          >
            <Check size={12} /> 확인했어요
          </button>
        )}
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-ink-950/8 space-y-2.5">
          {a.comments.map((c) => (
            <div key={c.id} className="text-xs">
              <span className="text-ink-950/85 font-medium">{c.employeeName}</span>{' '}
              <span className="text-ink-950/55">{c.message}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글 달기..."
              className="flex-1 rounded-lg bg-ink-950/6 border border-ink-950/10 px-3 py-1.5 text-xs text-ink-950 placeholder:text-ink-950/25 outline-none focus:border-brand-400/50"
            />
            <button
              onClick={() => {
                addComment(a.id, commentText)
                setCommentText('')
              }}
              disabled={!commentText.trim()}
              className="text-[11px] font-semibold text-brand-600 disabled:text-ink-950/20 shrink-0"
            >
              등록
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}

function HandoverCard({
  item,
  onAck,
}: {
  item: Extract<FeedItem, { type: 'handover' }>
  onAck?: () => void
}) {
  const h = item.data
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-2.5">
        <span className="w-7 h-7 rounded-full bg-emerald-signal flex items-center justify-center text-[11px] font-bold text-white shrink-0">
          {h.fromEmployeeName[0]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-xs font-semibold text-ink-950">{h.fromEmployeeName}</span>
            <Badge tone="emerald">인수인계</Badge>
          </div>
          <p className="text-sm text-ink-950/80 leading-relaxed">{h.message}</p>
          <div className="flex items-center justify-between mt-1.5">
            <div className="text-[10px] text-ink-950/35">{fmtTime(h.createdAt)}</div>
            {onAck && (
              <button
                onClick={onAck}
                className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-signal/12 border border-emerald-signal/25 text-emerald-600 font-medium flex items-center gap-1"
              >
                <Check size={12} /> 확인했어요
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// 19차 — 처음 로그인 후 매장/그룹 코드를 입력하던 별도 온보딩 화면(App.tsx의
// 'join' 스테이지)을 없애고, 그 내용을 Team 탭 안으로 그대로 옮겼다.
// 21차 — 솔로 UX 리뷰 피드백 #3: 코드 입력 폼이 1순위로 보이면, 정말 처음
// 앱을 깐 사람(코드가 없는 쪽이 훨씬 흔함) 입장에서 "나는 코드가 없는데
// 어떡하지" 하고 막힐 수 있다는 지적을 반영해 순서를 뒤집었다 — "동료 그룹
// 만들기"를 1차 CTA로 올리고, 코드 입력은 "코드가 있다면" 보조 옵션으로
// 내렸다.
function OnboardingJoinSection() {
  const { createCrew } = useAppState()
  return (
    <Card className="text-center py-7 space-y-4">
      <div>
        <div className="w-12 h-12 rounded-2xl bg-ink-950/8 flex items-center justify-center mx-auto text-xl mb-3">🏬</div>
        <p className="text-sm font-semibold text-ink-950/85 mb-1">동료들과 함께 시작해보세요</p>
        <p className="text-xs text-ink-950/40 leading-relaxed">
          코드가 없어도 괜찮아요 — 지금 바로 동료 그룹을 만들고
          <br />
          근무 일정을 함께 공유할 수 있어요
        </p>
      </div>
      <PrimaryButton onClick={() => createCrew()}>동료 그룹 만들기</PrimaryButton>
      <div className="flex items-center gap-2 text-ink-950/20 text-[10px]">
        <div className="h-px flex-1 bg-ink-950/8" />
        코드가 있다면
        <div className="h-px flex-1 bg-ink-950/8" />
      </div>
      <div className="text-left">
        <JoinTeamForm onSuccess={() => {}} />
      </div>
    </Card>
  )
}

// §9-1 — 동료 그룹(crew)만으로는 공지·인수인계 피드가 열리지 않는다(그건
// 여전히 매니저가 매장을 개설해야 열리는 Team 티어 가치). 그렇다고 "아직
// 참여한 팀이 없어요"라고 하면 부정확하니, 동료 그룹에는 있지만 이 기능은
// 아직이라는 걸 정직하게 설명하는 별도 프롬프트. 19차부터는 동료 그룹 코드
// 카드도 여기(Team 탭)에 함께 보여준다 — 예전엔 근무 일정 시트에 있었다.
// 21차 — 솔로 UX 리뷰 피드백: 그룹을 막 만든 직후엔 코드 카드만 덩그러니
// 있어서 "이제 뭘 하지" 하는 정지 지점이 생길 수 있다는 지적을 반영해,
// 복사 아이콘 옆에 바로 공유할 수 있는 명확한 CTA를 추가했다 — Web Share
// API가 있으면 기기의 공유 시트(카카오톡 포함 설치된 앱 목록)를 그대로
// 띄우고, 지원하지 않는 환경(대부분의 데스크톱 브라우저)이면 복사로 대체한다.
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

  const handleShare = async () => {
    if (!crewCode) return
    const shareData = {
      title: 'ShyftStarter 동료 그룹 초대',
      text: `ShyftStarter 동료 그룹에 참여해보세요 — 코드: ${crewCode}`,
      url: buildStoreJoinLink(crewCode),
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // 사용자가 공유를 취소했거나 API를 지원하지 않음 — 복사로 대체
      }
    }
    handleCopy()
  }

  return (
    <div className="space-y-3">
      {crewCode && (
        <Card className="space-y-3 bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <Users size={16} className="text-brand-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-950/70 font-medium">동료 그룹 코드</p>
              <p className="text-[11px] text-ink-950/35 font-mono tracking-wide mt-0.5">{crewCode}</p>
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 w-8 h-8 rounded-lg bg-ink-950/6 border border-ink-950/10 flex items-center justify-center text-ink-950/60 hover:text-ink-950/90 transition"
              aria-label="동료 그룹 코드 복사"
            >
              {copied ? <Check size={13} className="text-emerald-signal" /> : <Copy size={13} />}
            </button>
          </div>
          <PrimaryButton onClick={handleShare} className="flex items-center justify-center gap-1.5">
            <Share2 size={14} /> 동료에게 지금 공유하기
          </PrimaryButton>
        </Card>
      )}
      <Card className="text-center py-8 space-y-3">
        <div className="w-11 h-11 rounded-full bg-ink-950/6 flex items-center justify-center mx-auto text-ink-950/50">
          <Users size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-950/85 mb-1">동료 그룹에 참여 중이에요</p>
          <p className="text-xs text-ink-950/40 leading-relaxed">
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

// 22차 — 솔로 UX 피드백 #4: 공지/인수인계를 "확인" 처리하면 메인 피드에서
// 빠지고, 접혀 있는 히스토리 섹션에서만 다시 볼 수 있다. 확인 여부는
// AppStateProvider의 readFeedIds에 저장돼 탭을 오가도 유지된다.
function HistorySection({ items }: { items: FeedItem[] }) {
  const [open, setOpen] = useState(false)
  if (items.length === 0) return null
  return (
    <div className="pt-1">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-950/30 uppercase tracking-wide">
          <History size={12} /> 히스토리 {items.length}건
        </div>
        {open ? <ChevronUp size={14} className="text-ink-950/30" /> : <ChevronDown size={14} className="text-ink-950/30" />}
      </button>
      {open && (
        <div className="space-y-3 opacity-70">
          {items.map((item) =>
            item.type === 'announcement' ? (
              <AnnouncementCard key={item.data.id} item={item} />
            ) : (
              <HandoverCard key={item.data.id} item={item} />
            )
          )}
        </div>
      )}
    </div>
  )
}

export function TeamFeed() {
  const { announcements, handovers, openSheet, membership, readFeedIds, acknowledgeFeedItem } = useAppState()

  const allFeed: FeedItem[] = [
    ...announcements.map((a) => ({ type: 'announcement' as const, data: a })),
    ...handovers.map((h) => ({ type: 'handover' as const, data: h })),
  ].sort((a, b) => {
    const aPinned = a.type === 'announcement' && a.data.pinned
    const bPinned = b.type === 'announcement' && b.data.pinned
    if (aPinned !== bPinned) return aPinned ? -1 : 1
    return new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
  })
  const feed = allFeed.filter((item) => !readFeedIds.includes(item.data.id))
  const historyFeed = allFeed.filter((item) => readFeedIds.includes(item.data.id))

  return (
    <div className="px-4 pt-5 pb-8 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-950 mb-1">Team</h1>
          <p className="text-xs text-ink-950/40">공지 + 인수인계만 모아둔 곳이에요 — 자유 채팅방은 아니에요.</p>
        </div>
        {membership === 'store' && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => openSheet({ kind: 'announcementCompose' })}
              className="w-9 h-9 rounded-full bg-ink-950/8 flex items-center justify-center text-ink-950/70"
              aria-label="공지 작성"
            >
              <Megaphone size={16} />
            </button>
            <button
              onClick={() => openSheet({ kind: 'handoverCompose' })}
              className="w-9 h-9 rounded-full bg-ink-950/8 flex items-center justify-center text-ink-950/70"
              aria-label="인수인계 추가"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      {membership === 'store' ? (
        <div className="space-y-3">
          {feed.length === 0 && historyFeed.length > 0 && (
            <p className="text-xs text-ink-950/35 text-center py-4">새로운 공지·인수인계가 없어요. 확인한 내용은 히스토리에 있어요.</p>
          )}
          {feed.map((item) =>
            item.type === 'announcement' ? (
              <AnnouncementCard key={item.data.id} item={item} onAck={() => acknowledgeFeedItem(item.data.id)} />
            ) : (
              <HandoverCard key={item.data.id} item={item} onAck={() => acknowledgeFeedItem(item.data.id)} />
            )
          )}
          <HistorySection items={historyFeed} />
        </div>
      ) : membership === 'crew' ? (
        <CrewFeedPrompt />
      ) : (
        <OnboardingJoinSection />
      )}
    </div>
  )
}
