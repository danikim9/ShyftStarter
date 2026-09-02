import { JoinTeamForm } from './JoinTeamForm'

export function JoinTeamScreen({ onDone }: { onDone: () => void }) {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#f3edff_0%,_#ffffff_55%)] flex items-center justify-center py-0 sm:py-8 px-0 sm:px-4">
      <div className="relative w-full max-w-[430px] h-[100dvh] sm:h-[880px] sm:rounded-[2.75rem] sm:border sm:border-ink-950/8 overflow-hidden flex flex-col bg-paper sm:shadow-[0_30px_80px_-20px_rgba(139,92,246,0.25)] px-7">
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="w-14 h-14 rounded-2xl bg-ink-950/8 flex items-center justify-center text-2xl mb-5">🏬</div>
          <h1 className="text-ink-950 text-lg font-bold mb-1.5 text-center">근무하는 매장에 참여해보세요</h1>
          <p className="text-ink-950/40 text-sm text-center leading-relaxed mb-8">
            매니저나 동료가 공유한 코드나 링크가 있다면
            <br />
            지금 입력하고 팀 공지·인수인계를 바로 받아보세요
          </p>
          <div className="w-full">
            <JoinTeamForm onSuccess={onDone} />
          </div>
        </div>

        <div className="pb-10 text-center">
          <button onClick={onDone} className="text-xs text-ink-950/30 hover:text-ink-950/50 transition">
            코드가 없으신가요? 나중에 할게요
          </button>
        </div>
      </div>
    </div>
  )
}
