import React, { forwardRef } from 'react'

/**
 * `default` — dismiss and close: muted until hovered.
 * `danger`  — removes a row; quiet at rest so a column of them doesn't read
 *             as a column of warnings, red only under the pointer.
 * `onFill`  — sits on a coloured fill (a toast), so it takes the fill's text
 *             colour rather than a token that may vanish against it.
 */
type IconButtonTone = 'default' | 'danger' | 'onFill'

type IconButtonProps = {
  /** What the button does — it has no visible text, so this is its whole name. */
  label: string
  tone?: IconButtonTone
  /** Defaults to ✕, the only glyph any caller needs so far. */
  icon?: React.ReactNode
  className?: string
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'>

const TONE: Record<IconButtonTone, string> = {
  default: 'text-secondary hover:bg-sunken hover:text-primary',
  danger: 'text-secondary hover:bg-danger-bg hover:text-danger-fg',
  onFill: 'text-current opacity-80 hover:bg-white/15 hover:opacity-100',
}

const Cross = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
)

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, tone = 'default', icon, className = '', ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={`inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 ${TONE[tone]} ${className}`.trim()}
    >
      {icon ?? <Cross />}
    </button>
  ),
)

IconButton.displayName = 'IconButton'

export default IconButton
