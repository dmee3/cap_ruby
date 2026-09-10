import React from 'react'

export type PillTone = 'success' | 'danger' | 'warning' | 'neutral'

type PillProps = {
  tone?: PillTone
  dot?: boolean
  /**
   * Uppercase status vocabulary (the §4.8 default) vs. sentence case for pills
   * carrying content rather than a status — a section name, "Paid 11/10".
   */
  casing?: 'upper' | 'sentence'
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

const Pill = ({
  tone = 'neutral',
  dot = false,
  casing = 'upper',
  className = '',
  children,
}: PillProps) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full ${
      casing === 'upper'
        ? 'px-2 py-0.5 text-label uppercase'
        : 'px-2.5 py-[3px] text-[11px] font-semibold leading-[15px]'
    } ${TONE_CLASSES[tone]} ${className}`.trim()}
  >
    {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[tone]}`} />}
    {children}
  </span>
)

export default Pill
