// frontend/src/pages/Dashboard.tsx
import * as React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Select, MenuItem, FormControl, InputLabel, Chip, Stack,
  createTheme, ThemeProvider, CssBaseline, GlobalStyles
} from '@mui/material'
import { CacheProvider } from '@emotion/react'
import { Global } from '@emotion/react'             // <-- needed by HoloBackground
import createCache from '@emotion/cache'
import rtlPlugin from 'stylis-plugin-rtl'
import i18n from '../i18n'
import TopBar from '../components/TopBar'
import SideNav from '../components/SideNav'
import LoadingOverlay from '../components/LoadingOverlay'
import { useAuth } from '../store/auth'
import api from '../api'
import BackgroundFX from '../components/BackgroundFX'
import ServerErrorGateway from '../components/ServerErrorGateway'
import ModulesHub from '../pages/home/ModulesHub'
import { useModules } from '../store/modules'

/** Futuristic/Classic holographic backdrop */
function HoloBackground() {
  return (
    <>
      <Global styles={{
        '@keyframes orbit': { to: { transform: 'rotate(1turn)' } },
        '@keyframes gridShift': {
          '0%': { backgroundPosition: '0px 0px, 0 0' },
          '100%': { backgroundPosition: '0 42px, 42px 0' }
        }
      }} />
      <Box
        aria-hidden
        sx={(t) => ({
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
          background: t.palette.mode === 'dark'
            ? 'radial-gradient(1200px 500px at 70% -10%, rgba(80,120,255,.14), transparent 60%), radial-gradient(1000px 420px at 10% 110%, rgba(120,80,255,.12), transparent 55%), linear-gradient(180deg, #0a0d1a, #0b1120)'
            : 'radial-gradient(1200px 500px at 70% -10%, rgba(80,120,255,.12), transparent 60%), radial-gradient(1000px 420px at 10% 110%, rgba(120,80,255,.10), transparent 55%), linear-gradient(180deg, #f7f9ff, #eef2ff)',
          '&:after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 40px)',
            opacity: t.palette.mode === 'dark' ? .22 : .18,
            animation: 'gridShift 18s linear infinite'
          }
        })}
      />
    </>
  )
}

/** Theme + RTL manager */
function useThemeWithDir(modePref: 'light' | 'dark' | 'system') {
  const [dir, setDir] = React.useState<'ltr' | 'rtl'>(i18n.dir() as 'ltr' | 'rtl')

  React.useEffect(() => {
    const apply = () => {
      const d = i18n.dir() as 'ltr' | 'rtl'
      setDir(d)
      document.documentElement.dir = d
      document.documentElement.lang = i18n.language
    }
    i18n.on('languageChanged', apply)
    apply()
    return () => { i18n.off('languageChanged', apply) }
  }, [])

  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const resolvedMode = modePref === 'system' ? (systemDark ? 'dark' : 'light') : modePref

  const theme = React.useMemo(
    () => createTheme({ direction: dir, palette: { mode: resolvedMode } }),
    [dir, resolvedMode]
  )

  const cache = React.useMemo(
    () =>
      createCache({
        key: dir === 'rtl' ? 'muirtl' : 'mui',
        stylisPlugins: dir === 'rtl' ? [rtlPlugin] : []
      }),
    [dir]
  )

  return { theme, cache, dir }
}

export default function Dashboard() {
  const { clearAuth, user: authUser } = useAuth()
  const { getDefaultPath } = useModules()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    clearAuth()
    window.location.replace('/login')
  }

  // ---- UI state
  const [branches, setBranches] = React.useState<string[]>(
    () => JSON.parse(localStorage.getItem('branches') || '["ALL"]')
  )
  const [layout, setLayout] = React.useState<'bars' | 'tiles'>(() =>
    (localStorage.getItem('layout') as any) || 'bars'   // default: CLASSIC
  )
  const [mode, setMode] = React.useState<'light' | 'dark' | 'system'>(
    () => (localStorage.getItem('theme') as any) || 'system'
  )
  const { theme, cache, dir } = useThemeWithDir(mode)
  const [sideOpen, setSideOpen] = React.useState(true)

  const isFuturistic = layout === 'tiles'

  const SIDE_WIDTH = 260
  const SIDE_COLLAPSED = 72
  const TOPBAR_HEIGHT = 64
  const drawerWidth = sideOpen ? SIDE_WIDTH : SIDE_COLLAPSED

  // Route helpers
  const path = location.pathname.replace(/\/+$/, '')
  const selectedCode = React.useMemo(() => {
    if (path === '/app' || path === '/app/') return 'dashboard'
    const seg = path.split('/')[2] || 'dashboard' // '/app/<seg>/...'
    return seg
  }, [path])

  // Dynamic goToModule using store's default path
  const goToModule = (code: string) => {
    if (code === 'dashboard') { navigate('/app'); return }
    const target = getDefaultPath(code) || `/app/${code}`
    navigate(target)
  }

  // TopBar handlers
  const handleLang = (lang: 'en' | 'ar') => { i18n.changeLanguage(lang); localStorage.setItem('lang', lang) }
  const handleTheme = (m: 'light' | 'dark' | 'system') => { setMode(m); localStorage.setItem('theme', m) }
  const handleLayout = (l: 'bars' | 'tiles') => { setLayout(l); localStorage.setItem('layout', l) }

  const tabName = selectedCode === 'dashboard' ? 'Dashboard' : selectedCode
  const userName = authUser ? `${authUser.first_name ?? ''} ${authUser.last_name ?? ''}`.trim() : ''

  // helper: translucent glass for Classic branch bar
  const branchBarBg = (t: any) =>
    t.palette.mode === 'dark' ? 'rgba(12,16,30,.55)' : 'rgba(255,255,255,.75)'

  return (
    <CacheProvider key={dir} value={cache}>
      <ThemeProvider key={dir} theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{
          html: { height: '100%' },
          body: { height: '100%', margin: 0, backgroundColor: 'transparent' },
          '#root': { height: '100%', backgroundColor: 'transparent' },
        }} />

        {/* FUTURISTIC SHELL */}
        {isFuturistic ? (
          <Box sx={{ minHeight: '100vh', position: 'relative' }}>
            <BackgroundFX variant={theme.palette.mode === 'dark' ? 'neonGrid' : 'aurora'} />

            <TopBar
              tabName={selectedCode === 'dashboard' ? 'Welcome' : tabName}
              userName={userName}
              onProfile={() => navigate('/app/profile')}
              onChangeLang={handleLang}
              onChangeTheme={handleTheme}
              onChangeLayout={handleLayout}
              notificationsCount={0}
              onLogout={handleLogout}
              onHome={selectedCode !== 'dashboard' ? () => goToModule('dashboard') : undefined}
            />

            {selectedCode === 'dashboard' ? (
              <ModulesHub />
            ) : (
              <Box sx={{ px: { xs: 1.5, md: 2.5 }, py: 2.5 }}>
                <Outlet />
              </Box>
            )}

            <LoadingOverlay />
            <ServerErrorGateway />
          </Box>
        ) : (
          /* CLASSIC SHELL */
          <>
            <HoloBackground />

            <Box sx={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
              {/* Top bar */}
              <Box sx={{ position: 'sticky', top: 0, zIndex: (t) => t.zIndex.appBar }}>
                <TopBar
                  tabName={tabName}
                  userName={userName}
                  onProfile={() => navigate('/app/profile')}
                  onChangeLang={handleLang}
                  onChangeTheme={handleTheme}
                  onChangeLayout={handleLayout}
                  notificationsCount={0}
                  onLogout={handleLogout}
                />
              </Box>

              {/* Side nav */}
              <SideNav
                key={dir}
                open={sideOpen}
                width={SIDE_WIDTH}
                collapsedWidth={SIDE_COLLAPSED}
                topOffset={TOPBAR_HEIGHT}
                selectedCode={selectedCode}
                onToggle={() => setSideOpen(o => !o)}
                onSelect={(code) => goToModule(code)}
                dir={dir}
              />

              {/* Content area */}
              <Box
                sx={{
                  pt: `${TOPBAR_HEIGHT}px`,
                  pl: dir === 'ltr' ? `${drawerWidth}px` : 0,
                  pr: dir === 'rtl' ? `${drawerWidth}px` : 0,
                  transition: (t) => t.transitions.create(['padding-left', 'padding-right'], {
                    duration: t.transitions.duration.shorter
                  }),
                  bgcolor: 'transparent',
                  minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
                }}
              >
                {/* Branch selector row (glassy bar) */}
                <Box
                  sx={{
                    px: 2, py: 1,
                    borderBottom: (t) => `1px solid ${t.palette.divider}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    bgcolor: branchBarBg,
                    backdropFilter: 'blur(8px) saturate(130%)'
                  }}
                >
                  <FormControl size="small" sx={{ minWidth: 240 }}>
                    <InputLabel id="branch-select">Branch</InputLabel>
                    <Select
                      labelId="branch-select"
                      multiple
                      value={branches}
                      label="Branch"
                      onChange={(e) => {
                        const vals = e.target.value as string[]
                        setBranches(vals)
                        localStorage.setItem('branches', JSON.stringify(vals))
                      }}
                      renderValue={(selected) => (
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {(selected as string[]).map((b) => <Chip key={b} size="small" label={b} />)}
                        </Stack>
                      )}
                    >
                      {['ALL', 'Dubai', 'Abu Dhabi'].map((b) => (
                        <MenuItem key={b} value={b}>{b}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box />
                </Box>

                {/* Routed page content */}
                <Box sx={{ px: 2, py: 2 }}>
                  <Outlet />
                </Box>
              </Box>

              <LoadingOverlay />
              <ServerErrorGateway />
            </Box>
          </>
        )}
      </ThemeProvider>
    </CacheProvider>
  )
}
