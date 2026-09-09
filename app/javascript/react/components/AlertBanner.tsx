import React from 'react'

export type AlertAction = {
  label: string
  href: string
  /** Text of the link at the end of the row (defaults to "Set up schedule"). */
  linkLabel?: string
}

type AlertTone = 'warning' | 'danger' | 'neutral'

type AlertBannerProps = {
  tone?: AlertTone
  headline: string
  /** One plain explanatory line. */
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

const HEADLINE_TONE: Record<AlertTone, string> = {
  warning: 'text-warning-fg',
  danger: 'text-danger-fg',
  neutral: 'text-primary',
}

// Replaces the admin dashboard's flash[:error] array ("Member found with blank
// payment schedule: …") and the single-member equivalent on Member 360.
const AlertBanner = ({
  tone = 'warning',
  headline,
  body,
  onDismiss,
  actions = [],
  className = '',
}: AlertBannerProps) => (
  <div
    className={`rounded-md border border-border-default border-l-[3px] bg-surface p-4 ${ACCENT[tone]} ${className}`.trim()}
    role="status"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <span className={`text-h3 ${HEADLINE_TONE[tone]}`}>{headline}</span>
        {body && <span className="text-body-sm text-secondary">{body}</span>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-sm px-2 py-1 text-body-sm text-secondary hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          Dismiss
        </button>
      )}
    </div>

    {actions.length > 0 && (
      <ul className="mt-3 flex flex-col divide-y divide-border-default border-t border-border-default">
        {actions.map((action) => (
          <li key={action.href} className="flex items-center justify-between gap-3 py-2">
            <span className="text-body-sm text-primary">{action.label}</span>
            <a href={action.href} className="shrink-0 text-body-sm font-semibold text-accent-primary">
              {action.linkLabel ?? 'Set up schedule'}
            </a>
          </li>
        ))}
      </ul>
    )}
  </div>
)

export default AlertBanner
