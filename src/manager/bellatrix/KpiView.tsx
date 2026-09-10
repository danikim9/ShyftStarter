import { useMemo } from 'react'
import { BarChart3, Upload } from 'lucide-react'
import { useBellatrix, useReadyData } from '../../lib/bellatrixStore'
import { ATTACH_RATE_DEFINITION_LABEL, formatMetric } from '../../lib/analytics/metrics'
import { fmtShortDate } from '../../lib/dates'
import { Card, SectionLabel, Badge, PrimaryButton, SecondaryButton } from '../../components/ui'
import { ErrorState, LoadingState } from '../../components/bellatrix/shared'

export function KpiView() {
  const ready = useReadyData()
  const { dataset, reload, openSheet, today } = useBellatrix()
  const rows = useMemo(
    () => (ready ? ready.data.outcomes.filter((o) => o.user_id === null).sort((a, b) => b.outcome_date.localeCompare(a.outcome_date)).slice(0, 21) : []),
    [ready]
  )
  if (dataset.status === 'error') return <ErrorState message={dataset.message} onRetry={dataset.retryable ? reload : undefined} />
  if (!ready) return <LoadingState />
  const hasToday = rows.some((r) => r.outcome_date === today)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-ink-950 mb-1">매장 KPI</h1>
        <p className="text-sm text-ink-950/45">수동 입력 또는 CSV로 가져와요. POS 연동은 파일럿 이후에.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton onClick={() => openSheet({ kind: 'kpi' })} className="flex items-center justify-center gap-1.5">
          <BarChart3 size={14} /> {hasToday ? '오늘 성과 수정' : '오늘 성과 입력'}
        </PrimaryButton>
        <SecondaryButton onClick={() => openSheet({ kind: 'csvImport' })} className="flex items-center justify-center gap-1.5">
          <Upload size={14} /> CSV 가져오기
        </SecondaryButton>
      </div>
      <Card className="text-[11px] text-ink-950/50 space-y-1">
        <div>
          CVR = 거래 ÷ 방문자 · ATV = 매출 ÷ 거래 · UPT = 수량 ÷ 거래
        </div>
        <div>
          Attach Rate = <span className="font-medium text-ink-950/70">{ATTACH_RATE_DEFINITION_LABEL[ready.data.store.attach_rate_definition]}</span> (매장 설정)
        </div>
      </Card>
      <div>
        <SectionLabel>최근 입력 · {rows.length}일</SectionLabel>
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-xs min-w-[520px]">
            <thead className="bg-ink-950/4 text-ink-950/50">
              <tr>
                {['날짜', '방문', '거래', '매출', 'CVR', 'ATV', 'UPT', 'Attach', '출처'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-ink-950/35">
                    아직 입력된 KPI가 없어요.
                  </td>
                </tr>
              )}
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-ink-950/6 tabular-nums">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button onClick={() => openSheet({ kind: 'kpi', presetDate: o.outcome_date })} className="text-brand-700 font-medium">
                      {fmtShortDate(o.outcome_date)}
                    </button>
                  </td>
                  <td className="px-3 py-2">{o.visitors ?? '—'}</td>
                  <td className="px-3 py-2">{o.transactions ?? '—'}</td>
                  <td className="px-3 py-2">{o.revenue === null ? '—' : `${Math.round(o.revenue / 10000)}만`}</td>
                  <td className="px-3 py-2">{formatMetric('cvr', o.cvr)}</td>
                  <td className="px-3 py-2">{formatMetric('atv', o.atv)}</td>
                  <td className="px-3 py-2">{formatMetric('upt', o.upt)}</td>
                  <td className="px-3 py-2">{formatMetric('attach_rate', o.attach_rate)}</td>
                  <td className="px-3 py-2">
                    <Badge tone={o.source === 'csv' ? 'brand' : 'default'}>{o.source}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
