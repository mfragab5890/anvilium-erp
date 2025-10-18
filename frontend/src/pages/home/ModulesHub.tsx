import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Grid, Paper, Typography, IconButton, Stack, Tooltip } from '@mui/material'
import * as Icons from '@mui/icons-material'
import { useModules } from '../../store/modules'

function resolveIcon(name?: string) {
  const key = (name || '').replace(/[^a-zA-Z0-9_]/g, '')
  // @ts-ignore
  return (Icons as any)[key] || Icons.SettingsOutlined
}

export default function ModulesHub() {
  const navigate = useNavigate()
  const { moduleTree, isLoading, error, getDefaultPath } = useModules()

  // NO local sorting — keep BE order
  const modules = moduleTree

  const handleOpen = (code: string) => {
    const path = getDefaultPath(code) || `/app/${code}`
    navigate(path)
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>Modules</Typography>
      </Stack>

      {isLoading && <Typography variant="body2" sx={{ opacity: 0.8 }}>Loading modules…</Typography>}
      {error && <Typography variant="body2" color="error">{error}</Typography>}

      <Grid container spacing={2}>
        {modules.map((m) => {
          const Icon = resolveIcon(m.icon)
          return (
            <Grid key={m.code} item xs={12} sm={6} md={4} lg={3}>
              <Paper
                elevation={3}
                sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      borderRadius: 2, cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                onClick={() => handleOpen(m.code)}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Icon fontSize="medium" />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>{m.name || m.code}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {m.tabs?.length ? `${m.tabs.length} tab(s)` : 'No tabs yet'}
                    </Typography>
                  </Box>
                </Stack>
                <Tooltip title="Open">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpen(m.code) }}>
                    <Icons.ArrowForwardIos fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Paper>
            </Grid>
          )
        })}
        {!isLoading && modules.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>No modules available.</Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
