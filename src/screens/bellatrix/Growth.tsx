import { useEffect, useMemo } from 'react'
import { TrendingUp, ArrowUpRight, ArrowRight, ArrowDownRight, Lock, Trophy, Sparkles, Repeat, Smile, Plug, Receipt, MessageSquareText, Zap } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../lib/bellatrixStore'
import { getEmployeeBehaviourTrend, getMySales, type TrendDirection } from '../../lib/analytics/analytics'
import { formatMetric, formatPercentDelta } from '../../lib/analytics/metrics'
import { recommendNextShiftFocus } from '../../lib/analytics/recommendation'
import { addDaysISO, fmtShortDate, weekKey } from '../../lib/dates'
import { BEHAVIOUR_LABEL, CONFIDENCE_FEEL_LABEL, METRIC_SHORT } from '../../types/bellatrix'
import type { ConfidenceFeel } from '../../types/bellatrix'
import { Card, SectionLabel, Badge, PrimaryButton } from '../../components/ui'
import { EmptyState, ErrorState, LoadingState } from '../../components/bellatrix/shared'
import { DemoBadge } from '../../components/bellatrix/DemoBadge'

const DIR: Record<TrendDirection, { icon: typeof ArrowRight; label: string; cls: string }> = {
  up: { icon: ArrowUpRight, label: '늘고 있어요', cls: 'text-emerald-600' },
  flat: { icon: ArrowRight, label: '꾸준해요', cls: 'text-ink-950/50' },
  down: { icon: ArrowDownRight, label: '잠시 쉬는 중', cls: 'text-amber-600' },
  insufficient: { icon: ArrowRight, label: '아직 근거 부족', cls: 'text-ink-950/30' },
}

const CONF_SCORE: Record<ConfidenceFeel, number> = { low: 1, ok: 2, high: 3 }

function Tile({ icon, value, label, sub }: { icon: React.ReactNode; value: string; label: string; sub: string }) {
  return (
    <div className="rounded-xl bg-ink-950/4 border border-ink-950/8 px-3 py-3 flex flex-col gap-1">
      <div className="text-brand-600">{icon}</div>
      <div className="text-xl font-bold text-ink-950 tabular-nums leading-none">{value}</div>
      <div className="text-[11px] text-ink-950/60 leading-tight">{label}</div>
      <div className="text-[10px] text-ink-950/35 leading-tight">{sub}</div>
    </div>
  )
}

export function Growth() {
  const ready = useReadyData()
  const { dataset, reload, today, trackEvent, openSheet } = useBellatrix()

  useEffect(() => {
    if (ready) trackEvent('growth_viewed')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!ready])

  const model = useMemo(() => {
    if (!ready) return null
    const { data, user } = ready
    const refl = data.reflections.filter((r) => r.user_id === user.id).sort((a, b) => b.shift_date.localeCompare(a.shift_date))
    const tried = refl.filter((r) => r.tried !== 'no')
    const weekStart = weekKey(today)
    const thisWeek = refl.filter((r) => r.shift_date >= weekStart)
    const attemptsThisWeek = data.action_events.filter((e) => e.user_id === user.id && e.event_type === 'attempted' && e.event_at.slice(0, 10) >= weekStart).length
    const teamDoneThisWeek = data.assignments.filter((a) => a.assigned_to_user_id === user.id && a.status === 'completed' && a.assigned_date >= weekStart).length
    const helpful = refl.filter((r) => r.tip_helpful !== null)
    const helpfulRate = helpful.length > 0 ? helpful.filter((r) => r.tip_helpful).length / helpful.length : null
    const conf = refl.filter((r) => r.confidence !== null).slice(0, 6).reverse()
    const wins = refl.filter((r) => r.win_note).slice(0, 5)
    const repeat = refl.filter((r) => r.try_again).length
    const trends = getEmployeeBehaviourTrend(data, user.id, today, 3)
    const rec = recommendNextShiftFocus({ dataset: data, userId: user.id, today })
    const sales = getMySales(data, user.id, today)
    const weekStartIso = weekStart
    const practicedWeek = data.action_events.filter((e) => e.user_id === user.id && e.event_type === 'practiced' && e.event_at.slice(0, 10) >= weekStartIso).length
    const quizWeek = data.action_events.filter((e) => e.user_id === user.id && e.event_type === 'quiz_answered' && e.event_at.slice(0, 10) >= weekStartIso)
    const quizCorrect = quizWeek.filter((e) => e.metadata?.correct === true).length
    // Review prompt: latest reflection said the tip did not help or nothing was tried → one question on that card.
    const latest = refl[0] ?? null
    const reviewCardId = latest && (latest.tip_helpful === false || latest.tried === 'no') && latest.coaching_card_id ? latest.coaching_card_id : null
    const reviewCard = reviewCardId ? data.coaching_cards.find((c) => c.id === reviewCardId) ?? null : null
    const helpfulCards = new Map<string, number>()
    for (const r of refl) if (r.tip_helpful && r.coaching_card_id) helpfulCards.set(r.coaching_card_id, (helpfulCards.get(r.coaching_card_id) ?? 0) + 1)
    const topCard = [...helpfulCards.entries()].sort((a, b) => b[1] - a[1])[0]
    const topCardObj = topCard ? data.coaching_cards.find((c) => c.id === topCard[0]) ?? null : null
    return { user, refl, tried, thisWeek, attemptsThisWeek, teamDoneThisWeek, helpfulRate, conf, wins, repeat, trends, rec, topCardObj, topCardCount: topCard?.[1] ?? 0, sales, practicedWeek, quizWeek: quizWeek.length, quizCorrect, reviewCard }
  }, [ready, today])

  if (dataset.status === 'error') return <ErrorState message={dataset.message} onRetry={dataset.retryable ? reload : undefined} />
  if (!model) return <LoadingState />
  const { user, refl, tried, thisWeek, attemptsThisWeek, teamDoneThisWeek, helpfulRate, conf, wins, repeat, trends, rec, topCardObj, topCardCount, sales, practicedWeek, quizWeek, quizCorrect, reviewCard } = model
  const hasAny = refl.length > 0 || attemptsThisWeek > 0 || trends.some((t) => t.total > 0)

  return (
    <div className="px-4 pt-4 pb-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-950 mb-1">Growth</h1>
          <p className="text-xs text-ink-950/40">순위도 점수도 없어요. 내가 시도한 것과 그때 느낀 것만 모아둔 곳이에요.</p>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] text-ink-950/40 shrink-0 mt-1">
          <Lock size={10} /> 나만 보기
        </span>
      </div>
      {user.is_demo && <DemoBadge label="데모 계정 · 아래 숫자는 샘플이에요" />}

      {!hasAny ? (
        <>
          <Card>
            <EmptyState icon={<Sparkles size={18} />} title="첫 근무 후에 채워져요" body="Shift Prep으로 준비하고, 근무 후 5초 회고를 남기면 여기에 내 성장이 쌓여요." />
          </Card>
          <MySalesSection sales={sales} />
        </>
      ) : (
        <>
          <div>
            <SectionLabel>이번 주</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              <Tile icon={<Repeat size={16} />} value={String(attemptsThisWeek + teamDoneThisWeek)} label="시도한 행동" sub={`내 목표 ${attemptsThisWeek} · 팀 ${teamDoneThisWeek}`} />
              <Tile icon={<Trophy size={16} />} value={String(thisWeek.filter((r) => r.tried === 'yes').length)} label="해낸 근무" sub={`회고 ${thisWeek.length}회 중`} />
              <Tile icon={<Smile size={16} />} value={helpfulRate === null ? '—' : `${Math.round(helpfulRate * 100)}%`} label="팁이 도움됨" sub={helpful(helpfulRate, refl.length)} />
            </div>
          </div>

          <MySalesSection sales={sales} />

          {wins.length > 0 && (
            <div>
              <SectionLabel>My Wins</SectionLabel>
              <Card className="space-y-2.5">
                {wins.map((w) => (
                  <div key={w.id} className="flex items-start gap-2.5">
                    <span className="text-base leading-none mt-0.5">🙌</span>
                    <div className="min-w-0">
                      <div className="text-sm text-ink-950/85 leading-snug">"{w.win_note}"</div>
                      <div className="text-[10px] text-ink-950/35 mt-0.5">{fmtShortDate(w.shift_date)}</div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          <div>
            <SectionLabel>행동별 시도 · 3주</SectionLabel>
            <Card>
              {trends.map((t) => {
                const d = DIR[t.direction]
                const Icon = d.icon
                const max = Math.max(1, ...t.weekly.map((w) => w.completed + w.observed + w.selfReported))
                return (
                  <div key={t.behaviour} className="flex items-center gap-3 py-2.5 border-b border-ink-950/6 last:border-0">
                    <div className="w-20 shrink-0 text-sm font-medium text-ink-950/85">{BEHAVIOUR_LABEL[t.behaviour]}</div>
                    <div className="flex-1 flex items-end gap-1 h-7">
                      {t.weekly.map((w) => {
                        const v = w.completed + w.observed + w.selfReported
                        return (
                          <div key={w.week} className="flex-1 flex flex-col justify-end h-full" title={`${w.week} 시도 ${v}`}>
                            <div className="w-full rounded-sm bg-brand-500/30" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
                          </div>
                        )
                      })}
                    </div>
                    <div className={`w-24 shrink-0 flex items-center justify-end gap-0.5 text-[11px] font-medium ${d.cls}`}>
                      <Icon size={13} /> {d.label}
                    </div>
                  </div>
                )
              })}
            </Card>
          </div>

          {conf.length > 0 && (
            <div>
              <SectionLabel>자신감 흐름</SectionLabel>
              <Card>
                <div className="flex items-end gap-2 h-14">
                  {conf.map((r) => (
                    <div key={r.id} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${r.shift_date}: ${r.confidence ? CONFIDENCE_FEEL_LABEL[r.confidence] : ''}`}>
                      <div className="w-full rounded-md bg-emerald-signal/50" style={{ height: `${(CONF_SCORE[r.confidence ?? 'ok'] / 3) * 100}%` }} />
                      <span className="text-[9px] text-ink-950/35">{r.shift_date.slice(5)}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-ink-950/50 mt-2">
                  최근 {conf.length}번 회고 기준 · 지금은 <span className="font-medium text-ink-950/80">{CONFIDENCE_FEEL_LABEL[conf[conf.length - 1].confidence ?? 'ok']}</span>
                </div>
              </Card>
            </div>
          )}

          <div>
            <SectionLabel>주간 요약</SectionLabel>
            <Card className="space-y-1.5 text-sm text-ink-950/75 leading-relaxed">
              <p>
                최근 회고 {refl.length}번 중 {tried.length}번 시도했고, {repeat}번은 "다시 해볼게요"를 골랐어요.
              </p>
              {topCardObj && (
                <p>
                  가장 도움이 됐던 팁: <span className="font-semibold text-ink-950">{topCardObj.headline}</span> ({topCardCount}회)
                </p>
              )}
              {(practicedWeek > 0 || quizWeek > 0) && (
                <p className="text-xs text-ink-950/55">
                  이번 주 연습 {practicedWeek}회{quizWeek > 0 ? ` · 10초 확인 ${quizCorrect}/${quizWeek} 정답` : ''}
                </p>
              )}
            </Card>
          </div>
        </>
      )}

      {reviewCard && (
        <div>
          <SectionLabel>다시 보기</SectionLabel>
          <Card className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-signal/15 text-amber-600 flex items-center justify-center shrink-0">
              <Zap size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ink-950/85 leading-snug">{reviewCard.headline}</div>
              <div className="text-[11px] text-ink-950/45">지난 회고에서 아쉬웠던 팁이에요. 한 문제만 다시 볼까요?</div>
            </div>
            <button onClick={() => openSheet({ kind: 'quickQuiz', cardId: reviewCard.id })} className="shrink-0 rounded-full bg-ink-950 text-white text-xs font-semibold px-3 py-1.5">
              한 문제
            </button>
          </Card>
        </div>
      )}

      {rec && (
        <div>
          <SectionLabel>다음 근무 추천</SectionLabel>
          <Card className="border-brand-200 bg-brand-50">
            <div className="flex items-center gap-1.5 text-brand-700 text-[11px] font-semibold mb-1">
              <TrendingUp size={12} /> {rec.focusMetric === 'none' ? BEHAVIOUR_LABEL[rec.behaviour] : `${METRIC_SHORT[rec.focusMetric]} 포커스`}
            </div>
            <div className="text-base font-bold text-ink-950 leading-snug">{rec.headline}</div>
            <p className="text-xs text-ink-950/60 mt-1.5 leading-relaxed">{rec.reason}</p>
            <p className="text-[10px] text-ink-950/35 mt-2">규칙 기반 추천이에요. 성과와의 관계는 아직 검증 전이에요.</p>
            {rec.card && (
              <div className="mt-3">
                <PrimaryButton onClick={() => openSheet({ kind: 'rolePlay', cardId: rec.card!.id })} className="flex items-center justify-center gap-1.5">
                  <MessageSquareText size={14} /> 2분 연습하기
                </PrimaryButton>
              </div>
            )}
          </Card>
        </div>
      )}

      <Badge tone="default">
        <Lock size={10} /> Growth는 기본적으로 비공개 · 매니저에게 보이지 않아요
      </Badge>
      <span className="hidden">{addDaysISO(today, 0)}</span>
    </div>
  )
}

/** The employee's own POS sales — only rows that carry their employee id.
 * Shows a clear "not connected" state instead of made-up numbers. */
function MySalesSection({ sales }: { sales: ReturnType<typeof getMySales> }) {
  if (!sales.connected) {
    return (
      <div>
        <SectionLabel>내 매출 · POS</SectionLabel>
        <Card className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-ink-950/6 flex items-center justify-center text-ink-950/40 shrink-0">
              <Plug size={16} />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-950/85">아직 판매 데이터가 연결되지 않았어요</div>
              <p className="text-xs text-ink-950/45 leading-relaxed mt-0.5">
                POS가 연결되거나 매니저가 직원별 판매 데이터(CSV의 employee_id)를 올리면, 이번 주 내 매출과 UPT가 여기에 보여요. 다른 사람 숫자는 보이지 않아요.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }
  const tw = sales.thisWeek
  const lw = sales.lastWeek
  const delta = (a: number | null, b: number | null) => (a !== null && b !== null && b > 0 ? formatPercentDelta(a, b) : null)
  const revDelta = delta(tw.revenue, lw.revenue)
  const uptDelta = delta(tw.upt, lw.upt)
  const maxRev = Math.max(1, ...tw.days.map((d) => d.revenue ?? 0))
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <SectionLabel>내 매출 · POS</SectionLabel>
        <span className="text-[10px] text-ink-950/35 -mt-2">
          {sales.source === 'api' ? 'POS 연동' : 'CSV 업로드'} · {sales.lastDate?.slice(5)}까지
        </span>
      </div>
      <Card className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-ink-950/4 border border-ink-950/8 px-3 py-3 flex flex-col gap-1">
            <div className="text-brand-600"><Receipt size={16} /></div>
            <div className="text-lg font-bold text-ink-950 tabular-nums leading-none">{tw.revenue === null ? '—' : `${Math.round(tw.revenue / 10000).toLocaleString()}만`}</div>
            <div className="text-[11px] text-ink-950/60">이번 주 매출</div>
            <div className={`text-[10px] ${revDelta && revDelta.startsWith('+') ? 'text-emerald-600' : 'text-ink-950/35'}`}>{revDelta ? `지난주 대비 ${revDelta}` : '지난주 데이터 없음'}</div>
          </div>
          <div className="rounded-xl bg-ink-950/4 border border-ink-950/8 px-3 py-3 flex flex-col gap-1">
            <div className="text-brand-600"><TrendingUp size={16} /></div>
            <div className="text-lg font-bold text-ink-950 tabular-nums leading-none">{formatMetric('upt', tw.upt)}</div>
            <div className="text-[11px] text-ink-950/60">UPT</div>
            <div className={`text-[10px] ${uptDelta && uptDelta.startsWith('+') ? 'text-emerald-600' : 'text-ink-950/35'}`}>{uptDelta ? `지난주 ${formatMetric('upt', lw.upt)}` : '거래당 수량'}</div>
          </div>
          <div className="rounded-xl bg-ink-950/4 border border-ink-950/8 px-3 py-3 flex flex-col gap-1">
            <div className="text-brand-600"><Receipt size={16} /></div>
            <div className="text-lg font-bold text-ink-950 tabular-nums leading-none">{tw.transactions ?? '—'}</div>
            <div className="text-[11px] text-ink-950/60">거래 건수</div>
            <div className="text-[10px] text-ink-950/35">ATV {formatMetric('atv', tw.atv)}</div>
          </div>
        </div>
        {tw.days.length > 0 && (
          <div>
            <div className="flex items-end gap-1.5 h-12">
              {tw.days.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${d.date} 매출 ${d.revenue ?? '—'} · UPT ${d.upt?.toFixed(2) ?? '—'}`}>
                  <div className="w-full rounded-sm bg-brand-500/35" style={{ height: `${Math.max(8, ((d.revenue ?? 0) / maxRev) * 100)}%` }} />
                  <span className="text-[9px] text-ink-950/35">{d.date.slice(8)}일</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="text-[10px] text-ink-950/35">매장 시스템에서 온 내 판매 기록이에요. 행동과 매출의 관계는 아직 검증 중인 가설이에요.</p>
      </Card>
    </div>
  )
}

function helpful(rate: number | null, n: number): string {
  if (rate === null) return '회고에서 답하면 채워져요'
  return `회고 ${n}회 기준`
}
