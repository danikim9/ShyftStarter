export function scoreTier(score: number): 'weak' | 'mid' | 'strong' {
  if (score < 65) return 'weak'
  if (score < 82) return 'mid'
  return 'strong'
}

export const TIER_BAR_COLOR: Record<ReturnType<typeof scoreTier>, string> = {
  weak: '#f26d6d',
  mid: '#f4b04a',
  strong: '#14b8a6',
}

export const TIER_TEXT_CLASS: Record<ReturnType<typeof scoreTier>, string> = {
  weak: 'text-rose-400',
  mid: 'text-amber-400',
  strong: 'text-brand-600',
}
