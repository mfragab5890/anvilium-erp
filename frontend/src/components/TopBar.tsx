import * as React from 'react'
import {
  AppBar, Toolbar, Box, Typography, IconButton, Menu, MenuItem, Avatar, Badge,
  Tooltip, Divider, ListItemIcon
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Global } from '@emotion/react'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'
import ArrowBackIosNewRounded from '@mui/icons-material/ArrowBackIosNewRounded'
import i18n from '../i18n'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

type TopBarProps = {
  tabName: string
  userName?: string
  onProfile?: () => void
  onChangeLang?: (lang: 'en' | 'ar') => void
  onChangeTheme?: (mode: 'light' | 'dark' | 'system') => void
  onChangeLayout?: (l: 'bars' | 'tiles') => void
  notificationsCount?: number
  onLogout?: () => void
  /** NEW: show a Back button that calls onHome (used in Futuristic mode on module pages) */
  onHome?: () => void
}

export default function TopBar({
  tabName, userName, onProfile, onChangeLang, onChangeTheme, onChangeLayout,
  notificationsCount = 0, onLogout, onHome
}: TopBarProps) {
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null)
  const [settingsAnchor, setSettingsAnchor] = React.useState<null | HTMLElement>(null)
  const theme = useTheme()
  const dir = theme.direction as 'ltr' | 'rtl'
  const open = Boolean(anchor)
  const openSettings = Boolean(settingsAnchor)
  const initials = (userName || '').split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase()

  // read current selections
  const [lang, setLang] = React.useState<'en' | 'ar'>(() => i18n.language?.startsWith('ar') ? 'ar' : 'en')
  const [mode, setMode] = React.useState<'light' | 'dark' | 'system'>(() => (localStorage.getItem('theme') as any) || 'system')
  const [layout, setLayout] = React.useState<'bars' | 'tiles'>(() => (localStorage.getItem('layout') as any) || 'tiles')

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)
  const handleClose = () => setAnchor(null)
  const handleOpenSettings = (e: React.MouseEvent<HTMLElement>) => setSettingsAnchor(e.currentTarget)
  const handleCloseSettings = () => setSettingsAnchor(null)

  // shared paper styles
  const menuPaperSx = {
    mt: 1.2,
    overflow: 'visible',
    borderRadius: 2,
    bgcolor: theme.palette.mode === 'dark' ? 'rgba(12,16,30,.85)' : 'rgba(255,255,255,.92)',
    backdropFilter: 'blur(10px) saturate(140%)',
    border: theme.palette.mode === 'dark'
      ? '1px solid rgba(120,140,255,.25)'
      : '1px solid rgba(90,120,255,.35)',
    boxShadow: '0 18px 45px rgba(60,100,255,.18)',
    '&::after': {
      content: '""', position: 'absolute', left: 0, right: 0, top: 0, height: 2,
      background: 'linear-gradient(90deg,#6ee7ff,#6b8cff,#a78bfa,#6ee7ff)', opacity: .7
    },
    '&::before': {
      content: '""', position: 'absolute', top: 0, [dir === 'rtl' ? 'left' : 'right']: 18,
      width: 10, height: 10,
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(12,16,30,.85)' : 'rgba(255,255,255,.92)',
      borderTop: theme.palette.mode === 'dark' ? '1px solid rgba(120,140,255,.25)' : '1px solid rgba(90,120,255,.35)',
      borderLeft: theme.palette.mode === 'dark' ? '1px solid rgba(120,140,255,.25)' : '1px solid rgba(90,120,255,.35)',
      transform: 'translateY(-50%) rotate(45deg)'
    },
    '& .MuiDivider-root': {
      my: 1, borderColor: theme.palette.mode === 'dark' ? 'rgba(120,140,255,.25)' : 'rgba(90,120,255,.35)'
    }
  } as const

  const groupSx = {
    p: .5, borderRadius: 2,
    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)',
    border: theme.palette.mode === 'dark' ? '1px solid rgba(120,140,255,.25)' : '1px solid rgba(90,120,255,.25)',
    display: 'inline-flex'
  } as const

  const btnSx = {
    textTransform: 'none', px: 1.5, py: 0.6, fontSize: 13, border: 'none !important',
    '&.Mui-selected': {
      color: theme.palette.mode === 'dark' ? '#e7f1ff' : '#0b1020',
      background: 'linear-gradient(90deg, rgba(110,231,255,.18), rgba(167,139,250,.18))',
      boxShadow: 'inset 0 0 0 1px rgba(110,231,255,.35), 0 4px 18px rgba(60,100,255,.18)',
      backdropFilter: 'blur(4px) saturate(140%)'
    }
  } as const
  const isDark = theme.palette.mode === 'dark'
  const logoSrc = isDark ? '/logo-lockup-light.png' : '/logo-lockup-dark.png'

  return (
    <>
      <Global styles={{
        '@keyframes orbit': { to: { transform: 'rotate(1turn)' } },
        '@keyframes shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } }
      }} />

      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(12,16,30,.55)' : 'rgba(255,255,255,.9)',
          backdropFilter: 'blur(10px) saturate(130%)',
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          position: 'relative',
          overflow: 'hidden',
          '&:after': {
            content: '""', position: 'absolute', left: 0, right: 0, bottom: 0, height: 2,
            background: 'linear-gradient(90deg,#6ee7ff,#6b8cff,#a78bfa,#6ee7ff)',
            backgroundSize: '200% 100%', animation: 'shimmer 6s linear infinite', opacity: .6
          }
        }}
      >
        {/* thin conic rim */}
        <Box sx={{
          position: 'absolute', inset: -1, pointerEvents: 'none', borderRadius: 0,
          background: 'conic-gradient(from 0turn, rgba(110,231,255,.1), rgba(167,139,250,.1), rgba(110,231,255,.1))',
          mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor', maskComposite: 'exclude', p: '1px'
        }} />

        <Toolbar sx={{ minHeight: 64, display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center' }}>
          {/* left: Back (optional) + page title */}
          <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
            {onHome && (
              <IconButton size="small" onClick={onHome} aria-label="Back to home">
                <ArrowBackIosNewRounded fontSize="small" />
              </IconButton>
            )}
            <Typography variant="subtitle1" fontWeight={700}>{tabName}</Typography>
          </Box>

          {/* center: brand with halo */}
          <Box sx={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', gap:1 }}>
            <Box sx={{
              position:'absolute', width: 68, height: 68, borderRadius:'50%',
              background: 'conic-gradient(from .25turn, rgba(110,231,255,.35), rgba(167,139,250,.35), rgba(110,231,255,.35))',
              filter: 'blur(12px)', animation: 'orbit 12s linear infinite'
            }} />
            <img src={logoSrc} alt="ANVILIUM" style={{ height: 65, filter: 'drop-shadow(0 0 6px rgba(0,0,0,.25))' }} />
            {/*<Typography variant="subtitle2" fontWeight={800} sx={{ letterSpacing: 1 }}>ERP</Typography>*/}
          </Box>

          {/* right: icons */}
          <Box sx={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:1 }}>
            <Tooltip title="Notifications">
              <IconButton size="small" aria-label="notifications">
                <Badge badgeContent={notificationsCount} color="primary">
                  <NotificationsNoneIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Settings">
              <IconButton size="small" onClick={handleOpenSettings}>
                <SettingsOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title={userName || 'Account'}>
              <IconButton size="small" onClick={handleOpen} sx={{ ml: 0.5, position: 'relative' }}>
                <Box sx={{
                  position:'absolute', inset:-4, borderRadius:'50%',
                  background:'conic-gradient(from 0turn, rgba(110,231,255,.3), rgba(167,139,250,.3), rgba(110,231,255,.3))',
                  filter:'blur(6px)', zIndex:0, animation:'orbit 10s linear infinite'
                }} />
                <Avatar sx={{ width: 28, height: 28, fontSize: 12, position:'relative', zIndex:1 }}>
                  {initials || <AccountCircleOutlinedIcon fontSize="small" />}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>

        {/* Profile menu */}
        <Menu
          anchorEl={anchor}
          open={open}
          onClose={handleClose}
          keepMounted
          anchorOrigin={{ vertical: 'bottom', horizontal: dir === 'rtl' ? 'left' : 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: dir === 'rtl' ? 'left' : 'right' }}
          TransitionProps={{ timeout: 180 }}
          MenuListProps={{ dense: true }}
          PaperProps={{ elevation: 0, sx: menuPaperSx }}
        >
          <MenuItem disabled onClick={() => { handleClose(); onProfile?.() }}>
            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
            Profile (soon)
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { handleClose(); onLogout?.() }}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            Logout
          </MenuItem>
        </Menu>

        {/* Settings menu */}
        <Menu
          anchorEl={settingsAnchor}
          open={openSettings}
          onClose={handleCloseSettings}
          keepMounted
          anchorOrigin={{ vertical: 'bottom', horizontal: dir === 'rtl' ? 'left' : 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: dir === 'rtl' ? 'left' : 'right' }}
          TransitionProps={{ timeout: 180 }}
          PaperProps={{ elevation: 0, sx: menuPaperSx }}
          MenuListProps={{ dense: true, sx: { p: 1.2, minWidth: 280 } }}
        >
          {/* Language */}
          <Typography variant="caption" color="text.secondary" sx={{ px: .5, pb: .5, display: 'block' }}>
            Language
          </Typography>
          <ToggleButtonGroup
            exclusive size="small" value={lang} sx={groupSx}
            onChange={(_, val: 'en' | 'ar' | null) => { if (!val) return; setLang(val); onChangeLang?.(val) }}
          >
            <ToggleButton value="en" sx={btnSx}>EN</ToggleButton>
            <ToggleButton value="ar" sx={btnSx}>عربي</ToggleButton>
          </ToggleButtonGroup>

          <Divider />

          {/* Theme */}
          <Typography variant="caption" color="text.secondary" sx={{ px: .5, pb: .5, display: 'block' }}>
            Theme
          </Typography>
          <ToggleButtonGroup
            exclusive size="small" value={mode} sx={groupSx}
            onChange={(_, val: 'light' | 'dark' | 'system' | null) => { if (!val) return; setMode(val); onChangeTheme?.(val) }}
          >
            <ToggleButton value="light" sx={btnSx}>Light</ToggleButton>
            <ToggleButton value="dark" sx={btnSx}>Dark</ToggleButton>
            <ToggleButton value="system" sx={btnSx}>System</ToggleButton>
          </ToggleButtonGroup>

          <Divider />

          {/* Layout */}
          <Typography variant="caption" color="text.secondary" sx={{ px: .5, pb: .5, display: 'block' }}>
            Layout
          </Typography>
          <ToggleButtonGroup
            exclusive size="small" value={layout} sx={groupSx}
            onChange={(_, val: 'bars' | 'tiles' | null) => { if (!val) return; setLayout(val); onChangeLayout?.(val) }}
          >
            <ToggleButton value="bars" sx={btnSx}>Nav Bar</ToggleButton>
            <ToggleButton value="tiles" sx={btnSx}>Tiles</ToggleButton>
          </ToggleButtonGroup>
        </Menu>
      </AppBar>
    </>
  )
}
