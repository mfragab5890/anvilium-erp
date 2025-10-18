import * as React from 'react'
import { Box, Grid, Card, CardContent, Typography, Chip, Stack, LinearProgress } from '@mui/material'

/** tiny animated donut (no external deps) */
function Ring({ value = 64, size = 88, stroke = 10, color = '#7AA0FF' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.max(0, Math.min(100, value)) / 100) * c
  return (
    <Box sx={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display:'block' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <g style={{ filter:'drop-shadow(0 0 6px rgba(122,160,255,.6))' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={c} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition:'stroke-dashoffset 600ms cubic-bezier(.22,1,.36,1)' }} />
        </g>
      </svg>
      <Box sx={{
        position:'absolute', inset:0, display:'grid', placeItems:'center',
        fontSize: size * 0.26, color: 'rgba(233,237,245,0.9)', fontWeight: 600
      }}>
        {Math.round(value)}%
      </Box>
    </Box>
  )
}

/** reusable glass card */
function GlassCard({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <Card
      sx={(t) => ({
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${t.palette.mode==='dark' ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'}`,
        background: t.palette.mode==='dark'
          ? 'rgba(12,16,30,.50)'
          : 'rgba(255,255,255,.70)',
        backdropFilter: 'blur(8px) saturate(130%)',
        boxShadow: t.palette.mode==='dark'
          ? '0 20px 60px rgba(0,0,0,.35)'
          : '0 18px 50px rgba(10,20,40,.15)',
        transition: 'transform .25s ease, box-shadow .25s ease, border-color .25s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: t.palette.mode==='dark'
            ? '0 28px 80px rgba(0,0,0,.45)'
            : '0 26px 72px rgba(10,20,40,.20)',
          borderColor: t.palette.mode==='dark' ? 'rgba(122,160,255,.35)' : 'rgba(16,60,160,.25)'
        }
      })}
    >
      <CardContent sx={{ p: 2.25 }}>
        <Stack spacing={0.5} mb={1.5}>
          <Typography variant="subtitle2" sx={{ opacity:.75 }}>{subtitle}</Typography>
          <Typography variant="h6">{title}</Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  )
}

export default function FuturisticHome() {
  // demo values — later wire to real endpoints
  const kpis = [
    { label:'Pipeline', value:'AED 2.4M', sub:'+12% MoM', tone:'info' as const },
    { label:'AR Overdue', value:'AED 180k', sub:'-6% WoW', tone:'warning' as const },
    { label:'Utilization', value:'74%', sub:'Target 80%', tone:'success' as const },
    { label:'Inventory Health', value:'Good', sub:'3 low-stock', tone:'success' as const },
  ]

  const atRisk = [
    { code:'PRJ-0142', client:'ENOC', risk:'Budget overrun 8%' },
    { code:'PRJ-0137', client:'DEWA', risk:'Schedule slippage 5d' },
    { code:'PRJ-0129', client:'ADNOC', risk:'Low manpower next week' },
  ]

  const actions = [
    { label:'New Proposal',    hint:'Ctrl + P' },
    { label:'Create Project',  hint:'Ctrl + J' },
    { label:'Receive Stock',   hint:'Ctrl + R' },
    { label:'Issue Invoice',   hint:'Ctrl + I' },
    { label:'Stocktake',       hint:'Ctrl + T' },
    { label:'Add Candidate',   hint:'Ctrl + C' },
  ]

  return (
    <Box sx={{ display:'grid', gap: 2, gridTemplateColumns: '1fr', color:'inherit' }}>
      {/* KPI STRIP */}
      <Grid container spacing={2}>
        {kpis.map((k, idx) => (
          <Grid item xs={12} sm={6} lg={3} key={idx}>
            <GlassCard title={k.value} subtitle={k.label}>
              <Chip size="small" label={k.sub} color={k.tone} variant="outlined" />
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      {/* RINGS + SPARKS */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6} lg={4}>
          <GlassCard title="Utilization" subtitle="This month">
            <Stack direction="row" spacing={2} alignItems="center">
              <Ring value={74} />
              <Box>
                <Typography variant="body2" sx={{ opacity:.75, mb: .75 }}>Baseline</Typography>
                <LinearProgress variant="determinate" value={74} sx={{ height: 8, borderRadius: 99, mb: 1 }}/>
                <Typography variant="caption" sx={{ opacity:.7 }}>Target 80% • +3% vs last</Typography>
              </Box>
            </Stack>
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <GlassCard title="Proposal Win Rate" subtitle="Quarter to date">
            <Stack direction="row" spacing={2} alignItems="center">
              <Ring value={38} color="#2EE6A6" />
              <Box>
                <Typography variant="body2" sx={{ opacity:.75, mb: .75 }}>Sent 42 • Won 16</Typography>
                <LinearProgress variant="determinate" value={38} sx={{ height: 8, borderRadius: 99, mb: 1 }}/>
                <Typography variant="caption" sx={{ opacity:.7 }}>+5 won vs last quarter</Typography>
              </Box>
            </Stack>
          </GlassCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <GlassCard title="Inventory Health" subtitle="Stores">
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ opacity:.8 }}>Low stock</Typography>
                <Typography variant="body2">3</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ opacity:.8 }}>Overdue returns</Typography>
                <Typography variant="body2">5</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ opacity:.8 }}>In maintenance</Typography>
                <Typography variant="body2">2</Typography>
              </Stack>
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>

      {/* AT RISK + QUICK ACTIONS */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <GlassCard title="Projects at Risk" subtitle="Watchlist">
            <Stack spacing={1.25}>
              {atRisk.map((r, i) => (
                <Box key={i} sx={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  p: 1.25, borderRadius: 2,
                  border: (t)=>`1px dashed ${t.palette.divider}`,
                  transition:'background .25s ease',
                  '&:hover': { background: 'rgba(122,160,255,.08)' }
                }}>
                  <Stack>
                    <Typography variant="subtitle2">{r.code} • {r.client}</Typography>
                    <Typography variant="caption" sx={{ opacity:.75 }}>{r.risk}</Typography>
                  </Stack>
                  <Chip size="small" label="Open" color="warning" variant="outlined" />
                </Box>
              ))}
            </Stack>
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <GlassCard title="Quick Actions" subtitle="Do it now">
            <Grid container spacing={1.25}>
              {actions.map((a, i) => (
                <Grid item xs={6} key={i}>
                  <Box sx={(t)=>({
                    p: 1.25, borderRadius: 2, textAlign:'center', cursor:'pointer',
                    border:`1px solid ${t.palette.divider}`,
                    transition:'transform .18s ease, background .18s ease, border-color .18s ease',
                    background: t.palette.mode==='dark' ? 'rgba(255,255,255,.03)' : 'rgba(10,20,40,.03)',
                    '&:hover': {
                      transform:'translateY(-2px)',
                      borderColor: t.palette.mode==='dark' ? 'rgba(122,160,255,.35)' : 'rgba(16,60,160,.25)',
                      background: t.palette.mode==='dark' ? 'rgba(122,160,255,.08)' : 'rgba(16,60,160,.06)',
                    }
                  })}>
                    <Typography variant="body2" sx={{ fontWeight:600 }}>{a.label}</Typography>
                    <Typography variant="caption" sx={{ opacity:.6 }}>{a.hint}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  )
}
