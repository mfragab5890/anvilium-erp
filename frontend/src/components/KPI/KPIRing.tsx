import React from 'react'

interface Props {
  value?: number // 0..100
  size?: number  // px
  stroke?: number // px
  trackColor?: string
  glowColor?: string
}

/**
 * Animated donut KPI.
 * Pure SVG + CSS. Keeps motion subtle and performant.
 */
export default function KPIRing({
  value = 64,
  size = 64,
  stroke = 8,
  trackColor = 'rgba(255,255,255,0.08)',
  glowColor = '#2EE6A6',
}: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  const offset = c - (clamped / 100) * c

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ar_ring">
      <defs>
        <filter id="glow">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={glowColor} floodOpacity="0.6" />
        </filter>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <g style={{ filter: 'url(#glow)' }}>
        <circle
          className="ar_ring-progress"
          cx={size/2}
          cy={size/2}
          r={r}
          fill="none"
          stroke={glowColor}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </g>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={size*0.28} fill="#E9EDF5">
        {Math.round(value)}%
      </text>
    </svg>
  )
}
