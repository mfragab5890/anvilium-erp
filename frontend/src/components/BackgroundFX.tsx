import React from 'react'

type Variant = 'aurora' | 'neonGrid' | 'starscape'

interface Props {
  variant?: Variant
  className?: string
}

/**
 * Full-screen background visual with 3 variants.
 * Mount once under your main layout. Pure CSS animations; no heavy libs.
 */
export default function BackgroundFX({ variant = 'aurora', className='' }: Props) {
  return (
    <div
      aria-hidden
      className={[
        'ar_fx',
        variant === 'aurora' ? 'ar_fx-aurora' : '',
        variant === 'neonGrid' ? 'ar_fx-neon' : '',
        variant === 'starscape' ? 'ar_fx-stars' : '',
        className,
      ].join(' ')}
    />
  )
}
