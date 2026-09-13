# ShyftStarter — Shift Companion by Bellatrix

> **ShyftStarter는 스케줄링 앱도, HR 관리 도구도 아닙니다.** 고관여 리테일(초기: 전자제품 전문판매)
> 직원이 **근무 전 30초에 오늘 시도할 행동 하나를 준비하고, 현장에서 실행하고, 근무 후 5초 회고로
> 자신의 성장을 기록**하는 직원 중심 Shift Companion입니다. Bellatrix는 이 앱이 쌓는
> Intervention → Behaviour → Outcome 데이터를 바탕으로 Frontline Performance Intelligence로 확장합니다.

```
Shift → Signal → Action → Evidence → Behaviour → Outcome → Learning
Personal → Team → Paid Store → Brand/HQ → Bellatrix Intelligence
```

**Mandated distribution, voluntary engagement** — 회사가 배포해도, 직원은 자기 성장을 위해 계속 씁니다.

## 실행

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # tsc -b --noEmit
npm run lint         # oxlint
npm test             # vitest — 개인정보(visibility)·개인모드·KPI·CSV·인사이트 단위 테스트
npm run build        # production build → dist/
npm run cap:sync     # build + npx cap sync (ios/ android/ 는 로컬 Mac에만 존재)
```

백엔드 설정이 없으면(기본) **온디바이스 어댑터**로 동작합니다. Supabase를 연결하려면 `.env.example` →
`.env`에 URL/anon key를 채우고 `supabase/migrations/0001_*.sql`, `0002_*.sql`, `supabase/seed.sql`을
순서대로 적용합니다. 코드 변경 없이 `src/lib/repo/index.ts`가 어댑터를 전환합니다.

## 세 개의 가치 레이어

| 레이어 | 누가 | 무엇 |
|---|---|---|
| **Personal** | 팀 없이도 누구나 | My Shift(근무 등록) · My Goals(개인 목표) · Shift Prep(30초) · Reflection(5초) · Growth(My Wins) |
| **Team** | 초대 코드로 참여 | 팀 공지 · 인수인계 · Team Actions(매니저 배정) · 팀 미션 · 리액션/확인. 채팅 아님 |
| **Business** | 매니저/HQ | 액션 배정(캠페인 연결) · 빠른 관찰 · KPI 입력/CSV · 규칙 기반 주간 인사이트(가설 라벨) |

## 화면 구조

**직원** — 하단 탭 5개: **Today · My Shift · Actions · Team · Growth** (Profile은 Today 상단 아바타)
- **Today**: 오늘/다음 근무 → Shift Prep CTA(준비 전) 또는 오늘 해볼 행동(준비 후) → 근무 후 5초 회고 → 오늘의 내 목표(+로 시도 기록, **한 줄 기입으로 바로 추가**) → **팀 소식**(고정 공지·최근 인수인계·확인 인원) → 팀에서 받은 행동
- **Shift Prep** 시트: 행동 1개 · 스크립트 · 제품 포인트 · 예상 반론+대응 · 한 번 더 제안 팁 · **10초 확인**(오늘 카드의 반론을 문제로, 탭 한 번; 틀려도 정답 문장을 보여줌) · "오늘 해볼게요"
- **Reflection** 시트: 시도했나 / 고객 반응 / 다시 할까 (탭 3번) + 선택(팁 도움·자신감·잘한 점 한 줄). 기본 비공개
- **My Shift**: 다음 근무 히어로, 근무 등록(프리셋 3개 + 직접 입력), **반복 근무 편집**(요일 × 주 수), **월별 보기**, **캘린더로 내보내기**(.ics — iOS 공유 시트), 근무 시간 수정/삭제, 팀 소속이면 **팀 근무표 · 근무 교대**(교대 요청/승인, 구버전 시트 복구)
- **Actions**: 세그먼트 **My Goals**(추천 템플릿/직접 작성, 시도 +, 보관) | **Team Actions**(매니저 배정, "완료 여부는 매니저에게 보여요")
- **Team**: 팀 미션 요약 + 공지·인수인계 피드. 카드마다 **확인 N명**(누가·언제 확인했는지 펼쳐보기), 👍🙌❤️ **리액션**(공지·인수인계 모두), 인수인계에 **사진 첨부**(최대 3장, 기기에서 압축). 팀 없으면 참여 안내(선택)
- **Growth**: 다음 근무 추천 카드의 **2분 연습하기**(텍스트 롤플레이 2턴, 점수 없이 잘된 문장 하나·고쳐볼 문장 하나·예시 문장) · 지난 회고에서 팁이 아쉬웠으면 **다시 보기 한 문제** · 이번 주 시도/해낸 근무/팁 도움 비율 · **내 매출 · POS**(직원 본인 employee_id가 붙은 POS/CSV 행만: 이번 주 매출·UPT·거래, 지난주 대비, 일별 막대; 데이터 없으면 '연결 전' 상태) · My Wins · 행동별 시도 3주 · 자신감 흐름 · 주간 요약 · 다음 근무 추천(규칙 기반, 가설 표기). 순위·점수 없음, 비공개
- **Profile**: 팀 참여/떠나기, **누가 무엇을 볼 수 있나요** 표, 동의 토글(회고 공유 / 목표 집계 포함, 기본 OFF), 데이터 위치

**신규 사용자 흐름**: 로그인 화면 "새로 시작하기" → 이름·이메일·직군·관심 행동 → 팀 코드(건너뛰기) → 다음 근무(건너뛰기) → 목표 1개 → Today

**매니저** — 홈 / 인사이트 / KPI / 더보기. 홈·인사이트에 "직원의 개인 목표·회고는 보이지 않아요" 표시. 데모 계정에는 "데모 데이터" 배지.

## 개인 데이터 vs 팀 데이터 (visibility)

모든 기록 엔티티에 `visibility: 'private' | 'team' | 'manager_visible' | 'aggregated'`가 있고 기본값은 최소 공개입니다.

| 나만 보기 (private) | 매니저에게 보임 (manager_visible) | 팀에 공개 (team) |
|---|---|---|
| PersonalGoal · 시도 기록(ActionEvent personal_goal) · ShiftPrep · ShiftReflection · My Wins · 자신감 | Team Action 실행 상태·체크인 · ManagerObservation | 공지 · 인수인계 · 댓글 |

매출 데이터: 매장 합계(`outcome_events.user_id = null`)는 매니저만, **본인 employee_id가 붙은 행은 그 직원 본인도** 읽을 수 있습니다(`0003` 마이그레이션). 다른 직원의 매출은 보이지 않습니다.

- 강제 지점 2곳: `src/lib/repo/visibility.ts`(`applyVisibility`, 로컬·Supabase 어댑터 공통) + Supabase RLS(`0002` 마이그레이션). 매니저 데이터셋에는 `private` 행이 아예 포함되지 않습니다 (단위 테스트로 검증).
- 직원이 Profile에서 회고 공유를 켜면 **이후** 회고만 `manager_visible`로 저장됩니다. 지난 회고는 그대로 비공개.
- 매니저 화면은 개인 목표 목록을 받을 수 없고, 인사이트는 팀/매장 단위 집계만 사용합니다.

## 데이터 모델 (`src/types/bellatrix.ts`, DB 컬럼과 1:1)

User(store/team nullable, job_category, interests, consent, is_demo) · Team · TeamMembership · Store · Company · Shift(source self|roster) ·
**PersonalGoal** · **CoachingCard** · **ShiftPrep** · Action · ActionAssignment(campaign_id) · **Campaign** ·
**ActionEvent**(action_kind, source personal|team|manager|ai|system, event_type viewed…attempted…helpful, store/team/campaign 문맥, self_report, visibility) ·
BehaviourEvidence(visibility) · OutcomeEvent · **ShiftReflection**(tried, customer_reaction, try_again, tip_helpful, confidence, win_note, visibility) · Pilot · ProductEvent

## 코드 구조

| 경로 | 역할 |
|---|---|
| `src/lib/repo/` | `BellatrixRepo` 인터페이스 · `localRepo`(온디바이스) · `supabaseRepo` · `visibility.ts`(권한 필터) |
| `src/lib/bellatrixStore.tsx` | 세션/데이터셋/쓰기 작업(개인 목표·근무·준비·회고·팀 참여·동의) |
| `src/lib/analytics/` | KPI 파생 · 완료/시도율 · 그룹 비교 · 트렌드 · 주간 인사이트 · 다음 근무 추천(규칙) · 근거 신뢰도 |
| `src/lib/selectors.ts` | 다음 근무, 오늘 목표, Shift Prep 카드 선택 규칙 등 |
| `src/data/coachingCards.ts` | Shift Prep 콘텐츠(전자제품·뷰티 예시) + 추천 목표 템플릿 |
| `src/data/seed.ts` | 데모 매장 시드(`is_demo` 계정, 3주 샘플) |
| `src/screens/bellatrix/` | Today · MyShift · Actions · Team · Growth · Profile |
| `src/components/bellatrix/sheets/` | ShiftPrep · Reflection · GoalComposer · GoalDetail · ShiftComposer · ShiftDetail · JoinTeam · 팀 액션 시트 |
| `src/auth/`, `src/onboarding/` | LoginScreen(데모/새로 시작) · SignUpScreen · OnboardingScreen · SetupFlow |
| `src/manager/bellatrix/` | 매니저 홈 · 배정(캠페인) · 관찰 · KPI · CSV · 인사이트 |
| `src/__tests__/` | vitest 단위 테스트 |
| `supabase/migrations/` | `0001` 코어 스키마+RLS, `0002` 개인모드·팀·visibility·회고 재설계, `0003` 직원 본인 매출 행 읽기, `0004` quiz_answered·practiced 이벤트 |

## 카메라 권한 (iOS)

인수인계 사진 첨부는 `@capacitor/camera`를 사용합니다 (`src/lib/cameraAccess.ts`).
- 앱은 사진을 붙이기 직전에 **OS 권한 상태를 먼저 확인**하고, 아직 묻지 않았으면 그때 한 번 요청합니다. 거부된 상태면 "설정 → ShyftStarter → 카메라" 안내를 보여주고 카메라 버튼을 비활성화합니다.
- Profile → 데이터·개인정보에서 카메라/사진 권한 상태를 확인하고 요청할 수 있습니다.
- 브라우저(웹/미리보기 링크)에서는 OS 권한 API가 없어 `<input type="file">`로 자동 전환되고, 브라우저가 직접 권한을 묻습니다.

`git pull` 후 **`npm install && npx cap sync ios`** 로 플러그인을 설치하고, Xcode의 `ios/App/App/Info.plist`에 아래 두 키를 추가하세요 (없으면 카메라를 여는 순간 앱이 종료됩니다).

```xml
<key>NSCameraUsageDescription</key>
<string>인수인계에 진열대·재고 사진을 첨부하기 위해 카메라를 사용합니다.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>인수인계에 첨부할 사진을 보관함에서 고르기 위해 사용합니다.</string>
```

마이크(`NSMicrophoneUsageDescription`)·위치 키는 추가하지 마세요. 앱은 요청하지 않습니다.

## 금지 기능 (구현하지 않음)

마이크·녹음·전사, 고객 대화 수집, 얼굴 인식, GPS/지오펜싱, 상시 감시, 비밀 추적, 동의 없는 개인 기록 노출, 공개 순위표, 근거 없는 AI 평가.
KPI 개선은 UI 어디에서도 확인된 성과로 표현하지 않고 **검증할 가설**로 라벨링합니다.

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
