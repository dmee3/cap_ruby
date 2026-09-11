import React from 'react'
import Button from './Button'
import Pill from './Pill'

export type MemberGroupHeaderProps = {
  member: string
  initials?: string
  ensemble?: string
  section?: string
  pendingCount: number
  /** Days the oldest pending conflict has been waiting — the staleness flag. */
  waitingDays?: number | null
  /** Shown only at two or more pending, per §4.27. */
  onApproveAll?: () => void
  busy?: boolean
  className?: string
}

// §4.27 — the header of a queue group card.
//
// The right slot carries EITHER a staleness flag OR the bulk action, never
// both: two competing signals in one corner read as noise.
const STALE_AFTER_DAYS = 14

const MemberGroupHeader = ({
  member,
  initials,
  ensemble,
  section,
  pendingCount,
  waitingDays,
  onApproveAll,
  busy = false,
  className = '',
}: MemberGroupHeaderProps) => {
  const showBulk = pendingCount >= 2 && !!onApproveAll
  const isStale = !showBulk && typeof waitingDays === 'number' && waitingDays >= STALE_AFTER_DAYS
  const subtitle = [ensemble, section].filter(Boolean).join(' · ')

  return (
    <div
      className={`flex items-center gap-3 border-b border-border-subtle bg-sunken px-4 py-3 ${className}`.trim()}
    >
      {initials && (
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-ocean text-caption font-semibold text-on-brand">
          {initials}
        </span>
      )}

      <div className="flex min-w-0 flex-col">
        <span className="truncate text-body font-semibold text-primary">{member}</span>
        {subtitle && <span className="truncate text-caption text-secondary">{subtitle}</span>}
      </div>

      {pendingCount > 0 ? (
        <Pill tone="warning" casing="sentence">
          {pendingCount} pending
        </Pill>
      ) : (
        <Pill tone="neutral" casing="sentence">
          Nothing pending
        </Pill>
      )}

      <div className="ml-auto flex flex-none items-center">
        {showBulk && (
          <Button variant="secondary" size="sm" fullWidthBelow={false} disabled={busy} onClick={onApproveAll}>
            Approve all {pendingCount}
          </Button>
        )}
        {isStale && (
          <span className="text-caption font-medium text-danger-fg">
            Waiting {waitingDays} days
          </span>
        )}
      </div>
    </div>
  )
}

export default MemberGroupHeader
