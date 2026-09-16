import React from 'react'
import { historyDate } from '../../utilities/history_dates'
import { avatarTone, initialsFor } from '../../utilities/avatars'

export type AuditEntry = {
  id: number
  change: number
  previousQuantity: number
  performedOn: string
  userName: string
}

const MINUS = '−'

// "First count" is the opening balance written when the item was created.
const actionLabel = (entry: AuditEntry) => {
  if (entry.previousQuantity === 0 && entry.change > 0) return 'First count'
  return entry.change > 0 ? 'Added stock' : 'Took stock out'
}

/**
 * §4.6, audit variant. Not its own component so much as the table row with a
 * person on the left: the identity cell is the roster row's shape and the
 * right-aligned numeric pair is the dues row's, so a trail reads like the rest
 * of the app.
 *
 * The name is the headline — who did it is the reason this screen exists.
 */
const AuditRow = ({ entry, today }: { entry: AuditEntry; today?: Date }) => {
  const resulting = entry.previousQuantity + entry.change
  const positive = entry.change > 0

  return (
    <li className="flex items-center gap-3 border-b border-border-default px-4 py-3 last:border-b-0">
      <span
        aria-hidden="true"
        className={[
          'flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full',
          'text-[11px] font-bold text-on-brand',
          avatarTone(entry.userName),
        ].join(' ')}
      >
        {initialsFor(entry.userName)}
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body font-semibold text-primary">{entry.userName}</span>
        {/* Dropped on mobile, where the delta pill already carries direction. */}
        <span className="hidden text-caption text-secondary sm:block">{actionLabel(entry)}</span>
      </span>

      <span
        className={[
          'flex-none rounded-full px-[10px] py-[3px] font-mono text-body-sm font-bold',
          positive ? 'bg-success-bg text-success-fg' : 'bg-danger-bg text-danger-fg',
        ].join(' ')}
      >
        {positive ? `+${entry.change}` : `${MINUS}${Math.abs(entry.change)}`}
      </span>

      <span className="hidden w-[128px] flex-none text-right text-body-sm text-secondary sm:block">
        {entry.previousQuantity} → <span className="font-mono font-bold text-primary">{resulting}</span>
      </span>

      <span className="hidden w-[104px] flex-none text-right text-body-sm text-secondary sm:block">
        {historyDate(entry.performedOn, today)}
      </span>

      {/* Phone: the run and the date share one line under the name. */}
      <span className="w-[112px] flex-none text-right text-caption text-secondary sm:hidden">
        {entry.previousQuantity} → <span className="font-mono font-bold text-primary">{resulting}</span>
        {' · '}
        {historyDate(entry.performedOn, today)}
      </span>
    </li>
  )
}

export default AuditRow
