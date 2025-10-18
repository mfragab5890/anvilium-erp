import * as React from 'react'
import { Box, Typography } from '@mui/material'
import { Global } from '@emotion/react'
import { subscribeLoading } from '../loading'

export default function LoadingOverlay() {
  const [active, setActive] = React.useState(false)

  React.useEffect(() => {
    const maybeCleanup = subscribeLoading(setActive) as unknown
    return typeof maybeCleanup === 'function' ? (maybeCleanup as () => void) : undefined
  }, [])

  if (!active) return null

  return (
    <>
      {/* keyframes once */}
      <Global styles={{
        '@keyframes spinY': { to: { transform: 'rotateY(1turn)' } },
        '@keyframes orbit': { to: { transform: 'rotate(1turn)' } },
        '@keyframes pulse': {
          '0%,100%': { transform: 'scale(1)', opacity: .55 },
          '50%': { transform: 'scale(1.06)', opacity: .9 }
        },
        '@keyframes scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        }
      }} />

      <Box
        sx={{
          position: 'fixed', inset: 0,
          display: 'grid', placeItems: 'center',
          bgcolor: 'rgba(0,0,0,0.18)',
          zIndex: (t) => t.zIndex.modal + 2,
          backdropFilter: 'blur(2px) saturate(120%)',
          overflow: 'hidden'
        }}
      >
        {/* scanlines */}
        <Box sx={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background:
            'repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 2px, transparent 2px 4px)',
          mixBlendMode: 'overlay'
        }} />
        {/* vertical scanner bar */}
        <Box sx={{
          position: 'absolute', left: 0, right: 0, height: '28%',
          background: 'linear-gradient(180deg, transparent, rgba(110,231,255,.18), transparent)',
          animation: 'scan 2.4s linear infinite',
          pointerEvents: 'none'
        }} />

        <Box sx={{ position: 'relative', textAlign: 'center' }}>
          {/* glow base */}
          <Box sx={{
            position: 'absolute', inset: -40, filter: 'blur(30px)', opacity: .35,
            background: 'radial-gradient(circle at 50% 50%, rgba(107,140,255,.6), transparent 50%)'
          }} />

          {/* logo + ring */}
          <Box sx={{ position: 'relative', display: 'inline-grid', placeItems: 'center' }}>
            {/* orbit ring */}
            <Box sx={{
              position: 'absolute', width: 160, height: 160, borderRadius: '50%',
              background:
                'conic-gradient(from 0turn, rgba(110,231,255,.7), rgba(167,139,250,.7), rgba(110,231,255,.7))',
              mask: 'radial-gradient(circle at center, transparent 55%, black 55%)',
              animation: 'orbit 4.8s linear infinite',
              filter: 'drop-shadow(0 0 12px rgba(110,231,255,.35))'
            }} />
            {/* pulsing inner */}
            <Box sx={{
              position: 'absolute', width: 120, height: 120, borderRadius: '50%',
              background:
                'radial-gradient(circle at 50% 50%, rgba(110,231,255,.25), transparent 60%)',
              animation: 'pulse 1.8s ease-in-out infinite'
            }} />

            {/* spinning logo */}
            <img
              src="/logo.png"
              alt="Loading"
              style={{
                width: 84, height: 84,
                transformStyle: 'preserve-3d',
                animation: 'spinY 1.2s linear infinite'
              }}
            />
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', opacity: .9 }}>
            Loading systems…
          </Typography>
        </Box>
      </Box>
    </>
  )
}
