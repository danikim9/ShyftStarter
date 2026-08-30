# ShyftStarter — Employee App (P0 Prototype)

Bellatrix의 ShyftStarter Frontline Human Performance Intelligence 플랫폼 중,
**Employee App의 P0 MVP 네비게이션 5개 탭**을 목업 데이터 + 규칙 기반 mock AI로 구현한
클릭 가능한 프로토타입입니다. `Shyftstarter_CTO.pdf` (제품 스펙), `Bellatrix_CFO_v.5.pdf` /
`Bellatrix_사업계획서.pdf` (피치덱)의 화면 정의를 기준으로 만들었습니다.

## 실행 방법

```bash
npm install
npm run dev       # 개발 서버 (http://localhost:5173)
npm run build      # 프로덕션 빌드 → dist/
```

## 포함된 화면 (CTO 문서 Screen 01–10 기준)

| 탭 | 내용 |
|---|---|
| **Home** | Today's Mission, Quest 요약, Today's Stats 스냅샷, AI Nudge, Start My Shift |
| **Schedule** | Upcoming / Past Shifts, Shift Detail (Today's Focus·Why·Target) |
| **Quests** | Active Quest 목록, Mark Progress, Quest Detail → Killer Script / Micro Checklist 연결 |
| **Stats** | **바그래프(Capability Score) + 밸런스휠(Radar Chart)** 동시 제공, 스킬별 Shift-by-Shift 성장 그래프, Score·Confidence·Evidence·Trend, Performance Level(Lv.1–5) |
| **Coach** | AI Coach 카드 (WHAT HAPPENED → WHY IT MATTERS → WHAT TO DO NEXT), Role-play는 P1 스텁 |

Killer Script · Micro Checklist는 Home/Quest에서 바텀시트로 열립니다.

## 데이터 & AI — 지금은 mock, 나중에 교체하는 법

- `src/data/mockData.ts` — 직원 1명("지은", 강남점) 기준 스킬 8종 × 5시프트 히스토리, Shift, Quest,
  Killer Script, Checklist 목업. 실제 서비스에서는 CTO 문서 22p의 데이터 모델
  (User·Shift·Quest·EmployeeSkillScore·ActivityEvent 등)을 그대로 테이블로 옮기면 됩니다.
- `src/lib/aiEngine.ts` — **규칙 기반 mock AI**. `pickFocusSkill()`(약점×비즈니스 임팩트로 오늘의
  포커스 스킬 선정), `generateAiNudge()`, `generateCoachingCard()`, `getNextBestAction()` 네 함수가
  전부입니다. 반환 타입(JSON 구조)은 CTO 문서 23p의 "AI Output은 항상 구조화(Structured JSON)"
  원칙을 그대로 따르므로, 이 파일의 구현부만 실제 Claude API 호출로 바꾸면 화면 쪽 코드는 손댈
  필요가 없습니다.
- 음성 녹음·음성 캡처 기능은 어디에도 없습니다 (CTO 문서 24p 원칙 준수).

## 다음으로 확장할 것 (P1 이후, CTO 문서 25p 기준)

- 실제 백엔드 연동 (Supabase/Postgres 등) — 위 데이터 모델을 스키마로
- 실제 Claude API 연동 (`src/lib/aiEngine.ts` 교체)
- AI Coach의 Role-play (텍스트 기반), Microlearning, Progress(성장 그래프) 화면
- 인증/로그인, Manager Dashboard, Executive Dashboard

## 기술 스택

Vite + React 19 + TypeScript + Tailwind CSS v4 + Recharts + lucide-react
