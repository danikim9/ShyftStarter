import { Sheet } from '../Sheet'
import { useBellatrix } from '../../lib/bellatrixStore'
import { CoachingSheet } from './sheets/CoachingSheet'
import { CheckInSheet } from './sheets/CheckInSheet'
import { ActionDetailSheet } from './sheets/ActionDetailSheet'
import { ReflectionSheet } from './sheets/ReflectionSheet'
import { AssignActionSheet } from '../../manager/bellatrix/AssignActionSheet'
import { ObservationSheet } from '../../manager/bellatrix/ObservationSheet'
import { KpiSheet } from '../../manager/bellatrix/KpiSheet'
import { CsvImportSheet } from '../../manager/bellatrix/CsvImportSheet'

const TITLES = {
  coaching: '마이크로 코칭',
  checkin: '행동 체크인 · 20초',
  actionDetail: '액션',
  reflection: '오늘 회고 · 3문항',
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
  else if (sheet?.kind === 'reflection') content = <ReflectionSheet />
  else if (sheet?.kind === 'assign') content = <AssignActionSheet presetUserId={sheet.presetUserId} />
  else if (sheet?.kind === 'observe') content = <ObservationSheet presetUserId={sheet.presetUserId} />
  else if (sheet?.kind === 'kpi') content = <KpiSheet presetDate={sheet.presetDate} />
  else if (sheet?.kind === 'csvImport') content = <CsvImportSheet />

  return (
    <Sheet open={open} title={sheet ? TITLES[sheet.kind] : ''} onClose={closeSheet}>
      {/* key forces a fresh form per sheet instance */}
      <div key={sheet ? `${sheet.kind}:${'assignmentId' in sheet ? sheet.assignmentId : ''}` : 'none'}>{content}</div>
    </Sheet>
  )
}
