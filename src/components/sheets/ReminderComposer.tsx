import { useState } from 'react'
import { useAppState } from '../../lib/store'
import { PrimaryButton } from '../ui'

export function ReminderComposer() {
  const { addReminder, closeSheet } = useAppState()
  const [label, setLabel] = useState('')
  const [time, setTime] = useState('18:00')

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-950/50 leading-relaxed">
        오늘 몇 시에, 뭘 리마인드 받고 싶은지 적어주세요 — 이 탭이 열려 있는 동안 그 시각에 알려드려요.
      </p>
      <div>
        <label className="block text-[11px] font-semibold text-ink-950/40 tracking-wide mb-1.5">리마인더 내용</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="예: 마감 전 재고 카운트하기"
          className="w-full rounded-xl bg-ink-950/6 border border-ink-950/10 px-3.5 py-3 text-sm text-ink-950 placeholder:text-ink-950/25 outline-none focus:border-brand-400/50"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-ink-950/40 tracking-wide mb-1.5">시각</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full rounded-xl bg-ink-950/6 border border-ink-950/10 px-3.5 py-3 text-sm text-ink-950 outline-none focus:border-brand-400/50"
        />
      </div>
      <PrimaryButton
        disabled={!label.trim()}
        onClick={() => {
          addReminder({ label, time })
          closeSheet()
        }}
      >
        리마인더 추가하기
      </PrimaryButton>
    </div>
  )
}
