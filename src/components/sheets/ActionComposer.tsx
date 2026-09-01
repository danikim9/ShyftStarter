import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useAppState } from '../../lib/store'
import { generateQuickActions } from '../../lib/aiEngine'
import { PrimaryButton, SecondaryButton, Card } from '../ui'

export function ActionComposer() {
  const { addAction, closeSheet } = useAppState()
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [suggestions, setSuggestions] = useState<string[] | null>(null)

  const handleGenerate = () => {
    if (!prompt.trim()) return
    setSuggestions(generateQuickActions(prompt))
  }

  const addAndClose = (t: string) => {
    addAction({ title: t, kind: 'checklist', target: 1 })
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-0.5 rounded-full bg-white/6 p-1">
        <button
          onClick={() => setMode('manual')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${mode === 'manual' ? 'bg-white text-ink-950' : 'text-white/50'}`}
        >
          직접 만들기
        </button>
        <button
          onClick={() => setMode('ai')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1 ${mode === 'ai' ? 'bg-white text-ink-950' : 'text-white/50'}`}
        >
          <Sparkles size={12} /> AI에게 부탁하기
        </button>
      </div>

      {mode === 'manual' ? (
        <div className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 오픈 전 카운터 정리"
            className="w-full rounded-xl bg-white/6 border border-white/10 px-3.5 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-400/50"
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
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-white/50 leading-relaxed">
            오늘 뭘 해야 할지 짧게 써보세요 — AI가 5초짜리 체크리스트 3개를 만들어줘요.
          </p>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: 오늘 마감할 때 해야 할 일 만들어줘"
            className="w-full rounded-xl bg-white/6 border border-white/10 px-3.5 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-400/50"
            autoFocus
          />
          <SecondaryButton disabled={!prompt.trim()} onClick={handleGenerate}>
            만들어줘
          </SecondaryButton>

          {suggestions && (
            <Card className="space-y-2.5">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-white/85">{s}</span>
                  <button
                    onClick={() => addAndClose(s)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/10 text-white/80 shrink-0"
                  >
                    추가
                  </button>
                </div>
              ))}
              <button onClick={closeSheet} className="text-[11px] text-white/35 pt-1">
                모두 추가했어요, 닫기
              </button>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
