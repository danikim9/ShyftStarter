import { Sheet } from '../Sheet'
import { useBellatrix } from '../../lib/bellatrixStore'
import { CoachingSheet } from './sheets/CoachingSheet'
import { CheckInSheet } from './sheets/CheckInSheet'
import { ActionDetailSheet } from './sheets/ActionDetailSheet'
import { ReflectionSheet } from './sheets/ReflectionSheet'
import { ShiftPrepSheet } from './sheets/ShiftPrepSheet'
import { GoalComposerSheet } from './sheets/GoalComposerSheet'
import { GoalDetailSheet } from './sheets/GoalDetailSheet'
import { ShiftComposerSheet } from './sheets/ShiftComposerSheet'
import { ShiftDetailSheet } from './sheets/ShiftDetailSheet'
import { JoinTeamSheet } from './sheets/JoinTeamSheet'
import { AssignActionSheet } from '../../manager/bellatrix/AssignActionSheet'
import { ObservationSheet } from '../../manager/bellatrix/ObservationSheet'
import { KpiSheet } from '../../manager/bellatrix/KpiSheet'
import { CsvImportSheet } from '../../manager/bellatrix/CsvImportSheet'

const TITLES = {
  coaching: '마이크로 코칭',
  checkin: '행동 체크인 · 20초',
  actionDetail: '팀 액션',
  shiftPrep: 'Shift Prep · 30초',
  reflection: '근무 후 5초',
  goalComposer: '내 목표 추가',
  goalDetail: '내 목표',
  shiftComposer: '근무 등록',
  shiftDetail: '근무',
  joinTeam: '팀 참여',
  assign: '액션 배정',
  observe: '빠른 관찰',
  kpi: '오늘 성과 입력',
  csvImport: 'KPI CSV 가져오기',
} as const

export function BxSheetHost() {
  const { sheet, closeSheet } = useBellatrix()
  const open = sheet !== null
  let content = null
  if (sheet?.kind === 'coaching') content = <CoachingSheet assignmentId={sheet.assignmentId} />
  else if (sheet?.kind === 'checkin') content = <CheckInSheet assignmentId={sheet.assignmentId} />
  else if (sheet?.kind === 'actionDetail') content = <ActionDetailSheet assignmentId={sheet.assignmentId} />
  else if (sheet?.kind === 'shiftPrep') content = <ShiftPrepSheet shiftId={sheet.shiftId} />
  else if (sheet?.kind === 'reflection') content = <ReflectionSheet shiftId={sheet.shiftId} />
  else if (sheet?.kind === 'goalComposer') content = <GoalComposerSheet />
  else if (sheet?.kind === 'goalDetail') content = <GoalDetailSheet goalId={sheet.goalId} />
  else if (sheet?.kind === 'shiftComposer') content = <ShiftComposerSheet presetDate={sheet.presetDate} />
  else if (sheet?.kind === 'shiftDetail') content = <ShiftDetailSheet shiftId={sheet.shiftId} />
  else if (sheet?.kind === 'joinTeam') content = <JoinTeamSheet />
  else if (sheet?.kind === 'assign') content = <AssignActionSheet presetUserId={sheet.presetUserId} />
  else if (sheet?.kind === 'observe') content = <ObservationSheet presetUserId={sheet.presetUserId} />
  else if (sheet?.kind === 'kpi') content = <KpiSheet presetDate={sheet.presetDate} />
  else if (sheet?.kind === 'csvImport') content = <CsvImportSheet />

  const key = sheet ? `${sheet.kind}:${'assignmentId' in sheet ? sheet.assignmentId : 'shiftId' in sheet ? sheet.shiftId : 'goalId' in sheet ? sheet.goalId : ''}` : 'none'
  return (
    <Sheet open={open} title={sheet ? TITLES[sheet.kind] : ''} onClose={closeSheet}>
      <div key={key}>{content}</div>
    </Sheet>
  )
}
