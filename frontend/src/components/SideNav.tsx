import * as React from 'react'
import {
  Drawer, Box, List, ListItemButton, ListItemIcon, ListItemText, Tooltip, IconButton
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import DoubleArrowIcon from '@mui/icons-material/DoubleArrow'
import * as Icons from '@mui/icons-material'
import { useModules } from '../store/modules'

type Props = {
  open: boolean
  width: number
  collapsedWidth: number
  topOffset: number
  selectedCode: string
  onToggle: () => void
  onSelect: (code: string) => void
  dir: 'ltr' | 'rtl'
}

// Helper: resolve icon by BE-sent code, fallback to gear
function resolveIcon(name?: string) {
  const key = (name || '').replace(/[^a-zA-Z0-9_]/g, '')
  // @ts-ignore dynamic index
  return (Icons as any)[key] || SettingsOutlinedIcon
}

export default function SideNav({
  open, width, collapsedWidth, topOffset, selectedCode, onToggle, onSelect, dir
}: Props) {
  const { moduleTree } = useModules()
  const drawerWidth = open ? width : collapsedWidth
  const tipPlacement: 'left' | 'right' = dir === 'rtl' ? 'left' : 'right'
  const theme = useTheme()
  const neon = theme.palette.mode === 'dark'
    ? 'linear-gradient(180deg, rgba(110,231,255,.12), rgba(167,139,250,.12))'
    : 'linear-gradient(180deg, rgba(59,130,246,.12), rgba(139,92,246,.12))'

  const ToggleIcon = () => {
    const rotateDeg = dir === 'ltr' ? (open ? 180 : 0) : (open ? 0 : 180)
    return <DoubleArrowIcon sx={{ transform: `rotate(${rotateDeg}deg)` }} />
  }

  return (
    <Drawer
      key={dir}
      variant="permanent"
      anchor={dir === 'rtl' ? 'right' : 'left'}
      PaperProps={{
        sx: {
          width: drawerWidth,
          overflowX: 'hidden',
          position: 'fixed',
          top: `${topOffset}px`,
          height: `calc(100vh - ${topOffset}px)`,
          left: dir === 'rtl' ? 'auto !important' : '0 !important',
          right: dir === 'rtl' ? '0 !important' : 'auto !important',
          borderLeft: dir === 'rtl' ? (t) => `1px solid ${t.palette.divider}` : 'none',
          borderRight: dir === 'ltr' ? (t) => `1px solid ${t.palette.divider}` : 'none',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(12,16,30,.45)' : 'rgba(255,255,255,.75)',
          backdropFilter: 'blur(10px) saturate(140%)',
          '&:before': {
            content: '""',
            position: 'absolute', top: 0, bottom: 0,
            [dir === 'rtl' ? 'right' : 'left']: 0,
            width: 2,
            background: 'linear-gradient(180deg,#6ee7ff,#6b8cff,#a78bfa,#6ee7ff)',
            opacity: .6
          },
          '&:after': {
            content: '""',
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 36px), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 36px)',
            opacity: theme.palette.mode === 'dark' ? .18 : .12
          }
        }
      }}
    >
      <Box sx={{ position: 'relative', height: '100%' }}>
        {open ? (
          <Box
            sx={{
              display: 'flex', alignItems: 'center',
              justifyContent: dir === 'rtl' ? 'flex-start' : 'flex-end',
              px: 1, py: 1,
              borderBottom: (t) => `1px solid ${t.palette.divider}`,
              background: neon
            }}
          >
            <Tooltip title="Collapse" placement={tipPlacement}>
              <IconButton size="small" onClick={onToggle} aria-label="collapse sidebar">
                <ToggleIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: '50%', left: 0, right: 0, transform: 'translateY(-50%)',
              display: 'flex', justifyContent: 'center',
              pointerEvents: 'none', zIndex: (t) => t.zIndex.appBar + 1
            }}
          >
            <Tooltip title="Expand" placement={tipPlacement}>
              <IconButton
                size="small" onClick={onToggle} aria-label="expand sidebar"
                sx={{
                  pointerEvents: 'auto',
                  background: neon, borderRadius: 2,
                  boxShadow: '0 8px 24px rgba(60,100,255,.25)'
                }}
              >
                <ToggleIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        <List sx={{ py: 0 }}>
          <Tooltip title="Dashboard" placement={tipPlacement}>
            <ListItemButton
              selected={selectedCode === 'dashboard'}
              onClick={() => onSelect('dashboard')}
              sx={{
                mx: .5, my: .5, borderRadius: 2,
                '&.Mui-selected': {
                  background:
                    'linear-gradient(90deg, rgba(110,231,255,.15), rgba(167,139,250,.15))',
                  boxShadow: 'inset 0 0 0 1px rgba(110,231,255,.35)',
                },
                '&:hover': {
                  background: 'linear-gradient(90deg, rgba(110,231,255,.08), rgba(167,139,250,.08))'
                }
              }}
            >
              <ListItemIcon><DashboardOutlinedIcon /></ListItemIcon>
              {open && <ListItemText primary="Dashboard" />}
            </ListItemButton>
          </Tooltip>

          {moduleTree.map(m => {
            const Icon = resolveIcon(m.icon)
            const selected = selectedCode === m.code
            const locked = Boolean((m as any).is_locked)

            return (
              <Tooltip key={m.code} title={m.name || m.code} placement={tipPlacement}>
                <span>
                  <ListItemButton
                    selected={selected}
                    onClick={() => onSelect(m.code)}
                    sx={{
                      mx: .5, my: .5, borderRadius: 2,
                      position: 'relative',
                      '&.Mui-selected': {
                        background:
                          'linear-gradient(90deg, rgba(110,231,255,.15), rgba(167,139,250,.15))',
                        boxShadow: 'inset 0 0 0 1px rgba(110,231,255,.35)',
                        '&:after': {
                          content: '""', position: 'absolute', top: 8, bottom: 8,
                          [dir === 'rtl' ? 'right' : 'left']: 4, width: 3, borderRadius: 3,
                          background: 'linear-gradient(180deg,#6ee7ff,#a78bfa)'
                        }
                      },
                      '&:hover': {
                        background:
                          'linear-gradient(90deg, rgba(110,231,255,.08), rgba(167,139,250,.08))'
                      }
                    }}
                  >
                    <ListItemIcon><Icon /></ListItemIcon>
                    {open && <ListItemText primary={m.name || m.code} />}
                    {locked && (
                      <LockOutlinedIcon
                        fontSize="small"
                        sx={{ ml: open ? 1 : 0.5, opacity: 0.6 }}
                      />
                    )}
                  </ListItemButton>
                </span>
              </Tooltip>
            )
          })}
        </List>
      </Box>
    </Drawer>
  )
}
