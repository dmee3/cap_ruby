import React from 'react'

type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  body?: string
  action?: React.ReactNode
  className?: string
}

const EmptyState = ({ icon, title, body, action, className = '' }: EmptyStateProps) => (
  <div className={`flex flex-col items-center gap-2 text-center py-8 px-4 ${className}`.trim()}>
    {icon && <div className="text-secondary">{icon}</div>}
    <p className="text-body font-medium text-primary">{title}</p>
    {body && <p className="text-body-sm text-secondary max-w-sm">{body}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
)

export default EmptyState
