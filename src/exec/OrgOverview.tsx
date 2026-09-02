import { Building2, Users, Gauge, TrendingUp } from 'lucide-react'
import { getOrgSummary, ORG_CAPABILITY_AVG_DELTA } from '../data/execData'
import { Card, SectionLabel } from '../components/ui'
import { KpiCard } from './components/KpiCard'
import { StoreComparisonTable } from './components/StoreTable'
import { OrgCapabilityRadar } from './components/OrgCapabilityRadar'

export function OrgOverview() {
  const org = getOrgSummary()

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Organization Performance</h1>
        <p className="text-white/40 text-sm">
          {org.totalStores}개 매장 · {org.totalEmployees}명 — 개별 직원 데이터가 아닌 매장/조직 단위 집계만
          보여줘요 (Executive 권한은 개인 식별 데이터에 접근하지 않아요).
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={<Building2 size={14} />} label="매장" value={`${org.totalStores}개`} sublabel="서울·경기·부산" />
        <KpiCard icon={<Users size={14} />} label="직원" value={`${org.totalEmployees}명`} />
        <KpiCard icon={<Gauge size={14} />} label="조직 평균 역량" value={`${org.avgCapability}`} sublabel="8개 스킬 평균, 0-100" />
        <KpiCard icon={<TrendingUp size={14} />} label="조직 평균 참여도" value={`${org.avgEngagement}`} sublabel="행동 데이터 기반 Will" />
        <KpiCard icon={<Gauge size={14} />} label="체크리스트 이수율" value={`${org.avgChecklistCompletion}%`} />
        <KpiCard icon={<Gauge size={14} />} label="트레이닝 완료율" value={`${org.avgTrainingCompletion}%`} sublabel="마이크로러닝+Role-play" />
        <KpiCard icon={<TrendingUp size={14} />} label="평균 ATV" value={`₩${Math.round(org.avgAtv / 1000)}k`} />
        <KpiCard icon={<TrendingUp size={14} />} label="평균 CVR" value={`${org.avgCvr}%`} />
      </div>

      <div>
        <SectionLabel>STORE · REGION COMPARISON</SectionLabel>
        <Card>
          <StoreComparisonTable />
        </Card>
      </div>

      <div>
        <SectionLabel>ORGANIZATION CAPABILITY MAP</SectionLabel>
        <Card>
          <OrgCapabilityRadar />
          <p className="text-xs text-white/50 leading-relaxed mt-1 pt-3 border-t border-white/8">
            플랫폼 도입 후 조직 평균 역량이 스킬당 평균 <span className="text-emerald-300 font-semibold">+{ORG_CAPABILITY_AVG_DELTA}점</span> 상승했어요.
            8개 스킬 중 <span className="text-white/80 font-medium">클로징·크로스셀</span>이 여전히 조직 전체에서 가장 약하고, 동시에 매출에 가장
            직접적으로 연결되는 영역이에요 — 다음 분기 트레이닝 투자 우선순위로 추천해요.
          </p>
        </Card>
      </div>
    </div>
  )
}
