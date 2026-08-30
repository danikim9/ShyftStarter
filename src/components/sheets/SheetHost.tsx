import { Sheet } from '../Sheet'
import { useAppState } from '../../lib/store'
import { KillerScriptView } from './KillerScriptView'
import { ChecklistView, ChecklistFooter } from './ChecklistView'
import { QuestDetailView } from './QuestDetailView'
import { ShiftDetailView } from './ShiftDetailView'
import type { TabId } from '../BottomNav'

const TITLES: Record<string, string> = {
  killerScript: '킬러 스크립트',
  checklist: 'MICRO CHECKLIST',
  questDetail: '퀘스트',
  shiftDetail: '시프트 상세',
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
          onNavigate('quests')
        }}
      />
    )
  }

  return (
    <Sheet open={open} title={sheet.kind ? TITLES[sheet.kind] : ''} onClose={closeSheet} footer={footer}>
      {content}
    </Sheet>
  )
}
