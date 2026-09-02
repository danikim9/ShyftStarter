import { useAppState } from '../lib/store'

// 31차 — "직원으로 로그인 → Team에서 매장 코드로 참여" 시 화면이 확대되는
// 것 같다는 리포트를 재현하려고 코드 전체를 훑어본 결과, `whitespace-nowrap`이
// 쓰인 곳은 이 토스트 하나뿐이었다. 매장 코드로 참여하면 정확히 이 토스트
// (`"강남점 팀에 참여했어요"`)가 뜨는데, 기존 구현은 `left-1/2
// -translate-x-1/2`로 가운데 정렬하면서 텍스트는 `whitespace-nowrap`으로
// 절대 줄바꿈되지 않게 강제했다 — 텍스트가 조금이라도 넓게 그려지는 환경
// (실기기 폰트 렌더링/자동 확대 등, 헤드리스 Chromium에서는 재현되지 않음)
// 에서는 이 pill이 부모 폭보다 넓어지고, `translate-x-1/2` 중심 정렬 특성상
// 좌우 양쪽으로 똑같이 삐져나갈 수 있다. `inset-x-4` + `flex justify-center`
// + `max-w-full`(줄바꿈 허용)로 바꿔, 텍스트가 아무리 넓어져도 부모 폭을
// 절대 넘지 않고 대신 필요하면 pill이 두 줄로 접히도록 구조 자체를 안전하게
// 만들었다 — 어떤 폭/폰트 크기에서도 구조적으로 오버플로우가 불가능하다.
export function Toast() {
  const { toast } = useAppState()
  return (
    <div
      className={`absolute inset-x-4 z-50 flex justify-center transition-all duration-300 ${
        toast ? 'top-4 opacity-100' : '-top-10 opacity-0'
      }`}
    >
      <div className="max-w-full rounded-full bg-ink-950 text-white text-xs font-semibold px-4 py-2 shadow-xl text-center">
        {toast}
      </div>
    </div>
  )
}
