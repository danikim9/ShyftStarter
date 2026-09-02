import { useMemo, useState } from 'react'
import { useAppState } from '../../lib/store'
import { pickFocusSkill, scoreRolePlayResponse } from '../../lib/aiEngine'
import { ROLE_PLAY_SCENARIOS } from '../../data/learningContent'
import { SKILLS } from '../../data/skills'
import type { RolePlayResult } from '../../types'
import { Card, Badge, PrimaryButton, SecondaryButton, ProgressBar } from '../ui'

const AXIS_LABEL: Record<keyof RolePlayResult['axes'], string> = {
  empathy: '공감',
  structure: '응답 구조',
  valueComm: '가치 전달',
  objection: '이의 처리',
  closing: '클로징',
}

export function RolePlayView() {
  const { employee, showToast } = useAppState()
  const scenario = useMemo(() => ROLE_PLAY_SCENARIOS[pickFocusSkill(employee.skills)], [employee])
  const meta = SKILLS[scenario.skillId]

  const [response, setResponse] = useState('')
  const [result, setResult] = useState<RolePlayResult | null>(null)

  const submit = () => {
    if (!response.trim()) return
    setResult(scoreRolePlayResponse(response))
  }

  const reset = () => {
    setResponse('')
    setResult(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge tone="brand">{meta.nameKo}</Badge>
        <span className="text-xs text-ink-950/40">{scenario.title}</span>
      </div>

      <div className="flex gap-2 items-start">
        <span className="shrink-0 w-7 h-7 rounded-full bg-ink-950/10 flex items-center justify-center text-sm">🧑</span>
        <div className="rounded-2xl rounded-tl-sm bg-ink-950/8 px-3.5 py-2.5 text-sm text-ink-950/85 leading-relaxed max-w-[85%]">
          {scenario.customerLine}
        </div>
      </div>

      {!result ? (
        <>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="어떻게 답변하시겠어요? 실제로 말하듯 적어보세요."
            rows={4}
            className="w-full rounded-xl bg-ink-950/6 border border-ink-950/10 px-3.5 py-3 text-[16px] text-ink-950 placeholder:text-ink-950/25 outline-none focus:border-brand-400/50 transition resize-none"
          />
          <PrimaryButton onClick={submit} disabled={!response.trim()}>
            제출하고 AI 평가받기
          </PrimaryButton>
          <p className="text-[11px] text-ink-950/30 text-center leading-relaxed">
            텍스트 기반 연습이에요. 음성 녹음·음성 캡처는 사용하지 않아요.
          </p>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 items-start justify-end">
            <div className="rounded-2xl rounded-tr-sm bg-brand-600/40 px-3.5 py-2.5 text-sm text-ink-950 leading-relaxed max-w-[85%]">
              {response}
            </div>
          </div>

          <Card className="text-center">
            <div className="text-[11px] font-semibold text-ink-950/40 tracking-wide mb-1">SCORE</div>
            <div className="text-4xl font-bold text-ink-950 tabular-nums">{result.overall}</div>
          </Card>

          <Card className="space-y-3">
            {(Object.keys(result.axes) as (keyof RolePlayResult['axes'])[]).map((axis) => (
              <div key={axis}>
                <div className="flex justify-between text-xs text-ink-950/55 mb-1">
                  <span>{AXIS_LABEL[axis]}</span>
                  <span className="tabular-nums">{result.axes[axis]}</span>
                </div>
                <ProgressBar value={result.axes[axis]} max={100} />
              </div>
            ))}
          </Card>

          <Card className="bg-amber-signal/8 border-amber-signal/25">
            <div className="text-[11px] font-semibold text-amber-600/90 tracking-wide mb-1">TIP</div>
            <p className="text-sm text-amber-50/90 leading-relaxed">{result.tip}</p>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <SecondaryButton onClick={reset}>TRY AGAIN</SecondaryButton>
            <PrimaryButton onClick={() => showToast('롤플레이 결과가 기록됐어요 · +25 XP')}>완료</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  )
}
