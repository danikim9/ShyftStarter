import { useState } from 'react'
import { useAppState } from '../../lib/store'
import { PrimaryButton } from '../ui'

// 19차 — 공지 작성 권한을 팀원 전체로 확장하면서 추가한 컴포저.
// HandoverComposer와 동일한 패턴이되, 매니저 전용 상단 고정(pinned) 체크박스는
// 넣지 않는다 — 고정은 여전히 매니저의 권한(TeamActionsComposer 참고).
export function AnnouncementComposer() {
  const { addTeamPost, closeSheet } = useAppState()
  const [text, setText] = useState('')

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/50 leading-relaxed">
        팀 전체에게 보이는 공지예요. 일정 변경, 공유할 소식 등을 남겨보세요.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="예: 오늘 마감 후 재고 정리 같이 도와주실 분 계신가요?"
        rows={5}
        className="w-full rounded-xl bg-white/6 border border-white/10 px-3.5 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-400/50 resize-none"
        autoFocus
      />
      <PrimaryButton
        disabled={!text.trim()}
        onClick={() => {
          addTeamPost(text)
          closeSheet()
        }}
      >
        공지 남기기
      </PrimaryButton>
    </div>
  )
}
