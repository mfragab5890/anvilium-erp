// frontend/src/pages/Login.tsx
import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import {
  Container, TextField, Button, Box, Typography, Paper, IconButton, Stack,
  CssBaseline, createTheme, ThemeProvider
} from '@mui/material'
import { CacheProvider, Global } from '@emotion/react'
import createCache from '@emotion/cache'
import rtlPlugin from 'stylis-plugin-rtl'
import LanguageIcon from '@mui/icons-material/Language'
import Backdrop from '@mui/material/Backdrop'
import CircularProgress from '@mui/material/CircularProgress'

import api from '../api'
import i18n from '../i18n'
import { useAuth } from '../store/auth'
import LoadingOverlay from '../components/LoadingOverlay'

const INTRO_SRC = '/anvilium_intro.gif'      // put your GIF in /public
const INTRO_DURATION_MS = 5000               // always 5s

function useThemeWithDir() {
  const [dir, setDir] = useState<'ltr' | 'rtl'>(i18n.dir() as 'ltr' | 'rtl')

  useEffect(() => {
    const apply = () => {
      const d = i18n.dir() as 'ltr' | 'rtl'
      setDir(d)
      document.documentElement.dir = d
      document.documentElement.lang = i18n.language
    }
    i18n.on('languageChanged', apply)
    apply()
    return () => i18n.off('languageChanged', apply)
  }, [])

  const systemDark =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const mode: 'light' | 'dark' = systemDark ? 'dark' : 'light'

  const theme = useMemo(() => createTheme({
    direction: dir,
    palette: { mode },
    typography: { fontFamily: 'Inter, system-ui, Segoe UI, Roboto, Arial' }
  }), [dir, mode])

  const cache = useMemo(() => createCache({
    key: dir === 'rtl' ? 'muirtl' : 'mui',
    stylisPlugins: dir === 'rtl' ? [rtlPlugin] : []
  }), [dir])

  return { theme, cache }
}

export default function Login() {
  const { theme, cache } = useThemeWithDir()
  const { setAuth } = useAuth()

  // Always show intro on /login
  const [showIntro, setShowIntro] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), INTRO_DURATION_MS)
    return () => clearTimeout(t)
  }, [])

  const [overlayOpen, setOverlayOpen] = useState(false)
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const toggleLang = async () => {
    const next = i18n.language?.startsWith('ar') ? 'en' : 'ar'
    await i18n.changeLanguage(next)
    document.documentElement.dir = i18n.dir(next)
  }

  const fetchUserAfterToken = async () => {
    try {
      const { data } = await api.get('/users/me')
      return { user: data.user ?? data, modules: data.modules ?? [] }
    } catch {
      const { data } = await api.get('/auth/whoami')
      return { user: data.user ?? data, modules: [] }
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)
    setOverlayOpen(true)

    await delay(200)

    try {
      const { data } = await api.post('/auth/login', { email, password })
      const token = data.access_token
      if (!token) throw new Error('No access_token returned')

      if (data.user) {
        setAuth(token, data.user, data.modules || [])
      } else {
        const extra = await fetchUserAfterToken()
        setAuth(token, extra.user, extra.modules || [])
      }
      window.location.replace('/app')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Login failed'
      setError(msg)
    } finally {
      setOverlayOpen(false)
      setLoading(false)
    }
  }

  const handleTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const ry = (px - 0.5) * 8
    const rx = (0.5 - py) * 8
    el.style.setProperty('--rx', `${rx}deg`)
    el.style.setProperty('--ry', `${ry}deg`)
  }
  const resetTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <LoadingOverlay />

        <Backdrop
          open={overlayOpen}
          sx={{
            zIndex: (t) => t.zIndex.modal + 3,
            color: '#fff',
            backdropFilter: 'blur(4px) saturate(130%)',
            backgroundColor: 'rgba(0,0,0,.3)'
          }}
        >
          <CircularProgress />
        </Backdrop>

        <Global styles={{
          ':root': { '--rx': '0deg', '--ry': '0deg' },
          '@keyframes spinY': {
            '0%': { transform: 'rotateY(-90deg) scale(.9)' },
            '100%': { transform: 'rotateY(0deg) scale(1)' }
          },
          '@keyframes orbit': { to: { transform: 'rotate(1turn)' } },
          '@keyframes float': {
            '0%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-6px)' },
            '100%': { transform: 'translateY(0px)' }
          },
          '@keyframes borderGlow': {
            '0%,100%': { boxShadow: '0 0 0 rgba(0,0,0,0)' },
            '50%': { boxShadow: '0 0 30px rgba(100,140,255,.35)' }
          }
        }} />

        <Box sx={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: (t) => t.palette.mode === 'dark'
            ? 'radial-gradient(1200px 500px at 70% -10%, rgba(80,120,255,.15), transparent 60%), radial-gradient(1000px 400px at 10% 110%, rgba(120,80,255,.12), transparent 50%), linear-gradient(180deg, #0a0d1a, #0b1120)'
            : 'radial-gradient(1200px 500px at 70% -10%, rgba(80,120,255,.15), transparent 60%), radial-gradient(1000px 400px at 10% 110%, rgba(120,80,255,.12), transparent 50%), linear-gradient(180deg, #f7f9ff, #f1f5ff)'
        }} />
        {/* FULL-SCREEN GIF INTRO (centered with top/bottom margin) */}
{showIntro && (
  <Box
      aria-label="ANVILIUM intro"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (t) => t.zIndex.modal + 6,
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // top/bottom margin (space above/below the GIF)
        pt: '6vh',
        pb: '6vh',
      }}
    >
      <Box
        component="img"
        src={INTRO_SRC}
        alt=""
        aria-hidden
        sx={{
          // keep aspect ratio, never crop
          objectFit: 'fill',
          // size constraints so it stays centered with margins
          maxWidth: 'min(1040px, 92vw)',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          display: 'block',
        }}
      />
    </Box>
  )}
        <Container maxWidth="xs" sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
          <Paper
            elevation={0}
            onMouseMove={handleTilt}
            onMouseLeave={resetTilt}
            sx={(t) => ({
              p: 3,
              width: '100%',
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
              transform: 'rotateX(var(--rx)) rotateY(var(--ry)) translateZ(0)',
              transition: 'transform .12s ease',
              bgcolor: t.palette.mode === 'dark' ? 'rgba(12,16,30,.55)' : 'rgba(255,255,255,.6)',
              backdropFilter: 'blur(10px) saturate(130%)',
              border: t.palette.mode === 'dark'
                ? '1px solid rgba(120,140,255,.25)'
                : '1px solid rgba(90,120,255,.35)',
              animation: 'borderGlow 4.8s ease-in-out infinite',
              '&:before': {
                content: '""',
                position: 'absolute',
                inset: -1,
                borderRadius: 14,
                background: 'conic-gradient(from 0turn, #6ee7ff, #6b8cff, #a78bfa, #6ee7ff)',
                WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                padding: '1px',
                opacity: .35,
                filter: 'blur(1px)',
                animation: 'orbit 12s linear infinite'
              },
              '&:after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background:
                  'repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0 1px, transparent 1px 22px), repeating-linear-gradient(0deg, rgba(255,255,255,.04) 0 1px, transparent 1px 22px)',
                opacity: .35
              }
            })}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: .3 }}>
                {i18n.t('Sign in', { defaultValue: 'Sign in' })}
              </Typography>
              <IconButton size="small" onClick={toggleLang} aria-label="toggle language">
                <LanguageIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Box sx={{ display: 'grid', placeItems: 'center', mb: 2, position: 'relative' }}>
              <Box sx={{
                position: 'absolute', width: 120, height: 120, borderRadius: '50%',
                background: 'conic-gradient(from .25turn, rgba(110,231,255,.35), rgba(167,139,250,.35), rgba(110,231,255,.35))',
                filter: 'blur(18px)', zIndex: 0
              }} />
              <Box
                component="img"
                src="/logo.png"
                alt="Logo"
                sx={{ height: 100, width: 100, objectFit: 'contain', zIndex: 1, backfaceVisibility: 'hidden', animation: 'spinY 900ms cubic-bezier(.2,.8,.2,1) both' }}
              />
            </Box>

            <Box component="form" onSubmit={onSubmit} noValidate>
              <TextField
                fullWidth
                label={i18n.t('Email', { defaultValue: 'Email' })}
                type="email"
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="outlined"
                disabled={loading}
                autoComplete="username"
                inputProps={{ inputMode: 'email' }}
              />
              <TextField
                fullWidth
                label={i18n.t('Password', { defaultValue: 'Password' })}
                type="password"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                disabled={loading}
                autoComplete="current-password"
              />

              {error && (
                <Typography color="error" sx={{ mt: 1 }} role="alert" aria-live="polite">
                  {error}
                </Typography>
              )}

              <Button
                fullWidth
                type="submit"
                variant="contained"
                sx={{
                  mt: 2, py: 1.2, fontWeight: 700, letterSpacing: .5,
                  textShadow: '0 1px 0 rgba(0,0,0,.15)',
                  boxShadow: '0 10px 30px rgba(60,100,255,.25)'
                }}
                disabled={loading}
              >
                {loading ? i18n.t('Please wait…', { defaultValue: 'Please wait…' }) : i18n.t('Login', { defaultValue: 'LOGIN' })}
              </Button>
            </Box>
          </Paper>
        </Container>
      </ThemeProvider>
    </CacheProvider>
  )
}
