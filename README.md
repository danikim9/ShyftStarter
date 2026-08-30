# ShyftStarter — Prototype (Employee App P0+P1 · Manager Dashboard)

Bellatrix의 ShyftStarter Frontline Human Performance Intelligence 플랫폼을 목업 데이터 +
규칙 기반 mock AI로 구현한 클릭 가능한 프로토타입입니다. `Shyftstarter_CTO.pdf` (제품 스펙),
`Bellatrix_CFO_v.5.pdf` / `Bellatrix_사업계획서.pdf` (피치덱)의 화면 정의를 기준으로 만들었습니다.

## 실행 방법

```bash
npm install
npm run dev       # 개발 서버 (http://localhost:5173)
npm run build      # 프로덕션 빌드 → dist/
```

화면 상단의 **Employee App / Manager Dashboard** 전환 버튼으로 두 페르소나를 모두 체험할 수 있습니다.

## Employee App (CTO 문서 Screen 01–10 기준, 폰 프레임)

| 탭 | 내용 |
|---|---|
| **Home** | Today's Mission, Quest 요약, Today's Stats 스냅샷, AI Nudge, Start My Shift |
| **Schedule** | Upcoming / Past Shifts, Shift Detail (Today's Focus·Why·Target) |
| **Quests** | Active Quest 목록, Mark Progress, Quest Detail → Killer Script / Micro Checklist 연결 |
| **Stats** | **바그래프(Capability Score) + 밸런스휠(Radar Chart)** 동시 제공, 스킬별 Shift-by-Shift 성장 그래프, Score·Confidence·Evidence·Trend, Performance Level(Lv.1–5) |
| **Coach** | AI Coach 카드 (WHAT HAPPENED → WHY IT MATTERS → WHAT TO DO NEXT), START ROLE-PLAY / 3분 학습 버튼 |

Killer Script · Micro Checklist는 Home/Quest에서 바텀시트로 열립니다. Killer Script는 스킬당 2개 버전을 SHOW ANOTHER로 순환합니다.

시프트 시작 시 **1탭 컨디션 체크인** 팝업이 떠요 (하트 1~5개, 1초 이내 응답, 스킵 가능) — Home 화면에 오늘 체크인 결과가 표시되고, 이 값이 Manager Dashboard의 Will(참여도) 점수 근거에 반영됩니다.

### P1 — Microlearning & AI Role-play

- **마이크로러닝**: Home 퀵액션 "3분 학습" 또는 Coach 화면에서 진입. AI가 오늘의 스킬 갭 기준으로 모듈 하나를 추천(Why·Duration·Expected Outcome) → 시작하면 3개 실전 팁 카드 → 완료 시 XP.
- **AI Role-play**: Coach 화면 "START ROLE-PLAY". AI 고객 페르소나가 상황(가격 부담, 무관심 고객 등)을 던지면 텍스트로 답변 → 공감·응답구조·가치전달·이의처리·클로징 5축으로 mock 채점 + 개선 팁. 텍스트 기반만 구현, 음성 없음.

## Manager Dashboard (CTO 문서 Screen 19–21 기준, 와이드 웹/태블릿 레이아웃)

| 화면 | 내용 |
|---|---|
| **팀 현황** | "오늘 확인이 필요한 직원" 카드(6명 중 3명 needs-attention) + 전체 팀 로스터 |
| **Will × Capability 매트릭스** | 팀원을 참여도(행동 데이터 기반) × 역량(스킬 평균)으로 4분면에 산점도 배치 — 스타 플레이어 / 성장형 인재 / 몰입 저하 / 즉각 개입 필요 |
| **직원 상세 패널** | Capability(바그래프+밸런스휠 재사용) · Activity(Quest 완료율·코칭 이력·학습·KPI) · AI 3단 요약(WHAT MATTERS/WHY/WHAT TO DO) · 액션 버튼 |
| **퀘스트 생성 모달** | Screen21 스펙 그대로 — Name·Behavior·Assign To·Period·Difficulty/Reward·KPI Connection·AI Personalization, AI가 그 직원의 약점 스킬 기준으로 초안 자동 생성 |
| **1:1 코칭 가이드 모달** | 일반화된 5단계 대화 프레임워크(인정으로 열기→데이터 공유→원인 탐색→합의→응원으로 닫기)를 직원별 데이터로 채워서 제공 |

**Will(참여도) 점수는 설문이 아니라 행동 데이터**(퀘스트 완료율·넛지 반응률·체크리스트 참여)로 계산된다는 원칙을 지켰습니다 — 음성 캡처와 마찬가지로 "감시가 아닌 성장" 철학을 매니저 화면에도 그대로 적용했습니다.

## 코칭 콘텐츠 라이브러리 (`src/data/coachingContent.ts`)

Dani가 공유한 필드 코칭 매뉴얼/스토어 컬처 자료를 참고해, **특정 브랜드·산업에 종속되지 않도록 제가 직접 한국어로 재구성**한 예시 콘텐츠입니다: 6단계 응대 흐름, 스킬별 Killer Script 추가 버전, 제네릭 Before/After 피드백 문장, 체크리스트 문구 풀, 매장 문화 원칙 8종, 매니저 1:1 대화 템플릿. 실제 고객사 온보딩 시 그 회사의 SOP로 교체하는 자리입니다.

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

## 다음으로 확장할 것

- 실제 백엔드 연동 (Supabase/Postgres 등) — 위 데이터 모델을 스키마로
- 실제 Claude API 연동 (`src/lib/aiEngine.ts`, `src/lib/managerAiEngine.ts` 교체)
- Progress(주간/월간 성장 그래프), Team Leaderboard, Executive Dashboard (P2)
- 인증/로그인
- Will 점수 계산식(4분면 임계값 65점 등)을 실제 데이터로 검증

## 기술 스택

Vite + React 19 + TypeScript + Tailwind CSS v4 + Recharts + lucide-react
