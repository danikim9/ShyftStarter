import { useState } from 'react'
import { Pin, MessageCircle, Plus } from 'lucide-react'
import { useAppState } from '../lib/store'
import type { FeedItem } from '../types'
import { Card, Badge } from '../components/ui'

const QUICK_REACTIONS = ['👍', '🙌', '❤️']

function fmtTime(iso: string) {
  const dt = new Date(iso)
  const diffMin = Math.round((Date.now() - dt.getTime()) / 60000)
  if (diffMin < 60) return `${Math.max(diffMin, 1)}분 전`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}시간 전`
  return `${dt.getMonth() + 1}.${dt.getDate()}`
}

function AnnouncementCard({ item }: { item: Extract<FeedItem, { type: 'announcement' }> }) {
  const { toggleReaction, addComment, employee } = useAppState()
  const a = item.data
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)

  return (
    <Card className={a.pinned ? 'bg-brand-600/10 border-brand-400/25' : ''}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            {a.authorName[0]}
          </span>
          <div>
            <div className="text-xs font-semibold text-white">{a.authorName}</div>
            <div className="text-[10px] text-white/35">매니저 · {fmtTime(a.createdAt)}</div>
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

export function TeamFeed() {
  const { announcements, handovers, openSheet } = useAppState()

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
        <button
          onClick={() => openSheet({ kind: 'handoverCompose' })}
          className="shrink-0 w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-white/70"
          aria-label="인수인계 추가"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {feed.map((item) =>
          item.type === 'announcement' ? (
            <AnnouncementCard key={item.data.id} item={item} />
          ) : (
            <HandoverCard key={item.data.id} item={item} />
          )
        )}
      </div>
    </div>
  )
}
