import React from 'react'

export type StatTone = 'neutral' | 'success' | 'warning' | 'danger'

type StatBlockProps = {
  /** Uppercase label above the number, e.g. "MEMBERS BEHIND". */
  kicker: string
  /** The big tabular number — already formatted ("$9,420", "3", "9 days"). */
  metric: string
  /** One supporting line: "of $12,600", "as of today". */
  context?: string
  /** A short delta / trend chip shown next to the metric. */
  trend?: string
  /** Explicit tone; overridden by `threshold` when that is set. */
  tone?: StatTone
  /**
   * A count that drives the tone by banding: 0 → success, 1–4 → warning,
   * 5+ → danger. So the "members behind" colour isn't hand-coded per screen.
   */
  threshold?: number
  className?: string
}

const METRIC_TONE: Record<StatTone, string> = {
  neutral: 'text-primary',
  success: 'text-success-fg',
  warning: 'text-warning-fg',
  danger: 'text-danger-fg',
}

const KICKER_TONE: Record<StatTone, string> = {
  neutral: 'text-secondary',
  success: 'text-success-fg',
  warning: 'text-warning-fg',
  danger: 'text-danger-fg',
}

const bandFor = (count: number): StatTone => {
  if (count <= 0) return 'success'
  if (count < 5) return 'warning'
  return 'danger'
}

const StatBlock = ({
  kicker,
  metric,
  context,
  trend,
  tone = 'neutral',
  threshold,
  className = '',
}: StatBlockProps) => {
  const effectiveTone = threshold === undefined ? tone : bandFor(threshold)

  return (
    <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
      <span className={`text-label uppercase ${KICKER_TONE[effectiveTone]}`}>{kicker}</span>
      <div className="flex items-baseline gap-2">
        <span
          className={`text-metric font-extrabold tabular-nums tracking-tight ${METRIC_TONE[effectiveTone]}`}
        >
          {metric}
        </span>
        {trend && <span className="text-body-sm text-secondary">{trend}</span>}
      </div>
      {context && <span className="text-caption text-secondary">{context}</span>}
    </div>
  )
}

export default StatBlock
