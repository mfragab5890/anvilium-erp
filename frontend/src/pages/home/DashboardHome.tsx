// frontend/src/pages/DashboardHome.tsx
import * as React from 'react'
import { useMemo, useRef, useEffect, useState } from 'react'
import { Grid, Card, CardContent, Typography, Box, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Global } from '@emotion/react'

/* ========== Utilities ========== */
function seededRandom(seed: number) {
  // simple LCG for stable pseudo-random per title
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function useCountUp(value: string | number, duration = 900) {
  const isNumber = typeof value === 'number' || /^[\d,.]+$/.test(String(value))
  const target = isNumber ? Number(String(value).replace(/,/g, '')) : 0
  const [display, setDisplay] = useState(isNumber ? 0 : value)

  useEffect(() => {
    if (!isNumber) return
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, isNumber, duration])

  return isNumber ? display.toLocaleString() : display
}

/* ========== Tiny SVG Sparkline ========== */
function Sparkline({ seed = 1 }: { seed?: number }) {
  const theme = useTheme()
  const rnd = useMemo(() => seededRandom(seed), [seed])
  const points = useMemo(() => {
    const n = 26
    const arr: number[] = []
    let y = 0.6
    for (let i = 0; i < n; i++) {
      // wandering series
      y += (rnd() - 0.5) * 0.18
      y = Math.max(0.1, Math.min(0.95, y))
      arr.push(y)
    }
    return arr
  }, [rnd])

  const pathD = useMemo(() => {
    const w = 100, h = 28
    return points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * w
        const y = (1 - p) * h
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  }, [points])

  const stroke = theme.palette.mode === 'dark'
    ? 'url(#gradSparkDark)'
    : 'url(#gradSparkLight)'

  return (
    <svg width="100%" height="28" viewBox="0 0 100 28" preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="gradSparkDark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopOpacity="0" />
          <stop offset="35%" stopColor="#6ee7ff" />
          <stop offset="65%" stopColor="#a78bfa" />
          <stop offset="100%" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gradSparkLight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopOpacity="0" />
          <stop offset="35%" stopColor="#3b82f6" />
          <stop offset="65%" stopColor="#8b5cf6" />
          <stop offset="100%" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={pathD}
        pathLength={1}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: 1,
          animation: 'lineDraw 1.2s ease-out forwards'
        }}
      />
    </svg>
  )
}

/* ========== Holo KPI ========== */
function Kpi({ title, value, hint, seed = 1 }: { title: string; value: string; hint?: string; seed?: number }) {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement | null>(null)
  const displayValue = useCountUp(value)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const ry = (px - 0.5) * 8
    const rx = (0.5 - py) * 8
    el.style.setProperty('--rx', `${rx}deg`)
    el.style.setProperty('--ry', `${ry}deg`)
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', `0deg`)
    el.style.setProperty('--ry', `0deg`)
  }

  return (
    <Card
      ref={ref}
      variant="outlined"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        transform: 'rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateZ(0)',
        transition: 'transform .12s ease',
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(12,16,30,.55)' : 'rgba(255,255,255,.8)',
        backdropFilter: 'blur(8px) saturate(130%)',
        border: theme.palette.mode === 'dark'
          ? '1px solid rgba(120,140,255,.25)' : '1px solid rgba(90,120,255,.35)',
        '&:before': {
          content: '""',
          position: 'absolute',
          inset: -1,
          borderRadius: 12,
          padding: '1px',
          background: 'conic-gradient(from 0turn, #6ee7ff, #6b8cff, #a78bfa, #6ee7ff)',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          opacity: .35,
          filter: 'blur(1px)',
          animation: 'orbit 10s linear infinite'
        }
      }}
    >
      <CardContent sx={{ position: 'relative' }}>
        <Typography variant="caption" color="text.secondary">{title}</Typography>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between">
          <Typography variant="h5" fontWeight={800}>{displayValue}</Typography>
          <Box sx={{ width: 100, ml: 2, opacity: .9 }}>
            <Sparkline seed={seed} />
          </Box>
        </Stack>
        {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
      </CardContent>
    </Card>
  )
}

/* ========== Fancy Placeholders (SVG, no deps) ========== */
function LineChartPlaceholder({ title }: { title: string }) {
  const theme = useTheme()
  const textColor = theme.palette.text.secondary

  // stable example series
  const months = useMemo(() => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], [])
  const revenue = useMemo(() => [12,14,13,16,18,20,22,23,25,26,28,31], [])
  const cost    = useMemo(() => [11,11,12,12,13,14,16,17,18,18,19,20], [])

  const toPath = (arr: number[]) => {
    const w = 100, h = 48
    const max = Math.max(...arr)
    const min = Math.min(...arr)
    const rng = max - min || 1
    return arr.map((v, i) => {
      const x = (i / (arr.length - 1)) * w
      const y = h - ((v - min) / rng) * h
      return `${i ? 'L' : 'M'} ${x.toFixed(2)} ${y.toFixed(2)}`
    }).join(' ')
  }

  return (
    <Card variant="outlined" sx={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 3,
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(12,16,30,.55)' : 'rgba(255,255,255,.8)',
      backdropFilter: 'blur(8px) saturate(130%)',
      border: theme.palette.mode === 'dark'
        ? '1px solid rgba(120,140,255,.25)' : '1px solid rgba(90,120,255,.35)',
      '&:before': {
        content: '""', position: 'absolute', inset: -1, borderRadius: 12, padding: '1px',
        background: 'conic-gradient(from 0turn, #6ee7ff, #6b8cff, #a78bfa, #6ee7ff)',
        WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        WebkitMaskComposite: 'xor', maskComposite: 'exclude',
        opacity: .25, filter: 'blur(1px)', animation: 'orbit 16s linear infinite'
      }
    }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>{title}</Typography>
        <Box sx={{ height: 220 }}>
          <svg width="100%" height="100%" viewBox="0 0 100 70" preserveAspectRatio="none">
            {/* grid */}
            <g opacity=".25">
              {[...Array(6)].map((_, i) => (
                <line key={i} x1="0" x2="100" y1={10 + i*10} y2={10 + i*10} stroke="currentColor" strokeWidth=".2" />
              ))}
            </g>

            {/* axes labels (months) */}
            <g fontSize="2.8" fill={textColor} opacity=".7">
              {months.map((m, i) => (
                <text key={m} x={(i/(months.length-1))*100} y="68" textAnchor="middle">{m}</text>
              ))}
            </g>

            {/* revenue & cost paths */}
            <defs>
              <linearGradient id="gradRev" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={theme.palette.mode === 'dark' ? '#6ee7ff' : '#3b82f6'} />
                <stop offset="100%" stopColor={theme.palette.mode === 'dark' ? '#a78bfa' : '#8b5cf6'} />
              </linearGradient>
              <linearGradient id="gradCost" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={theme.palette.mode === 'dark' ? '#80ffea' : '#06b6d4'} />
                <stop offset="100%" stopColor={theme.palette.mode === 'dark' ? '#34d399' : '#22c55e'} />
              </linearGradient>
            </defs>

            <path d={toPath(cost)} pathLength={1} fill="none" stroke="url(#gradCost)" strokeWidth="0.8"
                  style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'lineDraw 1.4s .2s ease-out forwards' }} />
            <path d={toPath(revenue)} pathLength={1} fill="none" stroke="url(#gradRev)" strokeWidth="1.4"
                  style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'lineDraw 1.4s .4s ease-out forwards' }} />
          </svg>
        </Box>
      </CardContent>
    </Card>
  )
}

function DonutPlaceholder({ title }: { title: string }) {
  const theme = useTheme()
  // fake segments: current buckets %
  const segs = [
    { pct: 40, colorDark: '#6ee7ff', colorLight: '#3b82f6', label: '0–30d' },
    { pct: 30, colorDark: '#a78bfa', colorLight: '#8b5cf6', label: '31–60d' },
    { pct: 20, colorDark: '#34d399', colorLight: '#22c55e', label: '61–90d' },
    { pct: 10, colorDark: '#f59e0b', colorLight: '#f59e0b', label: '90d+' },
  ]
  const ring = 31.4159 * 2 // ~ circumference at r=10? we’ll normalize with pathLength

  let offset = 0
  return (
    <Card variant="outlined" sx={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 3,
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(12,16,30,.55)' : 'rgba(255,255,255,.8)',
      backdropFilter: 'blur(8px) saturate(130%)',
      border: theme.palette.mode === 'dark'
        ? '1px solid rgba(120,140,255,.25)' : '1px solid rgba(90,120,255,.35)',
      '&:before': {
        content: '""', position: 'absolute', inset: -1, borderRadius: 12, padding: '1px',
        background: 'conic-gradient(from 0turn, #6ee7ff, #6b8cff, #a78bfa, #6ee7ff)',
        WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        WebkitMaskComposite: 'xor', maskComposite: 'exclude',
        opacity: .25, filter: 'blur(1px)', animation: 'orbit 14s linear infinite'
      }
    }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>{title}</Typography>
        <Box sx={{ height: 220, display: 'grid', placeItems: 'center' }}>
          <svg width="180" height="180" viewBox="0 0 40 40">
            <g transform="rotate(-90 20 20)" strokeLinecap="round" strokeWidth="4" fill="none">
              {segs.map((s, i) => {
                const c = theme.palette.mode === 'dark' ? s.colorDark : s.colorLight
                const len = s.pct / 100
                const dasharray = `${len} ${1 - len}`
                const dashoffset = offset
                offset += len
                return (
                  <circle key={i}
                    cx="20" cy="20" r="12"
                    pathLength={1}
                    stroke={c}
                    style={{
                      strokeDasharray: dasharray,
                      strokeDashoffset: dashoffset,
                      filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 .6px rgba(110,231,255,.6))' : undefined,
                      animation: `donutDraw 900ms ${i * 160}ms ease-out both`
                    }}
                  />
                )
              })}
              {/* rotating highlight ring */}
              <circle cx="20" cy="20" r="12.5" stroke="url(#donutGlow)" strokeWidth="0.6" pathLength={1}
                      style={{ strokeDasharray: '0.08 0.92', animation: 'orbit 6s linear infinite' }} />
            </g>
            <defs>
              <linearGradient id="donutGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={theme.palette.mode === 'dark' ? '#6ee7ff' : '#3b82f6'} />
                <stop offset="100%" stopColor={theme.palette.mode === 'dark' ? '#a78bfa' : '#8b5cf6'} />
              </linearGradient>
            </defs>
            {/* Center labels */}
            <text x="20" y="20" textAnchor="middle" dominantBaseline="middle" fontSize="4.2" fill={theme.palette.text.primary}>
              Aging
            </text>
          </svg>
        </Box>
      </CardContent>
    </Card>
  )
}

/* ========== Futuristic Background ========== */
function FuturisticBG() {
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        background: dark
          ? 'radial-gradient(1200px 500px at 70% -10%, rgba(80,120,255,.14), transparent 60%), radial-gradient(1000px 400px at 10% 110%, rgba(120,80,255,.12), transparent 50%), linear-gradient(180deg, #0a0d1a, #0b1120)'
          : 'radial-gradient(1200px 500px at 70% -10%, rgba(80,120,255,.12), transparent 60%), radial-gradient(1000px 400px at 10% 110%, rgba(120,80,255,.10), transparent 50%), linear-gradient(180deg, #f7f9ff, #eef2ff)',
        '&:after': {
          content: '""',
          position: 'absolute', inset: 0,
          background:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 40px)',
          animation: 'gridShift 18s linear infinite',
          opacity: dark ? .25 : .2
        }
      }}
    />
  )
}

/* ========== Page ========== */
export default function DashboardHome() {
  const theme = useTheme()
  return (
    <Box sx={{ position: 'relative' }}>
      {/* global keyframes once */}
      <Global styles={{
        '@keyframes orbit': { to: { transform: 'rotate(1turn)' } },
        '@keyframes gridShift': {
          '0%': { backgroundPosition: '0px 0px, 0 0' },
          '100%': { backgroundPosition: '0 40px, 40px 0' }
        },
        '@keyframes lineDraw': {
          'to': { strokeDashoffset: 0 }
        },
        '@keyframes donutDraw': {
          '0%': { opacity: .2, transform: 'scale(0.98)' },
          '100%': { opacity: 1, transform: 'scale(1)' }
        }
      }} />
      <FuturisticBG />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><Kpi title="Active Projects" value="8" seed={11} /></Grid>
          <Grid item xs={12} md={3}><Kpi title="Pending Invoices" value="12" seed={22} /></Grid>
          <Grid item xs={12} md={3}><Kpi title="Low Stock" value="7" seed={33} /></Grid>
          <Grid item xs={12} md={3}><Kpi title="Visas Expiring" value="5" seed={44} /></Grid>

          <Grid item xs={12} md={8}><LineChartPlaceholder title="Revenue vs Costs (by month)" /></Grid>
          <Grid item xs={12} md={4}><DonutPlaceholder title="Invoice Aging" /></Grid>
        </Grid>
      </Box>
    </Box>
  )
}
