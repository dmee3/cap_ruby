import React from 'react'

type CardTone = 'neutral' | 'success' | 'danger' | 'warning'

/**
 * `panel`   — the original: padded box, uppercase kicker title. For stat
 *             blocks and small labelled boxes.
 * `section` — a padded box whose title is a real 16px sentence-case heading,
 *             baseline-aligned with its action. For a card that leads a piece
 *             of content rather than labelling a figure.
 * `list`    — edge-to-edge body under a bordered header strip, so rows can run
 *             full-bleed and supply their own padding.
 */
type CardVariant = 'panel' | 'section' | 'list'

type CardProps = {
  title?: string
  /** `list` only — a muted count beside the title ("3 members", "4 waiting"). */
  count?: string
  /** `list` only — one line under the title (the burndown's sampling note). */
  subtitle?: string
  action?: React.ReactNode
  tone?: CardTone
  variant?: CardVariant
  /** Draws the tone on the whole border rather than a left rail. */
  borderTone?: boolean
  as?: 'div' | 'section'
  className?: string
  children: React.ReactNode
}

const TONE_ACCENT: Record<CardTone, string> = {
  neutral: '',
  success: 'border-l-[3px] border-l-success-fg',
  danger: 'border-l-[3px] border-l-danger-fg',
  warning: 'border-l-[3px] border-l-warning-fg',
}

const TONE_BORDER: Record<CardTone, string> = {
  neutral: 'border-border-default',
  success: 'border-success-fg',
  danger: 'border-danger-fg',
  warning: 'border-warning-fg',
}

const TONE_TITLE: Record<CardTone, string> = {
  neutral: 'text-secondary',
  success: 'text-success-fg',
  danger: 'text-danger-fg',
  warning: 'text-warning-fg',
}

const Card = ({
  title,
  count,
  subtitle,
  action,
  tone = 'neutral',
  variant = 'panel',
  borderTone = false,
  as = 'div',
  className = '',
  children,
}: CardProps) => {
  const Tag = as
  const border = borderTone ? TONE_BORDER[tone] : 'border-border-default'

  if (variant === 'list') {
    return (
      <Tag
        className={`bg-surface border ${border} rounded-md overflow-hidden ${className}`.trim()}
      >
        {(title || action) && (
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-b border-border-default px-4 py-3.5">
            {title && <span className="text-h3 text-primary">{title}</span>}
            {count && <span className="text-body-sm text-secondary">{count}</span>}
            {subtitle && <span className="basis-full text-body-sm text-secondary">{subtitle}</span>}
            {action && <div className="ml-auto shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </Tag>
    )
  }

  if (variant === 'section') {
    return (
      <Tag
        className={`bg-surface border ${border} rounded-md px-6 pb-6 pt-5 ${
          borderTone ? '' : TONE_ACCENT[tone]
        } ${className}`.trim()}
      >
        {(title || subtitle || action) && (
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {title && <span className="text-h3 text-primary">{title}</span>}
            {subtitle && <span className="text-body-sm text-secondary">{subtitle}</span>}
            {action && <div className="ml-auto shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </Tag>
    )
  }

  return (
    <Tag
      className={`bg-surface border ${border} rounded-md p-4 ${
        borderTone ? '' : TONE_ACCENT[tone]
      } ${className}`.trim()}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          {title && <span className={`text-label uppercase ${TONE_TITLE[tone]}`}>{title}</span>}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </Tag>
  )
}

export default Card
