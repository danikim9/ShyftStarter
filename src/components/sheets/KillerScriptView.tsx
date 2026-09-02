import { useMemo, useState } from 'react'
import type { SkillId } from '../../types'
import { getKillerScripts } from '../../data/mockData'
import { SKILLS } from '../../data/skills'
import { PrimaryButton, SecondaryButton, Badge } from '../ui'
import { useAppState } from '../../lib/store'

export function KillerScriptView({ skillId }: { skillId: SkillId }) {
  const variants = useMemo(() => getKillerScripts(skillId), [skillId])
  const [idx, setIdx] = useState(0)
  const script = variants[idx]
  const { showToast } = useAppState()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge tone="brand">{SKILLS[skillId].nameKo}</Badge>
          <span className="text-xs text-white/40">{script.situationLabel}</span>
        </div>
        {variants.length > 1 && (
          <span className="text-[11px] text-white/30 tabular-nums">
            {idx + 1} / {variants.length}
          </span>
        )}
      </div>

      <div className="rounded-2xl bg-rose-950/20 border border-rose-500/20 p-4">
        <div className="text-[11px] font-semibold text-rose-300/80 mb-1.5 tracking-wide">{script.beforeLabel}</div>
        <p className="text-white/70 text-[15px]">{script.beforeLine}</p>
      </div>

      <div className="rounded-2xl bg-brand-600/25 border border-brand-400/30 p-4">
        <div className="text-[11px] font-semibold text-brand-200 mb-1.5 tracking-wide">TRY THIS INSTEAD</div>
        <p className="text-white text-[16px] font-medium leading-snug">{script.afterLine}</p>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="text-[11px] font-semibold text-white/45 mb-1.5 tracking-wide">FOLLOW-UP</div>
        <p className="text-white/75 text-[15px]">{script.followUpLine}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <SecondaryButton onClick={() => showToast('연습 모드는 P1에서 제공돼요')}>PRACTICE</SecondaryButton>
        <SecondaryButton onClick={() => setIdx((i) => (i + 1) % variants.length)}>SHOW ANOTHER</SecondaryButton>
      </div>
      <PrimaryButton onClick={() => showToast('이 스크립트를 사용했어요 — 다음 응대에 적용해보세요')}>USE THIS</PrimaryButton>
    </div>
  )
}
