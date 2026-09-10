import React from 'react'

type EmptyStateTone = 'neutral' | 'danger'

type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  body?: string
  action?: React.ReactNode
  /** `danger` colours the title — for a failed load rather than an empty one. */
  tone?: EmptyStateTone
  className?: string
}

const TITLE_TONE: Record<EmptyStateTone, string> = {
  neutral: 'text-primary',
  danger: 'text-danger-fg',
}

const EmptyState = ({
  icon,
  title,
  body,
  action,
  tone = 'neutral',
  className = '',
}: EmptyStateProps) => (
  <div className={`flex flex-col items-center gap-1.5 px-6 py-8 text-center ${className}`.trim()}>
    {icon && <div className="text-secondary">{icon}</div>}
    <p className={`text-body font-semibold ${TITLE_TONE[tone]}`}>{title}</p>
    {body && <p className="max-w-[290px] text-body-sm text-secondary">{body}</p>}
    {action && <div className="mt-1">{action}</div>}
  </div>
)

export default EmptyState
