# ShyftStarter — Bellatrix Frontline Behavioral Intelligence (TestFlight MVP)

> **ShyftStarter는 스케줄링 앱이 아닙니다.** Bellatrix(Frontline Behavioral Intelligence Platform)의
> 프론트라인 인터페이스로, "특정 마이크로 코칭 개입이 매장 직원의 판매 행동을 바꾸고, 그 행동 변화가
> 측정 가능한 매출 KPI 개선과 연관되는가"를 검증하기 위한 파일럿 데이터 수집 도구입니다.

```
Today → Micro Coaching → Action → Behaviour Evidence → KPI → Insight
Employee → Shift → Intervention → ActionEvent → BehaviourEvidence → OutcomeEvent
```

## 실행

```bash
npm install
npm run dev          # http://localhost:5173 — 온보딩 → 데모 계정 선택 → 앱
npm run build        # tsc -b && vite build → dist/
npm run cap:sync     # build + npx cap sync (ios/ android/ 는 로컬 Mac에만 존재)
```

백엔드 설정이 없으면(기본) **온디바이스 어댑터**로 동작합니다: 시드 데이터가 기기 저장소에 저장되고 모든
기록이 영속화되어, TestFlight 테스터가 서버 없이 전체 플로우를 쓸 수 있습니다.
Supabase를 연결하려면 `.env.example`을 `.env`로 복사해 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를
채우고 `supabase/migrations/0001_bellatrix_core.sql` → `supabase/seed.sql`을 적용하세요. 코드 변경 없이
`src/lib/repo/index.ts`가 어댑터를 전환합니다.

## 데모 계정 (온디바이스 모드)

| 계정 | 역할 | 비고 |
|---|---|---|
| Dani Kim | 직원 | 오늘 마이크로 코칭 1 + 액션 2 (3/5, 1/3 진행 중) |
| Mina Lee · Joon Park | 직원 | Joon은 파일럿 **대조군**(크로스셀 개입 없음) |
| Sora Kim | 매니저 | 오늘의 팀 · 관찰 · KPI · 인사이트 |

## 화면 구조

**직원** — 하단 탭 4개: **Today / Actions / Growth / Profile**
- Today: 오늘 근무 · 오늘의 포커스(지표) · 마이크로 코칭 카드("오늘 이걸 써볼게요") · 오늘의 액션(최대 3) · 1분 회고
- 액션 상세: +/− 진행 기록(ActionEvent `progress_updated`) → "완료하기 — 20초 체크인"(BehaviourEvidence, 자기 보고 = 신뢰도 낮음)
- Growth: 이번 주(액션 완료 / 코칭 적용 / 매니저 관찰), 3주 행동 트렌드, 다음 근무 추천(규칙 기반). 점수 없음 — 데이터 부족/근거 쌓는 중/초기 신호 라벨만
- Profile: 계정 · 저장 위치 · 데모 데이터 초기화 · 구버전 화면(팀 공지·인수인계, 근무 일정) 진입

**매니저** — 홈 / 인사이트 / KPI / 더보기 (같은 앱, 계정 역할로 분기; 우하단 버튼으로 직원 화면 미리보기)
- 홈: 오늘 근무 직원 + 액션 진행 + 오늘 관찰 여부, CTA **빠른 관찰**(10초, 샘플링 OK) · **오늘 성과 입력** · **액션 배정**(개인/팀 전체, 날짜, 목표 횟수, 연결 지표)
- 인사이트: 규칙 기반 주간 인사이트 — "크로스셀 액션 완료된 날 ATV +x%" 등. 모든 문장에 `데이터 부족 / 근거 쌓는 중 / 초기 신호 / 상관관계` 라벨 + "상관관계는 인과관계를 증명하지 않아요"
- KPI: 수동 입력(CVR/ATV/UPT/Attach 자동 계산, Attach Rate 정의는 매장 설정값) · CSV 가져오기(필수 컬럼·숫자·날짜·매장 ID 검증, 행 단위 오류 표시)
- 더보기: 구버전 팀 운영 도구(공지·체크리스트, 근무 일정 관리, 팀 현황, Will×Capability) — 코드 유지, 우선순위 하향

## 코드 구조 (Bellatrix)

| 경로 | 역할 |
|---|---|
| `src/types/bellatrix.ts` | 도메인 타입 (DB 컬럼과 1:1, snake_case) |
| `src/lib/repo/` | `BellatrixRepo` 인터페이스 · `localRepo`(온디바이스) · `supabaseRepo` · 팩토리 |
| `src/lib/bellatrixStore.tsx` | 세션/데이터셋/쓰기 작업 React 컨텍스트 (로딩·에러·토스트·이벤트 트래킹) |
| `src/lib/analytics/` | `metrics`(KPI 파생) · `analytics`(완료율·관찰률·그룹 비교·트렌드) · `insights`(주간 인사이트) · `recommendation`(다음 근무 추천) · `confidence`(근거 신뢰도) |
| `src/lib/csvImport.ts` | KPI CSV 파서/검증 |
| `src/lib/tracking.ts` | 제품 이벤트(app_opened … insight_viewed) → `product_events` |
| `src/data/seed.ts` | Gangnam Flagship 3주 시드 (결정적 PRNG) |
| `src/screens/bellatrix/` | Today · Actions · Growth · Profile |
| `src/components/bellatrix/` | 코칭/체크인/액션 상세/회고 시트, 공용 UI |
| `src/manager/bellatrix/` | 매니저 홈 · 배정 · 관찰 · KPI · CSV · 인사이트 |
| `supabase/migrations/0001_bellatrix_core.sql` | 스키마 + RLS + 프로필 자동 생성 트리거 |

## 근거 신뢰도 원칙

- 본인 체크인 = `employee_self_report` → **낮음**(같은 근무에 매니저 관찰이 있으면 중간)
- 매니저 관찰 = `manager_observation` → **높음**
- 앱 기록(코칭 열람 등) = `digital_signal` → 디지털 행동에만 중간
- "액션 완료"는 참여 기록이며 실제 행동을 의미하지 않습니다. UI는 **완료**와 **관찰됨**을 항상 구분합니다.

## 제외/보류 (V1)

마이크·오디오·위치, 채팅, 급여, GPS 출퇴근, 자동 스케줄링, 교대 승인 워크플로, LMS, 챗봇, 소셜 피드,
배지/아바타, 임원 대시보드, POS 연동. 아래 구버전 문서의 기능들은 코드는 남아 있으나 nav에서 제외됐습니다.

---

# (아래는 v2 Shift Companion 시절 문서 — 참고용)

# ShyftStarter — Prototype (v2: Shift Companion MVP)

> **이 폴더는 ShyftStarter의 세 코드 폴더 중 Employee(팀원용) 전용입니다.**
> `shyftstarter_manager/`, `shyftstarter_executive/`와 원래 하나였던 프로토타입에서 나눈
> 것이라, 상태 관리(`src/lib/store.tsx`)·타입(`src/types/`)·데이터 모델(`src/data/`) 같은
> 공유 인프라는 세 폴더에 각각 복사되어 있습니다. 직접 만질 일이 많은 Employee 전용 코드는
> `src/screens/`, `src/auth/`, `src/onboarding/`, `src/components/`에 있습니다.
> `.env`에 `VITE_PERSONA=employee`가 고정돼 있어 `npm install && npm run dev`만 하면 온보딩
> → 로그인 데모 → My Shift/My Actions/Team 3탭으로 바로 들어갑니다(페르소나 전환 버튼 없음).

> 최신 업데이트: **v2 피벗 — "Shift Companion" MVP**. Employee App을 **My Shift / Team / My Actions** 3탭으로
> 단순화했습니다. 기존 Stats/Coach/Progress/Team 리더보드/Executive Dashboard 등 P0~P2 기능은
> **코드는 그대로 두고 nav에서만 숨겼습니다** (아래 "숨겨진 기능" 섹션 참고 — Business+/Enterprise 티어에서
> 다시 노출할 예정). 전략 배경은 `claude/shyftstarter-v2-strategy-b2c-pivot.md` 참고.

## 핵심 정의

**"교대근무자의 근무일을 정리하고, 팀과 연결하고, 매일의 일을 더 잘하게 만드는 Shift Companion."**

스케줄링 앱으로 포지셔닝하지 않습니다. 스케줄은 사용자가 앱을 반복해서 여는 *이유*이고,
체크리스트·퀘스트·성장 데이터가 ShyftStarter가 존재하는 *이유*입니다.

```
Schedule → Shift → Action → Growth
```

북극성 질문: **"알바생 한 명이 아무도 초대하지 않은 상태에서도 왜 ShyftStarter를 설치하고
다음 근무 때 다시 열까?"** — 이 질문을 기준으로 MVP를 5개 기능으로 잘랐습니다.

## 실행 방법

```bash
npm install
npm run dev       # 개발 서버 (http://localhost:5173)
npm run build      # 프로덕션 빌드 → dist/
```

화면 상단의 **Employee App / Manager Dashboard / Executive Dashboard** 전환 버튼으로 세 페르소나를
모두 체험할 수 있습니다. (Executive Dashboard는 현재 nav에서는 숨겨진 P2 기능이지만, 페르소나
전환 버튼 자체는 데모 편의를 위해 계속 노출해 두었습니다.)

## Employee App — MVP 3탭

| 탭 | 내용 |
|---|---|
| **My Shift** | 오늘 근무 히어로 카드(탭하면 상세: 오늘 할 일 보기 · 인수인계 남기기), 1탭 컨디션 체크인(무드), 최근 인수인계 미리보기, 예정된/지난 근무 리스트 |
| **Team** | Announcement(공지, 상단 고정 가능 · 👍🙌❤️ 리액션 · 댓글) + Handover(인수인계) 피드를 시간순으로 합쳐서 표시. **완전한 메신저가 아닙니다** — 실시간 잡담은 의도적으로 카카오톡 등 기존 채팅앱 영역으로 남겨두고, 시프트에 묶인 "구조화된 정보"만 소유합니다 |
| **My Actions** | 셀프/매니저/AI 세 출처가 통합된 Action(체크리스트+퀘스트) 목록. 완료 시 토스트 + 주간 완료 카운터(Flame 아이콘) — XP/레벨은 의도적으로 숨김, 최소한의 완료 피드백만 유지 |

### Handover (인수인계)

`My Shift`와 `Team` 양쪽에서 작성/열람 가능한 짧은 텍스트 노트. 근무 교대 시 "누가 무엇을
남겼는지"가 그룹채팅에 묻히지 않고 구조화되어 남습니다. `src/components/sheets/HandoverComposer.tsx`.

### Action — 셀프/매니저/AI 통합 엔티티

기존에 별도였던 Quest/Checklist 개념을 하나의 `Action` 타입으로 통합했습니다
(`src/types/index.ts` — `kind: 'checklist' | 'quest'`, `createdBy: 'self' | 'manager' | 'ai'`).
완료할 때마다 화면에 보이지 않는 `ActionEvent`가 조용히 기록되어, 나중에 "Employee Performance
Graph" 데이터 모델의 씨앗이 됩니다 (UI 변경 없이 나중에 활용 가능).

### Invisible AI — 퀵 액션 생성

`My Actions`의 "+" 버튼 → AI 모드에서 자연어 프롬프트("마감 준비 도와줘" 등)를 입력하면
`generateQuickActions()` (`src/lib/aiEngine.ts`, 키워드 매칭 규칙 기반 mock)가 체크리스트 문구
3~4개를 제안 → 탭하면 바로 Action으로 추가됩니다. AI라는 라벨을 전면에 내세우지 않고, "그냥
빠르게 만들어지는" 경험으로 설계했습니다.

## Manager Dashboard

| 화면 | 내용 |
|---|---|
| **팀 액션 · 공지** *(신규, 기본 화면)* | 공지 등록(상단 고정 옵션) + 팀 액션 배포(제목·목표 횟수 → 전체 팀에게) 폼, 최근 배포 내역 리스트. Employee App의 Team/My Actions 탭과 **같은 상태를 공유**하므로, 매니저로 공지를 올리고 Employee App으로 전환하면 바로 반영된 걸 확인할 수 있습니다 |
| **팀 현황** | "오늘 확인이 필요한 직원" 카드 + 전체 팀 로스터 |
| **Will × Capability (고급)** | 참여도 × 역량 4분면 매트릭스 — 기존 기능 유지, nav에 "(고급)" 라벨로 구분해 Business+ 티어 성격임을 표시 |

## 수익화 사다리 v2

| 티어 | 대상 | 핵심 기능 |
|---|---|---|
| **Free — Worker** | 개인 교대근무자 | My Shift · Team(공지/인수인계) · My Actions(셀프) |
| **Team — Manager** | 점장/소규모 팀 | + 매니저 Action/공지 배포, 팀 현황 |
| **Business — Store/SMB** | 매장/SMB | + Will×Capability, AI 코칭, 브랜드 커스터마이즈 |
| **Enterprise — Brand** | 본사/멀티스토어 | + Executive Dashboard, ROI Correlation, 컨설팅 |

Land & Expand 경로가 기존 계획과 반대로 뒤집힙니다: **직원 개별 사용 → 매장 도입 → 본사 발견 →
Enterprise 계약**. 자세한 내용은 프로젝트 전략 문서 참고.

---

## 숨겨진 기능 (Business+/Enterprise 참고용 — 현재 nav에서 숨김)

아래 기능들은 v2 MVP 심플화 과정에서 네비게이션에서 제거했지만, **코드는 전부 그대로
유지**되어 있습니다. 상위 티어(Business/Enterprise)에서 다시 연결할 예정입니다.

### Home / Stats / Coach (구 P0/P1)

| 화면 | 내용 |
|---|---|
| **Home** | Today's Mission, Quest 요약, Today's Stats 스냅샷, AI Nudge, Start My Shift |
| **Stats** | 바그래프(Capability Score) + 밸런스휠(Radar Chart), 스킬별 Shift-by-Shift 성장 그래프, Score·Confidence·Evidence·Trend, Performance Level(Lv.1–5) |
| **Coach** | AI Coach 카드(WHAT HAPPENED → WHY IT MATTERS → WHAT TO DO NEXT), START ROLE-PLAY / 3분 학습 버튼 |

Killer Script · Micro Checklist는 스킬당 2개 버전을 SHOW ANOTHER로 순환하는 바텀시트로
구현되어 있습니다. **마이크로러닝**과 **AI Role-play**(텍스트 기반, 음성 없음, 5축 mock 채점)도
Coach 화면에 포함되어 있습니다.

### Progress (성장 추이) — 구 P1

Stats가 "지금의 스냅샷"이라면 Progress는 "시간에 따른 성장 곡선"입니다. 연속 활동 스트릭,
Capability Trend(주간/월간 라인 차트 + AI 한줄 요약), Skill Trajectory(스킬별 Δ 칩), Milestones
배지 그리드로 구성되어 있습니다.

### Team 리더보드 · Recognition — 구 P1~P2

지금의 Team 탭(공지+인수인계)과는 별개의 **구 버전** 화면입니다. Team Challenge(매장 공유 목표
진행바), Recognition(인정 메시지 피드), Leaderboard(역량 종합 점수 순위, On/Off 토글)로
구성됩니다. **매니저 대시보드의 Will(참여도)·needsAttention 등 민감한 코칭 신호는 절대
리더보드에 노출하지 않는다**는 원칙을 지켰습니다 (`src/data/teamFeedData.ts`).

### Executive Dashboard — P2

조직 단위의 역량-성과 상관 분석 화면. **Executive/Admin 역할은 개별 직원 데이터에 접근하지
않고 매장/조직 단위 집계만 봅니다** (Role-Based Access Control 원칙).

| 화면 | 내용 |
|---|---|
| **조직 현황** | Organization Performance KPI 8종, 지역별 매장 비교 테이블, 조직 Capability Map(레이더) |
| **ROI 분석** | **"The Smoking Gun"** — 체크리스트 이수율 × ATV 산점도 + 회귀선, Training/Coaching ROI, Brand Alignment |

"The Smoking Gun" 차트는 체크리스트 이수율 상위 20% 매장의 평균 ATV가 유의미하게 높다는 것을
실제 계산으로 보여줍니다. 10개 매장 목업 데이터(`src/data/execData.ts`)는 상관계수·상승폭이
**r≈0.74, +15.4%**에 근접하도록 설계했고, 화면에 표시되는 값은 하드코딩이 아니라
`src/lib/execAnalytics.ts`의 Pearson 상관계수·선형회귀 함수로 매 렌더링마다 실제로 계산됩니다.

### 코칭 콘텐츠 라이브러리 (`src/data/coachingContent.ts`)

특정 브랜드·산업에 종속되지 않도록 재구성한 예시 콘텐츠: 6단계 응대 흐름, 스킬별 Killer
Script, 제네릭 Before/After 피드백 문장, 체크리스트 문구 풀, 매장 문화 원칙 8종, 매니저 1:1
대화 템플릿. 실제 고객사 온보딩 시 그 회사의 SOP로 교체하는 자리입니다.

---

## 데이터 & AI — 지금은 mock, 나중에 교체하는 법

- `src/data/mockData.ts` — 직원 1명("지은", 강남점) 기준 스킬 8종 × 5시프트 히스토리, Shift, 구
  Quest/Checklist 목업.
- `src/data/mvpData.ts` — v2 MVP용 데이터: 초기 Action 5개, Handover 2개, Announcement 2개
  (리액션/댓글 포함).
- `src/lib/aiEngine.ts` — **규칙 기반 mock AI**. 기존 `pickFocusSkill()` / `generateAiNudge()` /
  `generateCoachingCard()` / `getNextBestAction()`에 더해, v2의 `generateQuickActions()`(자연어 →
  체크리스트 제안)가 추가되었습니다. 반환 타입은 항상 구조화된 형태를 유지하므로, 구현부만 실제
  Claude API 호출로 바꾸면 화면 쪽 코드는 손댈 필요가 없습니다.
- `src/lib/store.tsx` — 세 페르소나(Employee/Manager/Executive)가 공유하는 `AppStateProvider`.
  v2에서 `actions` / `handovers` / `announcements` / `actionEvents` 상태와 CRUD 함수가
  추가되었습니다. 매니저가 배포한 공지/액션은 이 공유 상태를 통해 Employee App에 즉시 반영됩니다.
- 음성 녹음·음성 캡처 기능은 어디에도 없습니다.

## 다음으로 확장할 것

- 실제 백엔드 연동 (Supabase/Postgres 등)
- 실제 Claude API 연동 (`generateQuickActions()` 등 mock 함수 교체)
- 인증/로그인, Role 기반 접근 제어를 실제로 강제하는 백엔드
- Free → Team 전환 트리거 설계, 팀 생성/초대 UX (아직 미확정 — 전략 문서 §6 참고)
- Shift Swap(근무 교대 요청) 워크플로 — 아직 스코프 밖
- 상위 티어 진입 시 숨겨진 기능(Stats/Coach/Progress/리더보드/Executive Dashboard)을 nav에
  다시 연결
- 리더보드 On/Off는 지금은 화면 내 로컬 토글(데모용) — 실제로는 기업/매장 단위 관리자 설정으로
  이동
- Executive Dashboard의 KPI Correlation은 지금 10개 매장 목업 — 실제 POS/behavior-event 데이터
  연결 시 `execAnalytics.ts` 로직은 그대로 두고 `execData.ts`만 교체
- Brand Alignment는 아직 개념 지표 — 고객사 브랜드 가이드라인 온보딩 후 정의 확정 필요

## 기술 스택

Vite + React 19 + TypeScript + Tailwind CSS v4 + Recharts + lucide-react

---

## TestFlight 체크리스트 (이 저장소 기준)

- [x] `npm install && npm run build` 통과 (TypeScript strict, `any` 없음)
- [x] 마이크/오디오/위치 권한 요청 없음 — `Info.plist`에 `NSMicrophoneUsageDescription` 등을 추가하지 마세요
- [x] `capacitor.config.ts`: appId `com.bellatrix.shyftstarter`, appName `ShyftStarter`, webDir `dist`
- [x] localhost / 개발 시크릿 참조 없음 (`grep -rn localhost src` → 0)
- [ ] 로컬 Mac에서 `npm run cap:sync` → `npx cap open ios` → 실기기 Run → 로그인·Today·체크인·회고·매니저 플로우 확인
- [ ] Xcode: Signing Team, 버전/빌드 번호 증가, 앱 아이콘, Archive → Distribute → TestFlight
- [ ] (선택) Supabase 연결 시 `.env`에 URL/anon key만 — service role 키는 절대 클라이언트에 넣지 않기
