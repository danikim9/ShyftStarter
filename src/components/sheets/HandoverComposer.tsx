import { useState } from 'react'
import { useAppState } from '../../lib/store'
import { PrimaryButton } from '../ui'

export function HandoverComposer() {
  const { addHandover, closeSheet } = useAppState()
  const [text, setText] = useState('')

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/50 leading-relaxed">
        다음 근무자에게 남길 메모예요. 재고 이슈, 특이 고객, 아직 못 끝낸 일처럼 짧고 구체적인 내용이 좋아요.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="예: POS 2번기 영수증 용지 부족해요. 여분은 창고 하단 서랍에 있습니다."
        rows={5}
        className="w-full rounded-xl bg-white/6 border border-white/10 px-3.5 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-400/50 resize-none"
        autoFocus
      />
      <PrimaryButton
        disabled={!text.trim()}
        onClick={() => {
          addHandover(text)
          closeSheet()
        }}
      >
        인수인계 남기기
      </PrimaryButton>
    </div>
  )
}
