import React, { PropsWithChildren } from 'react'
import { motion } from 'framer-motion'

type Props = PropsWithChildren<{
  delay?: number
  y?: number
  scale?: number
}>

/** Minimal enter animation for cards/sections. */
export default function MotionFade({ children, delay = 0, y = 8, scale = 1 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y, scale }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}
