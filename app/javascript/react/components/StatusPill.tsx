import React from 'react'
import Pill, { PillTone } from './Pill'

export type StatusValue =
  | 'Pending'
  | 'Approved'
  | 'Denied'
  | 'Resolved'
  | 'Current'
  | 'Behind'
  | 'Due soon'
  | 'Complete'
  | 'Draft'

const STATUS_TONE: Record<StatusValue, PillTone> = {
  Pending: 'warning',
  Approved: 'success',
  Denied: 'danger',
  Resolved: 'neutral',
  Current: 'success',
  Behind: 'danger',
  'Due soon': 'warning',
  Complete: 'success',
  Draft: 'neutral',
}

type StatusPillProps = {
  status: StatusValue | string
  dot?: boolean
  className?: string
}

// Unknown status strings fall back to neutral rather than throwing — the
// conflict-status vocabulary is data-driven and may grow.
const StatusPill = ({ status, dot = true, className = '' }: StatusPillProps) => {
  const tone = STATUS_TONE[status as StatusValue] ?? 'neutral'
  return (
    <Pill tone={tone} dot={dot} className={className}>
      {status}
    </Pill>
  )
}

export default StatusPill
