import { Sparkles } from 'lucide-react'
import { STORES, BRAND_ALIGNMENT } from '../data/execData'
import { pearsonR, topGroupUplift, medianSplit } from '../lib/execAnalytics'
import { Card, SectionLabel, ProgressBar } from '../components/ui'
import { CorrelationChart } from './components/CorrelationChart'

function fmtAtv(v: number) {
  return `₩${Math.round(v / 1000).toLocaleString()}k`
}

export function RoiAnalysis() {
  const r = pearsonR(STORES.map((s) => s.checklistCompletionRate), STORES.map((s) => s.atv))
  const uplift = topGroupUplift(STORES, (s) => s.checklistCompletionRate, (s) => s.atv, 0.2)

  const coachingR = pearsonR(STORES.map((s) => s.coachingSessionsPerEmployee), STORES.map((s) => s.capabilityScore))
  const trainingSplit = medianSplit(STORES, (s) => s.trainingCompletionRate)
  const avgOf = (arr: typeof STORES, fn: (s: (typeof STORES)[number]) => number) =>
    Math.round((arr.reduce((a, s) => a + fn(s), 0) / arr.length) * 10) / 10

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">KPI Correlation &amp; ROI</h1>
        <p className="text-white/40 text-sm max-w-2xl leading-relaxed">
          현장 행동 데이터(체크리스트 이수율)를 실제 POS 매출 지표(ATV)에 매핑한 Behavior-to-Outcome
          Correlation Engine이에요. 코칭·트레이닝 지출을 "비용"이 아니라 "측정 가능한 매출 창출 엔진"으로
          증명하는 화면이에요.
        </p>
      </div>

      {/* The Smoking Gun */}
      <div>
        <SectionLabel>THE SMOKING GUN — 체크리스트 이수율 vs ATV</SectionLabel>
        <Card className="bg-gradient-to-br from-brand-600/15 to-transparent border-brand-400/20">
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-3xl font-bold text-white tabular-nums">r = {r.toFixed(2)}</div>
              <div className="text-[11px] text-white/40 mt-0.5">이수율 ↔ ATV 상관계수</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-300 tabular-nums">+{uplift.upliftPct.toFixed(1)}%</div>
              <div className="text-[11px] text-white/40 mt-0.5">
                이수율 상위 20% 매장({uplift.topCount}개)의 평균 ATV가 나머지 매장보다 높아요
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white tabular-nums">{fmtAtv(uplift.topAvg)}</div>
              <div className="text-[11px] text-white/40 mt-0.5">상위 그룹 평균 ATV (나머지 {fmtAtv(uplift.restAvg)})</div>
            </div>
          </div>
          <CorrelationChart />
          <p className="text-xs text-white/50 leading-relaxed mt-3 pt-3 border-t border-white/10">
            각 점은 매장이에요 — 초록색은 체크리스트 이수율 상위 20% 매장. 완벽한 우상향 상관관계로,
            현장 행동(체크리스트 이수)이 높은 매장일수록 객단가가 유의미하게 높다는 것을 보여줘요.
            "교육 비용 지출"을 "측정 가능한 매출 창출 엔진"으로 전환하는 근거예요.
          </p>
        </Card>
      </div>

      {/* Training / Coaching ROI */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <SectionLabel>TRAINING ROI</SectionLabel>
          <Card>
            <p className="text-xs text-white/50 mb-3">트레이닝(마이크로러닝+Role-play) 완료율 상위/하위 매장 그룹 비교</p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span className="text-emerald-300 font-medium">상위 그룹 ({trainingSplit.top.length}개 매장)</span>
                  <span className="tabular-nums">ATV {fmtAtv(avgOf(trainingSplit.top, (s) => s.atv))} · CVR {avgOf(trainingSplit.top, (s) => s.cvr)}%</span>
                </div>
                <ProgressBar value={avgOf(trainingSplit.top, (s) => s.capabilityScore)} max={100} colorClass="bg-emerald-signal" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span className="text-white/40 font-medium">하위 그룹 ({trainingSplit.bottom.length}개 매장)</span>
                  <span className="tabular-nums">ATV {fmtAtv(avgOf(trainingSplit.bottom, (s) => s.atv))} · CVR {avgOf(trainingSplit.bottom, (s) => s.cvr)}%</span>
                </div>
                <ProgressBar value={avgOf(trainingSplit.bottom, (s) => s.capabilityScore)} max={100} colorClass="bg-white/25" />
              </div>
            </div>
          </Card>
        </div>
        <div>
          <SectionLabel>COACHING ROI</SectionLabel>
          <Card>
            <div className="flex items-start gap-2.5">
              <Sparkles size={16} className="text-amber-300 mt-0.5 shrink-0" />
              <p className="text-xs text-white/70 leading-relaxed">
                매니저 1:1 코칭 세션 빈도와 매장 평균 역량 점수의 상관계수는{' '}
                <span className="text-white font-semibold">r = {coachingR.toFixed(2)}</span>예요. 코칭 세션이
                많은 매장일수록 역량 점수가 높은 경향이 뚜렷해요 — Manager Dashboard의 1:1 코칭 가이드가
                실제로 팀 역량에 기여하고 있다는 근거로 쓸 수 있어요.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Brand Alignment */}
      <div>
        <SectionLabel>BRAND ALIGNMENT (개념 지표 · P2)</SectionLabel>
        <Card>
          <p className="text-xs text-white/45 mb-3 leading-relaxed">
            HQ가 배포한 킬러 스크립트·체크리스트를 얼마나 일관되게 따르는지를 나타내는 지표예요. 실제
            정의는 고객사 브랜드 가이드라인 온보딩 이후 확정 필요 — 지금은 체크리스트 이수율 기반의 개념
            프록시로만 표시해요.
          </p>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            {BRAND_ALIGNMENT.sort((a, b) => b.score - a.score).map((b) => (
              <div key={b.storeId} className="flex items-center gap-2.5">
                <span className="text-xs text-white/60 w-16 shrink-0">{b.storeName}</span>
                <div className="flex-1">
                  <ProgressBar value={b.score} max={100} colorClass="bg-brand-500" />
                </div>
                <span className="text-xs text-white/50 tabular-nums w-8 text-right">{b.score}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
