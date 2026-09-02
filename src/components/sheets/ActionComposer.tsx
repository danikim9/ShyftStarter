import { useState } from 'react'
import { useAppState } from '../../lib/store'
import { PrimaryButton } from '../ui'

// 25차 — "AI에게 부탁하기" 모드를 사용자 피드백에 따라 완전히 제거하고,
// 직접 입력 한 가지 방식만 남겼다. (구 AI 모드가 쓰던 generateQuickActions()는
// 다른 곳에서 쓰지 않지만 lib/aiEngine.ts에는 그대로 남아 있다 — hide, don't
// delete 원칙.)
export function ActionComposer() {
  const { addAction, closeSheet } = useAppState()
  const [title, setTitle] = useState('')

  const addAndClose = (t: string) => {
    addAction({ title: t, kind: 'checklist', target: 1 })
  }

  return (
    <div className="space-y-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="예: 오픈 전 카운터 정리"
        className="w-full rounded-xl bg-ink-950/6 border border-ink-950/10 px-3.5 py-3 text-[16px] text-ink-950 placeholder:text-ink-950/25 outline-none focus:border-brand-400/50"
        autoFocus
      />
      <PrimaryButton
        disabled={!title.trim()}
        onClick={() => {
          addAndClose(title)
          closeSheet()
        }}
      >
        할 일 추가하기
      </PrimaryButton>
    </div>
  )
}
