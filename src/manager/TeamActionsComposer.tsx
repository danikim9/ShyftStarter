import { useState } from 'react'
import { Megaphone, ListPlus, Pin, MessageCircle } from 'lucide-react'
import { useAppState } from '../lib/store'
import { Card, SectionLabel, Badge, PrimaryButton } from '../components/ui'
import { TeamInvite } from './TeamInvite'

function fmtTime(iso: string) {
  const dt = new Date(iso)
  return `${dt.getMonth() + 1}.${dt.getDate()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

export function TeamActionsComposer() {
  const { announcements, addAnnouncement, actions, addAction, showToast } = useAppState()
  const [annText, setAnnText] = useState('')
  const [annPinned, setAnnPinned] = useState(false)
  const [actionTitle, setActionTitle] = useState('')
  const [actionTarget, setActionTarget] = useState(1)

  const managerActions = actions.filter((a) => a.createdBy === 'manager')

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-ink-950 mb-1">팀 액션 · 공지</h1>
        <p className="text-ink-950/40 text-sm max-w-xl leading-relaxed">
          체크리스트/퀘스트를 팀에 배포하고, 공지를 올려요. Employee App의 Team/My Actions 탭에 바로
          반영돼요(같은 프로토타입 안에서 실시간으로 확인해보세요 — 페르소나 전환 후 확인).
        </p>
      </div>

      <TeamInvite />

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Announcement composer */}
        <div>
          <SectionLabel>공지 등록</SectionLabel>
          <Card className="space-y-3">
            <textarea
              value={annText}
              onChange={(e) => setAnnText(e.target.value)}
              placeholder="예: 오늘 POS 2번 사용하지 마세요 — 점검 중입니다."
              rows={3}
              className="w-full rounded-xl bg-ink-950/6 border border-ink-950/10 px-3.5 py-3 text-[16px] text-ink-950 placeholder:text-ink-950/25 outline-none focus:border-brand-400/50 resize-none"
            />
            <label className="flex items-center gap-2 text-xs text-ink-950/50">
              <input type="checkbox" checked={annPinned} onChange={(e) => setAnnPinned(e.target.checked)} className="accent-brand-500" />
              상단 고정
            </label>
            <PrimaryButton
              disabled={!annText.trim()}
              onClick={() => {
                addAnnouncement(annText, annPinned)
                setAnnText('')
                setAnnPinned(false)
              }}
              className="flex items-center justify-center gap-1.5"
            >
              <Megaphone size={14} /> 공지 등록
            </PrimaryButton>
          </Card>
        </div>

        {/* Action push composer */}
        <div>
          <SectionLabel>팀 액션 배포</SectionLabel>
          <Card className="space-y-3">
            <input
              value={actionTitle}
              onChange={(e) => setActionTitle(e.target.value)}
              placeholder="예: 재고 부족 상품 메모하기"
              // 33차 — iOS 자동 확대 문턱(16px) 회피
              className="w-full rounded-xl bg-ink-950/6 border border-ink-950/10 px-3.5 py-3 text-[16px] text-ink-950 placeholder:text-ink-950/25 outline-none focus:border-brand-400/50"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-950/40">목표 횟수</span>
              <input
                type="number"
                min={1}
                value={actionTarget}
                onChange={(e) => setActionTarget(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 rounded-lg bg-ink-950/6 border border-ink-950/10 px-2 py-1.5 text-[16px] text-ink-950 outline-none focus:border-brand-400/50"
              />
            </div>
            <PrimaryButton
              disabled={!actionTitle.trim()}
              onClick={() => {
                addAction({
                  title: actionTitle,
                  kind: 'quest',
                  target: actionTarget,
                  createdBy: 'manager',
                  createdByName: 'Kim M.',
                  assignedToAll: true,
                  dueLabel: '이번 시프트',
                })
                showToast('팀 전체에게 배포했어요')
                setActionTitle('')
                setActionTarget(1)
              }}
              className="flex items-center justify-center gap-1.5"
            >
              <ListPlus size={14} /> 전체 팀에게 배포
            </PrimaryButton>
          </Card>
        </div>
      </div>

      <div>
        <SectionLabel>최근 배포한 팀 액션</SectionLabel>
        <Card>
          {managerActions.length === 0 && <p className="text-xs text-ink-950/35">아직 배포한 액션이 없어요.</p>}
          {managerActions.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-ink-950/6 last:border-0">
              <span className="text-sm text-ink-950/80">{a.title}</span>
              <div className="flex items-center gap-2">
                {a.assignedToAll && <Badge tone="brand">전체 팀</Badge>}
                <span className="text-xs text-ink-950/40 tabular-nums">{a.progress}/{a.target}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div>
        <SectionLabel>최근 공지</SectionLabel>
        <Card className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 py-2 border-b border-ink-950/6 last:border-0">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {a.pinned && <Pin size={11} className="text-brand-600 shrink-0" />}
                  <p className="text-sm text-ink-950/80 truncate">{a.message}</p>
                </div>
                <div className="text-[10px] text-ink-950/35 mt-0.5">{fmtTime(a.createdAt)}</div>
              </div>
              <div className="shrink-0 flex items-center gap-1 text-[11px] text-ink-950/40">
                <MessageCircle size={11} /> {a.comments.length}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
