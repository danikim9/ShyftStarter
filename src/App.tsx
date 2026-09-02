import { useState } from 'react'
import { Smartphone, LayoutDashboard, LineChart, LogOut } from 'lucide-react'
import { AppStateProvider } from './lib/store'
import { LoginScreen, type UserRole } from './auth/LoginScreen'
import { OnboardingScreen } from './onboarding/OnboardingScreen'
import { BottomNav, type TabId } from './components/BottomNav'
import { SheetHost } from './components/sheets/SheetHost'
import { Toast } from './components/Toast'
import { MoodCheckIn } from './components/MoodCheckIn'
import { Home } from './screens/Home'
import { Schedule } from './screens/Schedule'
import { Quests } from './screens/Quests'
import { Stats } from './screens/Stats'
import { Coach } from './screens/Coach'
import { Progress } from './screens/Progress'
import { Team } from './screens/Team'
import { MyShift } from './screens/MyShift'
import { TeamFeed } from './screens/TeamFeed'
import { MyActions } from './screens/MyActions'
import { ManagerDashboard } from './manager/ManagerDashboard'
import { ExecutiveDashboard } from './exec/ExecutiveDashboard'

type Persona = 'employee' | 'manager' | 'executive'

// 23차 — 라이트 테마 전환. 예전엔 어두운 배경 위 반투명 흰색 pill로 떠 보이게
// 했지만, 이제 배경 자체가 흰색이라 옅은 라벤더 그레이(ink-900) 바탕 +
// 그림자로 떠 보이게 하고, 선택된 항목은 흰 pill(그림자)로 한 단계 더 떠
// 보이게 한다 — iOS 세그먼트 컨트롤과 같은 방식.
function PersonaSwitcher({ persona, onChange }: { persona: Persona; onChange: (p: Persona) => void }) {
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[60] flex items-center gap-0.5 rounded-full bg-ink-900 border border-ink-950/8 p-1 shadow-md"
      style={{ top: 'max(0.75rem, var(--safe-top))' }}
    >
      {(
        [
          { id: 'employee' as const, label: 'Employee App', icon: Smartphone },
          { id: 'manager' as const, label: 'Manager Dashboard', icon: LayoutDashboard },
          { id: 'executive' as const, label: 'Executive Dashboard', icon: LineChart },
        ]
      ).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
            persona === id ? 'bg-white text-brand-600 shadow-sm' : 'text-ink-950/45 hover:text-ink-950/75'
          }`}
        >
          <Icon size={12} />
          {label}
        </button>
      ))}
    </div>
  )
}

// 27차 — 직원+매니저 통합 링크(Employee 아티팩트)에서 매니저 역할로 로그인한
// 사람에게만 보이는 전환 버튼. 하나의 버튼으로 Employee 화면 ↔ Manager
// Dashboard를 오간다(요청: "하나의 앱에서 하나의 버튼으로 화면을 돌아가며
// 볼 수 있는 방법"). 직원 역할에는 이 버튼 자체가 렌더링되지 않아 매니저
// 대시보드로 가는 진입점이 없다.
// 위치는 상단이 아니라 우하단 FAB(둥실 뜬 버튼)로 뒀다 — 상단은 이미
// Employee의 StatusBar 워드마크, Manager 모바일 상단 바(StoreSwitcher+아바타),
// Manager 데스크톱 사이드바 로고, LogoutButton까지 화면마다 제각각 요소가
// 꽉 차 있어 어느 한 자리도 겹치지 않게 끼워 넣을 자리가 없었다. 실측
// (Playwright bounding box)으로 Employee BottomNav(63px)·Manager 모바일
// 하단 탭바(51px) 높이를 확인해 `bottom-20`(80px)이면 뷰포트 어디서도 겹치지
// 않는 것을 확인 후 이 위치로 통일했다.
// 28차 후속 — 실제 아이폰에서 확인해보니 두 하단 탭바 모두 안전 영역
// (`env(safe-area-inset-bottom)`)만큼 실제 높이가 더 커지는데(BottomNav/
// ManagerBottomNav 둘 다 이미 이 패딩을 쓰고 있음), 이 버튼은 고정
// `bottom-20`이라 안전 영역이 큰 기기에서는 탭바 상단에 살짝 가려질 수
// 있었다 — `bottom: calc(5rem + env(safe-area-inset-bottom))`로 바꿔 탭바가
// 커지는 만큼 버튼도 함께 밀어 올린다.
function ManagerToggleButton({ view, onToggle }: { view: 'employee' | 'manager'; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={view === 'employee' ? '매니저 대시보드로 전환' : '내 화면으로 돌아가기'}
      className="fixed right-4 z-[70] flex items-center gap-1.5 rounded-full bg-ink-950 shadow-lg shadow-ink-950/20 px-3.5 py-2.5 text-xs font-semibold text-white hover:opacity-90 transition"
      style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
    >
      {view === 'employee' ? (
        <>
          <LayoutDashboard size={13} /> 매니저 대시보드
        </>
      ) : (
        <>
          <Smartphone size={13} /> 내 화면으로
        </>
      )}
    </button>
  )
}

// 28차 — 실제 아이폰(홈 화면에 추가/전체화면)에서 열어보니 이 앱은 폰 프레임
// 목업이 아니라 화면 전체를 그대로 채우는데(작은 화면에서는 sm: 스타일이
// 빠지며 h-[100dvh]로 실제 뷰포트를 꽉 채움), 실기기의 노치/다이나믹 아일랜드
// 상태 표시줄 영역(`env(safe-area-inset-top)`)을 전혀 고려하지 않고 있었다 —
// 그래서 이 fixed 로그아웃 버튼과 아래 StatusBar의 가짜 시계·워드마크가 실제
// 기기 상태 표시줄과 그대로 겹쳐 눌리지도, 읽히지도 않는 버그가 났다.
// `max(0.75rem, env(safe-area-inset-top))`로 기존 여백(12px)과 실제 안전
// 영역 중 더 큰 값을 쓰도록 해서, 프리뷰(안전 영역 0)에서는 기존 그대로,
// 노치 있는 실기기에서는 상태 표시줄 아래로 자연스럽게 내려간다.
function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <button
      onClick={onLogout}
      title="로그아웃 (데모 재시작)"
      className="fixed right-3 z-[60] w-8 h-8 rounded-full bg-ink-900 border border-ink-950/8 shadow-md flex items-center justify-center text-ink-950/50 hover:text-ink-950/80 transition"
      style={{ top: 'max(0.75rem, var(--safe-top))' }}
    >
      <LogOut size={13} />
    </button>
  )
}

function StatusBar() {
  return (
    <div
      className="shrink-0 flex items-center justify-between px-6 pb-1 text-ink-950 text-[13px] font-semibold"
      style={{ paddingTop: 'max(0.75rem, var(--safe-top))' }}
    >
      <span>9:41</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] tracking-wide text-ink-950/50 font-medium">ShyftStarter</span>
      </div>
    </div>
  )
}

function Screen({ tab, onNavigate }: { tab: TabId; onNavigate: (t: TabId) => void }) {
  switch (tab) {
    case 'home':
      return <Home onNavigate={onNavigate} />
    case 'schedule':
      return <Schedule />
    case 'quests':
      return <Quests />
    case 'stats':
      return <Stats />
    case 'coach':
      return <Coach />
    case 'progress':
      return <Progress />
    case 'team':
      return <Team />
    case 'myShift':
      return <MyShift onNavigate={onNavigate} />
    case 'teamFeed':
      return <TeamFeed />
    case 'myActions':
      return <MyActions />
  }
}

// 23차 — 밝고 귀여운 라이트 테마. 짙은 남색 라디얼 그라디언트 대신 아주
// 옅은 라벤더 → 흰색으로 은은하게 퍼지는 파스텔 그라디언트를 바깥 배경으로,
// 폰 프레임 안쪽은 순백(--color-paper)으로 채운다. 그림자도 짙은 검정 대신
// 브랜드 컬러가 살짝 배어 나오는 부드러운 그림자로.
const APP_BACKDROP = 'bg-[radial-gradient(circle_at_top,_#f3edff_0%,_#ffffff_55%)]'
const PHONE_SHADOW = 'sm:shadow-[0_30px_80px_-20px_rgba(139,92,246,0.25)]'

// 32차 — "매장 코드로 참여하면 화면이 확대되고 오른쪽 고정 버튼/워드마크가
// 잘려 보인다"는 스크린샷 리포트를 다시 조사하다가, 지금까지 놓치고 있던
// CSS 구조적 원인 하나를 찾았다: LogoutButton·PersonaSwitcher·
// ManagerToggleButton·BottomNav·ManagerBottomNav 등 이 앱의 "고정" UI는 전부
// `position: fixed`를 쓰는데, `fixed`는 CSS 스펙상 조상 중 아무도
// transform/filter/perspective 등으로 "새 containing block"을 만들지 않으면
// 이 폰 프레임 div(`max-w-[430px]`로 화면을 시뮬레이션하는 그 컨테이너)가
// 아니라 브라우저의 실제 레이아웃 뷰포트를 기준으로 위치가 계산된다. 평소
// (레이아웃 뷰포트 = 화면 폭)에는 두 기준이 같아서 문제가 안 보이지만,
// 실기기에서 한 번이라도 레이아웃 뷰포트가 화면 폭보다 넓어지는 순간(다른
// 원인의 렌더링 차이로 아주 살짝이라도 내용이 넘치는 경우 등, 이 환경의
// 헤드리스 Chromium에서는 폰트 렌더링 차이로 재현되지 않음)부터는 이
// `fixed` 요소들이 "화면 오른쪽 끝"이 아니라 "더 넓은 레이아웃 뷰포트의
// 오른쪽 끝"에 붙어버려, 실제 화면 밖으로 밀려나거나 잘려 보이게 된다 —
// 스크린샷에서 워드마크·매니저 버튼이 잘려 보이던 것과 정확히 일치하는
// 증상이다. `transform: translateZ(0)`(시각적으로 아무 변화 없는 3D
// transform)를 이 폰 프레임 컨테이너들에 걸어 이 컨테이너 자체를 모든 자식
// `fixed` 요소의 기준점으로 명시적으로 고정시켰다 — 이제 어떤 조건에서도
// `fixed` 요소는 이 컨테이너(=화면에 보이는 영역) 밖으로 나갈 수 없다.
// 근본 원인(무엇이 애초에 레이아웃 뷰포트를 넓혔는지)은 여전히 실기기에서만
// 재현되는 폰트/렌더링 차이라 이 환경에서 확정할 수 없지만, 이 수정은 그
// 원인이 무엇이든 상관없이 결과(고정 UI가 화면 밖으로 잘리는 것)를 구조적으로
// 막는다.
const FIXED_CONTAINMENT = { transform: 'translateZ(0)' } as const

function EmployeeAppShell() {
  const [tab, setTab] = useState<TabId>('myShift')

  return (
    <div className={`min-h-screen w-full ${APP_BACKDROP} flex items-center justify-center py-0 sm:py-8 px-0 sm:px-4`}>
      <div
        className={`relative w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:rounded-[2.75rem] sm:border sm:border-ink-950/8 overflow-hidden flex flex-col bg-paper ${PHONE_SHADOW}`}
        style={FIXED_CONTAINMENT}
      >
        <StatusBar />
        <div className="relative grow overflow-y-auto app-scroll">
          <Screen tab={tab} onNavigate={setTab} />
        </div>
        <BottomNav active={tab} onChange={setTab} />
        <SheetHost onNavigate={setTab} />
        <MoodCheckIn />
        <Toast />
      </div>
    </div>
  )
}

function ManagerAppShell() {
  return (
    <div className={`h-screen w-full ${APP_BACKDROP} relative overflow-hidden`} style={FIXED_CONTAINMENT}>
      <ManagerDashboard />
      <Toast />
    </div>
  )
}

function ExecutiveAppShell() {
  return (
    <div className={`h-screen w-full ${APP_BACKDROP} relative overflow-hidden`} style={FIXED_CONTAINMENT}>
      <ExecutiveDashboard />
    </div>
  )
}

// 19차 — 로그인 직후 매장/그룹 코드를 받던 별도 'join' 스테이지를 없앴다.
// 그 온보딩 내용은 Team 탭 안으로 그대로 옮겨졌다(TeamFeed.tsx의
// OnboardingJoinSection 참고) — 로그인하면 바로 앱으로 들어간다.
// 22차 — 로그인 버튼 화면 앞에 붙는 3장짜리 소개 랜딩('onboarding')을
// 새로 추가했다. 처음 앱을 여는 사람만 거치면 되는 화면이라 로그아웃
// 버튼(데모 재시작)은 여기를 건너뛰고 바로 'login'으로 보낸다.
// 24차 — 팀원/매니저/이그제큐티브를 하나의 아티팩트에서 상단 스위처로 넘나들던
// 걸, 세 개의 독립된 아티팩트(개별 링크)로 나눴다. 빌드 시점에 VITE_PERSONA
// 환경 변수로 "이 빌드는 어떤 페르소나 전용인지"를 고정한다 —
//   VITE_PERSONA=employee  → 온보딩→로그인→Employee App만(스위처 없음, 팀원용 링크)
//   VITE_PERSONA=manager   → 로그인 없이 곧장 Manager Dashboard만(관리자용 링크)
//   VITE_PERSONA=executive → 로그인 없이 곧장 Executive Dashboard만(경영진용 링크)
//   (미설정, 즉 `npm run dev` 등 일반 개발 빌드) → 기존처럼 스위처로 세 페르소나를
//   모두 오갈 수 있는 통합 빌드 — 로컬에서 세 화면을 한 번에 확인/디버그할 때 사용.
const PERSONA_LOCK = import.meta.env.VITE_PERSONA

type Stage = 'onboarding' | 'login' | 'app'

export default function App() {
  const [stage, setStage] = useState<Stage>('onboarding')
  const [persona, setPersona] = useState<Persona>(PERSONA_LOCK ?? 'employee')
  const [role, setRole] = useState<UserRole>('employee')
  const [managerView, setManagerView] = useState<'employee' | 'manager'>('employee')

  if (PERSONA_LOCK === 'manager') {
    return (
      <AppStateProvider>
        <ManagerAppShell />
      </AppStateProvider>
    )
  }
  if (PERSONA_LOCK === 'executive') {
    return (
      <AppStateProvider>
        <ExecutiveAppShell />
      </AppStateProvider>
    )
  }

  // 27차 — Employee 아티팩트(팀원용 배포 링크)를 "직원+매니저 통합 앱"으로
  // 재정의: 로그인 시 고른 역할(role)이 'manager'면 상단에 ManagerToggleButton이
  // 나타나 Employee 화면 ↔ Manager Dashboard를 하나의 버튼으로 오갈 수 있다.
  // 'employee'면 이 버튼 자체가 없어 매니저 대시보드로 갈 방법이 없다 —
  // Executive는 26차에서 확정한 대로 별도 웹 전용 링크로 그대로 둔다(이 분기와
  // 무관). 기존에 있었던 3-way PersonaSwitcher(개발용 통합 빌드 전용, 아래
  // 참고)와는 별개의 새 분기로 만들어, 배포되는 Employee 링크와 로컬 개발용
  // `npm run dev` 빌드의 동작이 서로 뒤섞이지 않게 했다.
  if (PERSONA_LOCK === 'employee') {
    return (
      <AppStateProvider>
        {stage === 'onboarding' && <OnboardingScreen onDone={() => setStage('login')} />}
        {stage === 'login' && (
          <LoginScreen
            onLogin={(_, chosenRole) => {
              setRole(chosenRole)
              setManagerView('employee')
              setStage('app')
            }}
          />
        )}
        {stage === 'app' && (
          // 32차 — ManagerToggleButton/LogoutButton은 EmployeeAppShell/
          // ManagerAppShell 내부가 아니라 이 레벨의 형제로 렌더된다 —
          // 그래서 각 Shell 내부 폰 프레임 div에 건 `transform`
          // containment(위 FIXED_CONTAINMENT 참고)가 이 두 버튼에는 전혀
          // 적용되지 않았었다(데스크톱 프리뷰에서 두 버튼이 폰 목업이
          // 아니라 브라우저 창 진짜 모서리에 붙는 것으로 확인). 이 버튼들을
          // 포함한 전체를 감싸는 이 래퍼 자체에 transform을 걸어, `fixed`인
          // 두 버튼도 Shell 내부 요소들과 동일하게 "화면(뷰포트)" 기준으로
          // 정확히 고정되도록 했다.
          <div className="relative" style={FIXED_CONTAINMENT}>
            {role === 'manager' && (
              <ManagerToggleButton
                view={managerView}
                onToggle={() => setManagerView((v) => (v === 'employee' ? 'manager' : 'employee'))}
              />
            )}
            <LogoutButton
              onLogout={() => {
                setStage('login')
                setRole('employee')
                setManagerView('employee')
              }}
            />
            {role === 'manager' && managerView === 'manager' ? <ManagerAppShell /> : <EmployeeAppShell />}
          </div>
        )}
      </AppStateProvider>
    )
  }

  // 미설정 — 로컬 `npm run dev` 등 일반 개발 빌드에서만 쓰는 통합 경로.
  // 세 페르소나를 한 번에 확인/디버그해야 하므로 역할 게이팅 없이 기존
  // 3-way PersonaSwitcher를 그대로 유지한다.
  return (
    <AppStateProvider>
      {stage === 'onboarding' && <OnboardingScreen onDone={() => setStage('login')} />}
      {stage === 'login' && <LoginScreen onLogin={() => setStage('app')} />}
      {stage === 'app' && (
        // 32차 — 위 employee-lock 분기와 동일한 이유로, 개발 통합 빌드의
        // PersonaSwitcher/LogoutButton도 이 래퍼에 transform containment를
        // 걸어야 실제로 화면 밖으로 안 나간다.
        <div className="relative" style={FIXED_CONTAINMENT}>
          <PersonaSwitcher persona={persona} onChange={setPersona} />
          <LogoutButton onLogout={() => setStage('login')} />
          {persona === 'employee' && <EmployeeAppShell />}
          {persona === 'manager' && <ManagerAppShell />}
          {persona === 'executive' && <ExecutiveAppShell />}
        </div>
      )}
    </AppStateProvider>
  )
}
