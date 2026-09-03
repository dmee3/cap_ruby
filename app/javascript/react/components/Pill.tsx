import React from 'react'

export type PillTone = 'success' | 'danger' | 'warning' | 'neutral'

type PillProps = {
  tone?: PillTone
  dot?: boolean
  className?: string
  children: React.ReactNode
}

// Static maps — no `bg-${tone}` string construction so Tailwind's scanner
// always sees the full class names.
const TONE_CLASSES: Record<PillTone, string> = {
  success: 'bg-success-bg text-success-fg',
  danger: 'bg-danger-bg text-danger-fg',
  warning: 'bg-warning-bg text-warning-fg',
  neutral: 'bg-neutral-bg text-neutral-fg',
}

const DOT_CLASSES: Record<PillTone, string> = {
  success: 'bg-success-fg',
  danger: 'bg-danger-fg',
  warning: 'bg-warning-fg',
  neutral: 'bg-neutral-fg',
}

const Pill = ({ tone = 'neutral', dot = false, className = '', children }: PillProps) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label uppercase ${TONE_CLASSES[tone]} ${className}`.trim()}
  >
    {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[tone]}`} />}
    {children}
  </span>
)

export default Pill
