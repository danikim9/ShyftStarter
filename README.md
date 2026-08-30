# ShyftStarter — Prototype (Employee App P0+P1 · Manager Dashboard · Executive Dashboard)

> 최신 업데이트: **Executive Dashboard**(P2) 추가 — Organization Performance, Store/Region Comparison, Capability Map, KPI Correlation("The Smoking Gun"), Training/Coaching ROI, Brand Alignment.

Bellatrix의 ShyftStarter Frontline Human Performance Intelligence 플랫폼을 목업 데이터 +
규칙 기반 mock AI로 구현한 클릭 가능한 프로토타입입니다. `Shyftstarter_CTO.pdf` (제품 스펙),
`Bellatrix_CFO_v.5.pdf` / `Bellatrix_사업계획서.pdf` (피치덱)의 화면 정의를 기준으로 만들었습니다.

## 실행 방법

```bash
npm install
npm run dev       # 개발 서버 (http://localhost:5173)
npm run build      # 프로덕션 빌드 → dist/
```

화면 상단의 **Employee App / Manager Dashboard / Executive Dashboard** 전환 버튼으로 세 페르소나를 모두 체험할 수 있습니다 (CTO 문서 07p의 3대 페르소나: Employee · Manager · Executive/Admin).

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

### P1 — Progress (성장 추이)

CTO 문서 08p IA 기준 신규 탭. Stats가 "지금의 스냅샷"이라면 Progress는 "시간에 따른 성장 곡선"입니다.

- **연속 활동 스트릭 · 최장 기록 · 누적 퀘스트/학습 완료** 4개 스탯 타일
- **Capability Trend**: 주간(8주)/월간(6개월) 토글 + 전체 역량 종합 점수 추이 라인 차트 + AI 한줄 요약(팀 평균 성장 속도 대비 비교, `generateProgressInsight()`)
- **Skill Trajectory**: 스킬 8종을 변화량(Δ) 순으로 칩 형태로 나열 → 탭하면 해당 스킬의 주간/월간 성장 곡선을 큰 그래프로 확인
- **Milestones**: 레벨업·스트릭·퀘스트/학습 누적·최대 성장 스킬 등 배지 그리드

### P1~P2 — Team (팀 챌린지 · Recognition · 리더보드)

CTO 문서 08p IA 기준 신규 탭.

- **Team Challenge**: 매장 전체가 함께 채우는 공유 목표 진행바(예: 크로스셀 32건) + AI 응원 메시지(`generateChallengeInsight()`)
- **Recognition**: 매니저/동료/AI가 보낸 인정 메시지 피드
- **Leaderboard**: 역량 종합 점수 기준 팀 순위. CTO 문서의 **"Leaderboard (기업별 On/Off)"** 스펙을 반영해 화면 내 토글로 켜고 끌 수 있고, 꺼두면 안내 문구만 표시됩니다. **매니저 대시보드의 Will(참여도)·needsAttention·AI 코칭 요약 등 민감한 코칭 신호는 절대 리더보드에 노출하지 않습니다** — 동료가 서로의 참여도/개입 필요 여부를 볼 수 있으면 "감시" 프레임이 되어버리기 때문에, `src/data/teamFeedData.ts`는 매니저용 `team.ts`에서 공개 가능한 필드(이름·역할·역량 점수)만 선택적으로 가져옵니다.

## Manager Dashboard (CTO 문서 Screen 19–21 기준, 와이드 웹/태블릿 레이아웃)

| 화면 | 내용 |
|---|---|
| **팀 현황** | "오늘 확인이 필요한 직원" 카드(6명 중 3명 needs-attention) + 전체 팀 로스터 |
| **Will × Capability 매트릭스** | 팀원을 참여도(행동 데이터 기반) × 역량(스킬 평균)으로 4분면에 산점도 배치 — 스타 플레이어 / 성장형 인재 / 몰입 저하 / 즉각 개입 필요 |
| **직원 상세 패널** | Capability(바그래프+밸런스휠 재사용) · Activity(Quest 완료율·코칭 이력·학습·KPI) · AI 3단 요약(WHAT MATTERS/WHY/WHAT TO DO) · 액션 버튼 |
| **퀘스트 생성 모달** | Screen21 스펙 그대로 — Name·Behavior·Assign To·Period·Difficulty/Reward·KPI Connection·AI Personalization, AI가 그 직원의 약점 스킬 기준으로 초안 자동 생성 |
| **1:1 코칭 가이드 모달** | 일반화된 5단계 대화 프레임워크(인정으로 열기→데이터 공유→원인 탐색→합의→응원으로 닫기)를 직원별 데이터로 채워서 제공 |

**Will(참여도) 점수는 설문이 아니라 행동 데이터**(퀘스트 완료율·넛지 반응률·체크리스트 참여)로 계산된다는 원칙을 지켰습니다 — 음성 캡처와 마찬가지로 "감시가 아닌 성장" 철학을 매니저 화면에도 그대로 적용했습니다.

## Executive Dashboard (CTO 문서 Screen 07p Persona 3 기준, P2 · 와이드 레이아웃)

조직 단위의 역량-성과 상관 분석 화면이에요. **Executive/Admin 역할은 개별 직원 데이터에 접근하지 않고
매장/조직 단위 집계만 봅니다** — CTO 문서 24p의 Role-Based Access Control 원칙(Regional/Enterprise
Admin은 Region/Company-wide 데이터만)을 그대로 반영했습니다.

| 화면 | 내용 |
|---|---|
| **조직 현황** | Organization Performance KPI 8종(매장 수·직원 수·조직 평균 역량/참여도/체크리스트·트레이닝 이수율·ATV·CVR), 지역별(서울/경기/부산) 매장 비교 테이블, 조직 전체 Capability Map(레이더 — 플랫폼 도입 전 대비 현재) |
| **ROI 분석** | **"The Smoking Gun"** — 체크리스트 이수율 × ATV 산점도 + 회귀선, Training ROI(트레이닝 이수율 상위/하위 매장 그룹 비교), Coaching ROI(코칭 세션 빈도 ↔ 역량 점수 상관계수), Brand Alignment(개념 지표) |

**"The Smoking Gun" 차트는 Bellatrix_CFO_v.5.pdf 7p를 그대로 재현**했습니다 — 체크리스트 이수율 상위
20% 매장의 평균 ATV가 나머지보다 유의미하게 높다는 것을 실제 계산으로 보여줍니다. 10개 매장 목업
데이터(`src/data/execData.ts`)는 상관계수·상승폭이 프로젝트 비전 문서가 인용한 **r≈0.74, +15.4%**에
근접하도록 설계했고, 화면에 표시되는 r값·회귀선·상승률은 하드코딩이 아니라 `src/lib/execAnalytics.ts`의
Pearson 상관계수·선형회귀 함수로 **매 렌더링마다 실제로 계산**됩니다 — 나중에 실제 POS·행동 데이터로
바꿔도 계산 로직은 그대로 재사용됩니다.

강남점(`st_gangnam`) 집계는 Manager Dashboard `team.ts`의 실제 6명 직원 평균과 일치하도록 맞춰서
Employee → Manager → Executive 세 화면의 숫자가 서로 어긋나지 않습니다.

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
- 인증/로그인, Role 기반 접근 제어를 실제로 강제하는 백엔드 (지금은 프론트에서 화면만 분리)
- Will 점수 계산식(4분면 임계값 65점 등)을 실제 데이터로 검증
- 리더보드 On/Off는 지금은 화면 내 로컬 토글(데모용)입니다 — 실제로는 기업/매장 단위 관리자 설정으로 옮겨가야 합니다
- Executive Dashboard의 KPI Correlation은 지금 10개 매장 목업 — 실제 POS/behavior-event 데이터가
  연결되면 `src/lib/execAnalytics.ts`의 계산 로직은 그대로 두고 `data/execData.ts`만 실데이터로 교체
- Brand Alignment는 아직 개념 지표 — 고객사 브랜드 가이드라인 온보딩 후 정의 확정 필요

## 기술 스택

Vite + React 19 + TypeScript + Tailwind CSS v4 + Recharts + lucide-react
