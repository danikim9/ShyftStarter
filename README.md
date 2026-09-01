# ShyftStarter — Prototype (v2: Shift Companion MVP)

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
