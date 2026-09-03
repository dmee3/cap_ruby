import React from 'react'

type CardTone = 'neutral' | 'success' | 'danger' | 'warning'

type CardProps = {
  title?: string
  action?: React.ReactNode
  tone?: CardTone
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

const TONE_TITLE: Record<CardTone, string> = {
  neutral: 'text-secondary',
  success: 'text-success-fg',
  danger: 'text-danger-fg',
  warning: 'text-warning-fg',
}

const Card = ({ title, action, tone = 'neutral', as = 'div', className = '', children }: CardProps) => {
  const Tag = as
  return (
    <Tag
      className={`bg-surface border border-border-default rounded-md p-5 ${TONE_ACCENT[tone]} ${className}`.trim()}
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
