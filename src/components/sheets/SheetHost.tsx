import { Sheet } from '../Sheet'
import { useAppState } from '../../lib/store'
import { KillerScriptView } from './KillerScriptView'
import { ChecklistView, ChecklistFooter } from './ChecklistView'
import { QuestDetailView } from './QuestDetailView'
import { ShiftDetailView } from './ShiftDetailView'
import { LearnView } from './LearnView'
import { RolePlayView } from './RolePlayView'
import { HandoverComposer } from './HandoverComposer'
import { ActionComposer } from './ActionComposer'
import { AnnouncementComposer } from './AnnouncementComposer'
import { JoinTeamForm } from '../../auth/JoinTeamForm'
import { TeamScheduleView } from './TeamScheduleView'
import { ReminderComposer } from './ReminderComposer'
import { WageCalculatorView } from './WageCalculatorView'
import type { TabId } from '../BottomNav'

const TITLES: Record<string, string> = {
  killerScript: '킬러 스크립트',
  checklist: 'MICRO CHECKLIST',
  questDetail: '퀘스트',
  shiftDetail: '시프트 상세',
  learn: '마이크로 러닝',
  rolePlay: 'AI ROLE-PLAY',
  handoverCompose: '인수인계 남기기',
  actionCompose: '할 일 추가',
  announcementCompose: '공지 작성',
  joinTeam: '팀 참여',
  teamSchedule: '근무 일정',
  reminderCompose: '리마인더 추가',
  wageCalculator: '예상 급여',
}

export function SheetHost({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { sheet, closeSheet } = useAppState()
  const open = sheet.kind !== null

  let content = null
  let footer = null

  if (sheet.kind === 'killerScript' && sheet.skillId) {
    content = <KillerScriptView skillId={sheet.skillId} />
  } else if (sheet.kind === 'checklist') {
    content = <ChecklistView />
    footer = <ChecklistFooter />
  } else if (sheet.kind === 'questDetail' && sheet.questId) {
    content = <QuestDetailView questId={sheet.questId} />
  } else if (sheet.kind === 'shiftDetail' && sheet.shiftId) {
    content = (
      <ShiftDetailView
        shiftId={sheet.shiftId}
        onViewQuests={() => {
          closeSheet()
          onNavigate('myActions')
        }}
      />
    )
  } else if (sheet.kind === 'learn') {
    content = <LearnView />
  } else if (sheet.kind === 'rolePlay') {
    content = <RolePlayView />
  } else if (sheet.kind === 'handoverCompose') {
    content = <HandoverComposer />
  } else if (sheet.kind === 'actionCompose') {
    content = <ActionComposer />
  } else if (sheet.kind === 'announcementCompose') {
    content = <AnnouncementComposer />
  } else if (sheet.kind === 'joinTeam') {
    content = <JoinTeamForm onSuccess={closeSheet} />
  } else if (sheet.kind === 'teamSchedule') {
    content = (
      <TeamScheduleView
        onGoToTeam={() => {
          closeSheet()
          onNavigate('teamFeed')
        }}
      />
    )
  } else if (sheet.kind === 'reminderCompose') {
    content = <ReminderComposer />
  } else if (sheet.kind === 'wageCalculator') {
    content = <WageCalculatorView />
  }

  return (
    <Sheet open={open} title={sheet.kind ? TITLES[sheet.kind] : ''} onClose={closeSheet} footer={footer}>
      {content}
    </Sheet>
  )
}
