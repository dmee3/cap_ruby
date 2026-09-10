import React from 'react'

export type AlertAction = {
  /** Primary label — the member's name. */
  label: string
  /** Muted second column — "New member · Battery / Snare". */
  meta?: string
  href: string
  /** Text of the link at the end of the row (defaults to "Set up schedule"). */
  linkLabel?: string
}

type AlertTone = 'warning' | 'danger' | 'neutral'

type AlertBannerProps = {
  tone?: AlertTone
  headline: string
  /** One plain explanatory line, set on the headline's baseline. */
  body?: string
  onDismiss?: () => void
  /** Embedded mini-list — one row per affected member. */
  actions?: AlertAction[]
  className?: string
}

const ACCENT: Record<AlertTone, string> = {
  warning: 'border-l-warning-fg',
  danger: 'border-l-danger-fg',
  neutral: 'border-l-border-strong',
}

// Replaces the admin dashboard's flash[:error] array ("Member found with blank
// payment schedule: …") and the single-member equivalent on Member 360.
// The headline is NOT tone-coloured — the 3px rail carries the tone.
const AlertBanner = ({
  tone = 'warning',
  headline,
  body,
  onDismiss,
  actions = [],
  className = '',
}: AlertBannerProps) => (
  <div
    className={`overflow-hidden rounded-md border border-border-default border-l-[3px] bg-surface px-4 py-3.5 ${ACCENT[tone]} ${className}`.trim()}
    role="status"
  >
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-body-sm font-semibold text-primary">{headline}</span>
      {body && <span className="text-body-sm text-secondary">{body}</span>}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-auto shrink-0 text-body-sm font-medium text-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          Dismiss ✕
        </button>
      )}
    </div>

    {actions.length > 0 && (
      <ul className="mt-2.5 flex flex-col gap-px overflow-hidden rounded-sm border border-border-default bg-sunken">
        {actions.map((action) => (
          <li key={action.href} className="flex items-center gap-3 bg-surface px-3 py-2.5">
            <span className="flex-1 text-body-sm font-semibold text-primary">{action.label}</span>
            {action.meta && <span className="text-caption text-secondary">{action.meta}</span>}
            <a
              href={action.href}
              className="shrink-0 text-body-sm font-semibold text-accent-primary no-underline hover:underline"
            >
              {action.linkLabel ?? 'Set up schedule'}
            </a>
          </li>
        ))}
      </ul>
    )}
  </div>
)

export default AlertBanner
