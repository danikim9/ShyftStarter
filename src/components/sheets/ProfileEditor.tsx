import { useState } from 'react'
import { useAppState } from '../../lib/store'
import { PrimaryButton } from '../ui'

// 26차 — Employee 앱 내 간단한 프로필 편집. 이름/직함 두 항목만 수정 가능.
// 스킬·레벨·경력 등 나머지 프로필 데이터는 여전히 mockData의 employee가
// 단일 소스이고, 여기서 바꾸는 이름/직함은 store.tsx의 profileName/
// profileRole 상태로 승격돼 인사말·인수인계·공지·댓글 작성자명·근무 교대
// 요청자명에 즉시 반영된다. 세 아티팩트(Employee/Manager/Executive)가
// 서로 다른 배포물이라, 여기서 바꾼 이름이 Manager/Executive 쪽 팀 로스터
// 이름까지 바꾸지는 않는다 — 24차부터 이어진 알려진 트레이드오프.
export function ProfileEditor() {
  const { employee, updateProfile, closeSheet } = useAppState()
  const [name, setName] = useState(employee.name)
  const [role, setRole] = useState(employee.role)

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-950/50 leading-relaxed">
        이름과 직함만 바꿀 수 있어요. 다른 프로필 정보는 매니저·본사 쪽에서 관리돼요.
      </p>
      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-950/50">이름</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            className="w-full rounded-xl bg-ink-950/6 border border-ink-950/10 px-3.5 py-3 text-[16px] text-ink-950 placeholder:text-ink-950/25 outline-none focus:border-brand-400/50"
            autoFocus
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-950/50">직함</span>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="예: Sales Associate"
            className="w-full rounded-xl bg-ink-950/6 border border-ink-950/10 px-3.5 py-3 text-[16px] text-ink-950 placeholder:text-ink-950/25 outline-none focus:border-brand-400/50"
          />
        </label>
      </div>
      <PrimaryButton
        disabled={!name.trim()}
        onClick={() => {
          updateProfile(name, role)
          closeSheet()
        }}
      >
        저장하기
      </PrimaryButton>
    </div>
  )
}
