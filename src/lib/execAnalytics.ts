// ---------------------------------------------------------------------------
// Executive Dashboard — "Behavior-to-Outcome Correlation Engine" (project brief:
// r ≈ 0.74 수준의 인과성 분석). Real math, run against the mock store dataset —
// nothing here is a hardcoded headline number; r, the regression line, and the
// top-20% uplift % are all computed from `data/execData.ts`'s STORES array.
// In production, x/y become live POS + behavior-event aggregates.
// ---------------------------------------------------------------------------

export function pearsonR(xs: number[], ys: number[]): number {
  const n = xs.length
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let denX = 0
  let denY = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }
  return num / Math.sqrt(denX * denY)
}

export function linearRegression(xs: number[], ys: number[]): { slope: number; intercept: number } {
  const n = xs.length
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY)
    den += (xs[i] - meanX) ** 2
  }
  const slope = num / den
  return { slope, intercept: meanY - slope * meanX }
}

/** Splits items by x (descending) into a top-`topPct` group and the rest, and
 * returns how much higher the top group's average y is, in percent. */
export function topGroupUplift<T>(items: T[], x: (t: T) => number, y: (t: T) => number, topPct = 0.2) {
  const sorted = [...items].sort((a, b) => x(b) - x(a))
  const nTop = Math.max(1, Math.round(sorted.length * topPct))
  const top = sorted.slice(0, nTop)
  const rest = sorted.slice(nTop)
  const avg = (arr: T[], fn: (t: T) => number) => arr.reduce((a, t) => a + fn(t), 0) / arr.length
  const topAvg = avg(top, y)
  const restAvg = avg(rest, y)
  return {
    topAvg,
    restAvg,
    upliftPct: ((topAvg - restAvg) / restAvg) * 100,
    topCount: top.length,
    topItems: top,
  }
}

/** Median split into two equal-ish halves by x, for a broader ROI comparison
 * than just the top-20% headline stat. */
export function medianSplit<T>(items: T[], x: (t: T) => number) {
  const sorted = [...items].sort((a, b) => x(b) - x(a))
  const mid = Math.ceil(sorted.length / 2)
  return { top: sorted.slice(0, mid), bottom: sorted.slice(mid) }
}
