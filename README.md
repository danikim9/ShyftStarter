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

**직원** — 하단 탭 3개: **오늘 · 팀 · 성장**. 근무 전·중·후에 꼭 필요한 것만 첫 화면에 두고, 나머지는 한 번 더 눌러야 나와요.

- **오늘**: 근무 단계에 따라 히어로 카드가 바뀌어요.
  - **근무 전** — 오늘의 미션 1개(팀 액션 > 내 목표 > 추천 순) + 스크립트 한 줄 + `미션 확인 · 30초`(Shift Prep)
  - **근무 중** — 미션 + 큰 `시도했어요` 버튼 한 번 탭(팀 액션이면 진행도, 내 목표면 시도 횟수, 목표가 없으면 미션 카드로 목표를 만들어 기록) + `팁 다시 보기` + `인수인계 남기기`(팀 없으면 `미리 회고`)
  - **근무 후** — `5초 회고`(탭 3번) → 완료 후 시도 횟수와 `오늘의 성장 보기`
  - 아래: **팀 소식**(고정 공지·최근 인수인계·확인 인원) → **이번 주 근무** 7칸(탭하면 근무표) → **목표 · 팀 액션**(서브 화면)
- **팀**: 세그먼트 **소식 | 근무표**. 소식 = 공지·인수인계(확인 N명, 리액션, 사진 첨부). 근무표 = 다음 근무, **팀 근무표**(매니저가 올린 실제 근무표, 이번 주/다음 주, 내 행 고정), 근무 등록·반복, 내 예정/지난 근무
- **성장** (지나온 근거): 이번 주 시도·해낸 근무·팁 도움, My Wins, 행동별 시도 3주. 순위·점수 없음, 비공개
- **목표 · 팀 액션** (오늘 → 서브 화면): 다음 근무 추천, My Goals(추천 템플릿/직접 작성, 보관), Team Actions(오늘·예정·지난 7일)
- **Profile** (오늘 상단 아바타): 팀 참여/떠나기, 누가 무엇을 볼 수 있나요, 동의 토글, 데이터 위치

**기능 플래그 (`src/lib/features.ts`)** — 아래는 코드가 남아 있고 기본 OFF예요. 한 줄 바꾸면 다시 켜져요.
월별 보기 · .ics 내보내기 · 근무 교대(구버전 목업 로스터) · Shift Prep 10초 확인 · 2분 롤플레이 · 10초 퀴즈 · 내 매출 POS · 자신감 흐름 · 주간 요약 · 매니저 전체 인사이트 탭 · 매니저 구버전 도구(더보기)

**신규 사용자 흐름**: 로그인 화면 "새로 시작하기" → 이름·이메일·직군·관심 행동 → 팀 코드(건너뛰기) → 다음 근무(건너뛰기) → 목표 1개 → Today

**매니저** — 하단 탭 3개: **오늘 · 팀 · KPI**. 매니저의 핵심 셋(인력 관리 · 손쉬운 코칭 · KPI)에 하나씩 대응해요. 모든 화면에 "직원의 개인 목표·회고는 보이지 않아요" 표시, 데모 계정에는 "데모 데이터" 배지.
- **오늘**: 위에서 아래로 하루 순서예요. ① **오늘 근무 N명**(실제 근무표, 이름 탭 → 팀원 상세, `관찰` 한 번 탭) ② **오늘 KPI**(입력 전엔 `오늘 성과 입력` 한 카드, 입력 후엔 CVR · AOV · UPT 타일 + 어제 대비) ③ **오늘 코칭 한 사람**(근거 우선순위 1위 한 명 + `코칭 가이드 · 카드 보내기` / `지금 관찰`) ④ 팀 액션 배정 한 줄
- **팀** = 세그먼트 **팀원 | 근무표**
  - **팀원**: 직원별 카드 — 오늘 근무 여부, 코칭 필요 표시 수, 데이터에서 나온 신호 한 줄, 행동 5개 칩(꾸준히 보임 / 더 볼 것 / 근거 부족 — **점수·등급 없음**), `관찰` · `배정` · `코칭 가이드`. "이번 주 먼저 볼 사람"이 위로 정렬.
  - **팀원 상세 시트**: 오늘 근무 · `지금 관찰 기록` · `액션 배정` → 행동 근거 → 최근 관찰 → **1:1 코칭 가이드 5단계** → `코칭 카드 보내기`(같은 날 중복 방지) → `이번 주 근무 보기`
  - **근무표**: 직원 × 7일(이번 주/다음 주). 셀 탭 → 프리셋(오픈/미들/마감)·직접 입력·"다음 주 같은 요일에도"·휴무. 실제 `shifts` 행(`source: 'roster'`)이 되어 직원 팀 탭의 근무표에 바로 보임.
- **KPI**: `오늘 성과 입력`(방문·거래·매출·수량 **네 칸**, 부가상품은 접힌 선택 항목) → **이번 주 vs 지난주**(월~오늘 합계 기준 CVR · AOV · UPT, 지난주 같은 요일과 비교) → **최근 7일** 표(날짜 탭으로 수정) → **이번 주 신호**(규칙 기반 인사이트 상위 3개, 근거 강도 배지, "상관관계 ≠ 인과관계") · CSV 가져오기. 지표 정의: `src/lib/analytics/kpiSummary.ts`(합계의 비율, 일별 비율 평균 아님).
- 플래그 OFF: 전체 주간 인사이트 탭(`managerInsights`), 더보기 구버전 도구(`managerLegacyTools` — 팀 액션·공지 구버전, 근무표 목업, Will × Capability 매트릭스)

## 개인 데이터 vs 팀 데이터 (visibility)

> 근무 **시간**은 팀 안에서 서로 보여요(근무표). 그 외 팀원의 목표·준비·회고·시도 기록은 절대 보이지 않아요. 팀이 없는 사람은 자기 근무만 받아요.

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
| `src/lib/analytics/` | KPI 파생 · 완료/시도율 · 그룹 비교 · 트렌드 · 주간 인사이트 · 다음 근무 추천(규칙) · 근거 신뢰도 · `team.ts`(매니저용 팀원 프로필·1:1 코칭 가이드) |
| `src/lib/selectors.ts` | 다음 근무, 오늘 목표, Shift Prep 카드 선택 규칙 등 |
| `src/data/coachingCards.ts` | Shift Prep 콘텐츠(전자제품·뷰티 예시) + 추천 목표 템플릿 |
| `src/data/seed.ts` | 데모 매장 시드(`is_demo` 계정, 3주 샘플) |
| `src/screens/bellatrix/` | Today · MyShift · Actions · Team · Growth · Profile |
| `src/components/bellatrix/sheets/` | ShiftPrep · Reflection · GoalComposer · GoalDetail · ShiftComposer · ShiftDetail · JoinTeam · 팀 액션 시트 |
| `src/auth/`, `src/onboarding/` | LoginScreen(데모/새로 시작) · SignUpScreen · OnboardingScreen · SetupFlow |
| `src/manager/bellatrix/` | 매니저 홈 · **TeamView(팀원/근무표) · MemberDetailSheet · RosterGrid · RosterCellSheet** · 배정(캠페인) · 관찰 · KPI · CSV · 인사이트 |
| `src/__tests__/` | vitest 단위 테스트 |
| `supabase/migrations/` | `0001` 코어 스키마+RLS, `0002` 개인모드·팀·visibility·회고 재설계, `0003` 직원 본인 매출 행 읽기, `0004` quiz_answered·practiced 이벤트, `0005` 매니저의 매장 근무표 쓰기(shifts update/delete), `0006` 같은 팀 근무 시간 읽기(근무표) |

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

## 이전 버전(v2 Shift Companion) 문서에 대하여

v2 "Shift Companion" 시절 README 본문은 삭제했습니다. 당시 문서에 적혀 있던
Executive Dashboard · ROI 상관분석 · 공개 리더보드 · 좌석 기반 수익화 사다리는
**모두 폐기된 방향**이며, 위 "금지 기능" 항목과 정면으로 충돌합니다. 현행 사양은
이 문서의 윗부분이 유일한 기준입니다.

폐기 사유를 요약하면 다음과 같습니다.

| 폐기된 v2 내용 | 사유 |
|---|---|
| Executive Dashboard · "ROI 상관분석" 화면 | 목업 데이터로 만든 시연용 화면이었고, 실측 데이터가 아님. `src/exec/*`는 `App.tsx`에서 import되지 않아 UI에서 도달 불가하며 삭제 예정 |
| 체크리스트 이수율 × 객단가 상관계수 등 수치 | **목업 데이터로 계산한 값이며 실제 매장에서 측정된 결과가 아님.** 어떤 대외 자료에도 사용하지 않음 |
| 공개 리더보드 · Recognition 순위 | "공개 순위표 없음"이 현행 제품 원칙이므로 폐기 |
| Will × Capability 매트릭스 | 근거 없는 직원 분류로 읽힐 수 있어 기본 OFF (`managerLegacyTools`) |
| 좌석/티어 기반 수익화 사다리 v2 | 매장 단위 과금으로 재설계됨. 가격은 저장소가 아닌 사업 문서에서 관리 |
| 3개 폴더(employee/manager/executive) 분리 구조 | 단일 앱으로 통합됨 |

v2 코드 일부는 기능 플래그 뒤에 남아 있습니다(위 "기능 플래그" 항목 참고).

---

## TestFlight 체크리스트 (이 저장소 기준)

- [x] `npm install && npm run build` 통과 (TypeScript strict, `any` 없음)
- [x] 마이크/오디오/위치 권한 요청 없음 — `Info.plist`에 `NSMicrophoneUsageDescription` 등을 추가하지 마세요
- [x] `capacitor.config.ts`: appId `com.bellatrix.shyftstarter`, appName `ShyftStarter`, webDir `dist`
- [x] localhost / 개발 시크릿 참조 없음 (`grep -rn localhost src` → 0)
- [ ] 로컬 Mac에서 `npm run cap:sync` → `npx cap open ios` → 실기기 Run → 로그인·Today·체크인·회고·매니저 플로우 확인
- [ ] Xcode: Signing Team, 버전/빌드 번호 증가, 앱 아이콘, Archive → Distribute → TestFlight
- [ ] (선택) Supabase 연결 시 `.env`에 URL/anon key만 — service role 키는 절대 클라이언트에 넣지 않기
