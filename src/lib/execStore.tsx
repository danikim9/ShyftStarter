import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type ExecView = 'overview' | 'roi'

interface ExecStateShape {
  view: ExecView
  setView: (v: ExecView) => void
}

const ExecStateContext = createContext<ExecStateShape | null>(null)

export function ExecStateProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ExecView>('overview')
  const value = useMemo<ExecStateShape>(() => ({ view, setView }), [view])
  return <ExecStateContext.Provider value={value}>{children}</ExecStateContext.Provider>
}

export function useExecState() {
  const ctx = useContext(ExecStateContext)
  if (!ctx) throw new Error('useExecState must be used within ExecStateProvider')
  return ctx
}
