// src/router/Dynamic.tsx
import * as React from 'react'
import { useParams, Navigate } from 'react-router-dom'

// Explicitly type what Vite will return for each matched module file
type PageModule = { default: React.ComponentType<any> }
type Loader = () => Promise<PageModule>

// Index all tab pages and sections at build time (filenames remain conventional;
// we only lowercase when comparing with DB codes)
const TAB_PAGES = import.meta.glob(
  '../modules/**/tabs/**/index.tsx'
) as Record<string, Loader>

const SECTIONS = import.meta.glob(
  '../modules/**/tabs/**/sections/*.tsx'
) as Record<string, Loader>

function resolveLoader(
  moduleCode: string,
  tabCode?: string,
  sectionCode?: string
): Loader | null {
  const base = `../modules/${moduleCode}/tabs/${tabCode}/`

  if (sectionCode) {
    const key = `${base}sections/${sectionCode}.tsx`
    return SECTIONS[key] ?? null
  }

  const key = `${base}index.tsx`
  return TAB_PAGES[key] ?? null
}

export default function DynamicPage() {
  const { module, tab, section } = useParams()

  // Compare LOWERCASE against DB codes; filenames stay conventional
  const m = (module ?? '').toLowerCase()
  const t = (tab ?? 'index').toLowerCase()
  const s = section ? section.toLowerCase() : undefined

  const loader = React.useMemo(() => resolveLoader(m, t, s), [m, t, s])

  if (!loader) return <Navigate to="/app" replace />

  const Page = React.lazy(loader)

  return (
    <React.Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <Page />
    </React.Suspense>
  )
}
