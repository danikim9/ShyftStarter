import { useMemo, useState } from 'react'
import { Users, Check } from 'lucide-react'
import { useBellatrix, useManagerData } from '../../lib/bellatrixStore'
import type { TargetMetric } from '../../types/bellatrix'
import { BEHAVIOUR_LABEL, INTERVENTION_LABEL, METRIC_SHORT } from '../../types/bellatrix'
import { addDaysISO, fmtShortDate } from '../../lib/dates'
import { shiftsOn } from '../../lib/selectors'
import { PrimaryButton } from '../../components/ui'
import { ChoiceChips, Question, inputClass } from '../../components/bellatrix/shared'

const METRICS: TargetMetric[] = ['attach_rate', 'atv', 'cvr', 'upt', 'revenue']

export function AssignActionSheet({ presetUserId }: { presetUserId?: string }) {
  const ready = useManagerData()
  const { assignAction, closeSheet, today } = useBellatrix()
  const [actionId, setActionId] = useState<string | null>(null)
  const [userIds, setUserIds] = useState<string[]>(presetUserId ? [presetUserId] : [])
  const [date, setDate] = useState(today)
  const [target, setTarget] = useState('')
  const [metric, setMetric] = useState<TargetMetric | null>(null)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const employees = useMemo(() => (ready ? ready.data.users.filter((u) => u.role === 'employee') : []), [ready])
  const workingIds = useMemo(() => (ready ? new Set(shiftsOn(ready.data, date).map((s) => s.user_id)) : new Set<string>()), [ready, date])

  if (!ready) return null
  const { data } = ready
  const action = data.actions.find((a) => a.id === actionId) ?? null
  const effectiveMetric = metric ?? action?.target_metric ?? 'none'
  const effectiveTarget = target === '' ? action?.default_target_count ?? null : Number(target)
  const allSelected = employees.length > 0 && employees.every((e) => userIds.includes(e.id))

  const toggle = (id: string) => setUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const submit = async () => {
    if (!action) return setError('액션을 선택해주세요.')
    if (userIds.length === 0) return setError('대상 직원을 선택해주세요.')
    if (action.intervention_type !== 'micro_coaching' && (effectiveTarget === null || !Number.isFinite(effectiveTarget) || effectiveTarget < 1))
      return setError('목표 횟수는 1 이상이어야 해요.')
    setBusy(true)
    setError(null)
    try {
      await assignAction({
        actionId: action.id,
        userIds,
        date,
        targetCount: action.intervention_type === 'micro_coaching' ? null : effectiveTarget,
        targetMetric: effectiveMetric,
        campaignId,
      })
      closeSheet()
    } catch (e) {
      setError(e instanceof Error ? e.message : '배정하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const groups = (['micro_coaching', 'action', 'mini_quest'] as const).map((t) => ({ t, items: data.actions.filter((a) => a.intervention_type === t) }))

  return (
    <div className="space-y-5">
      <Question n={1} text="어떤 개입을 배정할까요?">
        <div className="space-y-3">
          {groups.map(({ t, items }) => (
            <div key={t}>
              <div className="text-[10px] font-semibold text-ink-950/40 uppercase tracking-wide mb-1">{INTERVENTION_LABEL[t]}</div>
              <div className="space-y-1.5">
                {items.map((a) => {
                  const active = a.id === actionId
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setActionId(a.id)
                        setMetric(null)
                        setTarget('')
                      }}
                      className={`w-full text-left rounded-xl border px-3.5 py-2.5 transition ${active ? 'border-brand-500 bg-brand-50' : 'border-ink-950/10 bg-white'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-medium ${active ? 'text-brand-800' : 'text-ink-950/85'}`}>{a.title}</span>
                        {active && <Check size={15} className="text-brand-600 shrink-0" />}
                      </div>
                      <div className="text-[11px] text-ink-950/45 mt-0.5">
                        {BEHAVIOUR_LABEL[a.behaviour_type]} · {METRIC_SHORT[a.target_metric]}
                        {a.default_target_count ? ` · 기본 ${a.default_target_count}회` : ''}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Question>

      <Question n={2} text="누구에게?">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setUserIds(allSelected ? [] : employees.map((e) => e.id))}
            className={`rounded-xl border px-3 py-2 text-sm font-medium inline-flex items-center gap-1.5 ${allSelected ? 'bg-ink-950 border-ink-950 text-white' : 'bg-white border-ink-950/10 text-ink-950/75'}`}
          >
            <Users size={14} /> 팀 전체
          </button>
          {employees.map((e) => {
            const on = userIds.includes(e.id)
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => toggle(e.id)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium ${on ? 'bg-brand-500 border-brand-500 text-ink-950' : 'bg-white border-ink-950/10 text-ink-950/75'}`}
              >
                {e.name}
                {workingIds.has(e.id) && <span className={`ml-1 text-[10px] ${on ? 'text-white/70' : 'text-emerald-600'}`}>근무</span>}
              </button>
            )
          })}
        </div>
      </Question>

      <Question n={3} text="언제?">
        <ChoiceChips
          options={[
            { value: today, label: `오늘 ${fmtShortDate(today)}` },
            { value: addDaysISO(today, 1), label: `내일 ${fmtShortDate(addDaysISO(today, 1))}` },
          ]}
          value={date}
          onChange={setDate}
          columns={2}
        />
      </Question>

      {action && action.intervention_type !== 'micro_coaching' && (
        <Question n={4} text="목표 횟수">
          <input inputMode="numeric" pattern="[0-9]*" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ''))} placeholder={String(action.default_target_count ?? 3)} className={inputClass} />
        </Question>
      )}

      {action && (
        <Question text="연결 지표">
          <ChoiceChips options={METRICS.map((m) => ({ value: m, label: METRIC_SHORT[m] }))} value={effectiveMetric === 'none' ? null : effectiveMetric} onChange={setMetric} />
        </Question>
      )}

      {action && data.campaigns.filter((c) => c.active).length > 0 && (
        <Question text="캠페인 연결 (선택)">
          <div className="flex flex-wrap gap-2">
            {data.campaigns
              .filter((c) => c.active)
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCampaignId(campaignId === c.id ? null : c.id)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${campaignId === c.id ? 'bg-ink-950 border-ink-950 text-white' : 'bg-white border-ink-950/10 text-ink-950/75'}`}
                >
                  {c.name}
                </button>
              ))}
          </div>
        </Question>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}
      <PrimaryButton disabled={busy} onClick={submit}>
        {busy ? '배정 중…' : userIds.length > 0 ? `${userIds.length}명에게 배정` : '배정'}
      </PrimaryButton>
    </div>
  )
}
