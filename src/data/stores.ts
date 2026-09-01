// ---------------------------------------------------------------------------
// Manager Dashboard — 지점(매장) 전환 예시. 여러 매장을 관리하는 매니저가
// 좌측 상단에서 매장을 바꿔가며 볼 수 있는 UX의 예시일 뿐 — 실제 팀/근무/
// 액션 데이터는 전부 강남점(STORE_ID) 하나만 모델링되어 있음. 다른 매장을
// 선택하면 "준비 중" 상태를 보여줌(ready: false). 실제 멀티 매장 지원 시
// team.ts/roster.ts/mvpData.ts를 storeId 기준으로 분리하는 확장의 출발점.
// ---------------------------------------------------------------------------

import { STORE_ID, STORE_NAME } from './mvpData'

export interface StoreOption {
  id: string
  name: string
  region: string
  ready: boolean
}

export const STORES: StoreOption[] = [
  { id: STORE_ID, name: STORE_NAME, region: '서울', ready: true },
  { id: 'st_jamsil', name: '잠실점', region: '서울', ready: false },
]
