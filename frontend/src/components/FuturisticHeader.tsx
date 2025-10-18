import * as React from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import ArrowBackIosNewRounded from '@mui/icons-material/ArrowBackIosNewRounded'

type Props = {
  title: string
  onHome: () => void
  mode?: 'light' | 'dark'
}

export default function FuturisticHeader({ title, onHome, mode = 'light' }: Props) {
  const bg = mode === 'dark'
    ? 'rgba(12,16,30,.55)'
    : 'rgba(255,255,255,.75)'

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
        backdropFilter: 'blur(8px) saturate(130%)',
        borderBottom: (t) => `1px solid ${t.palette.divider}`,
        bgcolor: bg,
        px: 1, py: .75,
        display: 'flex', alignItems: 'center', gap: 1
      }}
    >
      <IconButton size="small" onClick={onHome} aria-label="Back to home">
        <ArrowBackIosNewRounded fontSize="small" />
      </IconButton>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
    </Box>
  )
}
