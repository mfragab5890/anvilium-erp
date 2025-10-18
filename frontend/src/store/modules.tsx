import * as React from 'react'
import api from '../api'

// ---- Types that mirror the BE payload ----
export type Section = {
  code: string
  name: string
  sort_order?: number
}

export type Tab = {
  code: string
  name: string
  sort_order?: number
  sections?: Section[]
}

export type ModuleNode = {
  code: string
  name: string
  icon?: string
  sort_order?: number
  is_locked?: boolean
  tabs?: Tab[]
}

// ---- Context ----
type ModulesContextType = {
  moduleTree: ModuleNode[]            // EXACT order from BE
  isLoading: boolean
  error: string | null
  loadModuleTree: () => Promise<void>
  getDefaultPath: (moduleCode: string) => string | null
}

const ModulesContext = React.createContext<ModulesContextType | undefined>(undefined)

export function ModulesProvider({ children }: { children: React.ReactNode }) {
  const [moduleTree, setModuleTree] = React.useState<ModuleNode[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Normalize names but KEEP ARRAY ORDER EXACTLY as BE sent it.
  const normalize = (raw: any): ModuleNode[] => {
    const arr: any[] = Array.isArray(raw?.modules) ? raw.modules : (Array.isArray(raw) ? raw : [])
    return arr.map((m: any) => ({
      code: String(m?.code ?? '').toLowerCase(),
      name: String(m?.name ?? m?.name_en ?? m?.code ?? ''),
      icon: m?.icon ?? undefined,
      sort_order: typeof m?.sort_order === 'number' ? m.sort_order : undefined,
      is_locked: Boolean(m?.is_locked),
      tabs: Array.isArray(m?.tabs)
        ? m.tabs.map((t: any) => ({
            code: String(t?.code ?? '').toLowerCase(),
            name: String(t?.name ?? t?.name_en ?? t?.code ?? ''),
            sort_order: typeof t?.sort_order === 'number' ? t.sort_order : undefined,
            sections: Array.isArray(t?.sections)
              ? t.sections.map((s: any) => ({
                  code: String(s?.code ?? '').toLowerCase(),
                  name: String(s?.name ?? s?.name_en ?? s?.code ?? ''),
                  sort_order: typeof s?.sort_order === 'number' ? s.sort_order : undefined,
                }))
              : undefined,
          }))
        : [],
    }))
  }

  const loadModuleTree = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get('/admin/modules/tree', { params: { include: 'tabs,sections' } })
      setModuleTree(normalize(res.data))
    } catch (e: any) {
      setError(e?.message || 'Failed to load modules')
      setModuleTree([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Default path uses BE order (first tab), with a soft preference to 'index' if present
  const getDefaultPath = React.useCallback((moduleCode: string) => {
    const m = moduleTree.find(x => x.code === (moduleCode || '').toLowerCase())
    if (!m) return null
    const tabs = m.tabs || []
    const indexTab = tabs.find(t => t.code === 'index')
    const firstTab = indexTab || tabs[0]
    if (!firstTab) return `/app/${m.code}`
    return `/app/${m.code}/${firstTab.code}`
  }, [moduleTree])

  React.useEffect(() => { void loadModuleTree() }, [loadModuleTree])

  const value: ModulesContextType = {
    moduleTree,
    isLoading,
    error,
    loadModuleTree,
    getDefaultPath,
  }

  return <ModulesContext.Provider value={value}>{children}</ModulesContext.Provider>
}

export function useModules() {
  const ctx = React.useContext(ModulesContext)
  if (!ctx) throw new Error('useModules must be used within ModulesProvider')
  return ctx
}
