import React from 'react'
import Pill from './Pill'

// The §4.23 soft-deleted-Payment treatment, shared by the payments table row,
// the mobile payment card, and the Member 360 payments list: struck-through
// cells, a neutral "Deleted" pill, a faint tint, and a single Restore action
// in place of the usual row actions. Deleted rows never count toward a total.

/** Class string for the row/card container when `deleted` is true. */
export const deletedRowClass = (deleted: boolean): string =>
  deleted ? 'line-through opacity-60 bg-sunken/60' : ''

export const DeletedPill = ({ className = '' }: { className?: string }) => (
  <Pill tone="neutral" className={className}>
    Deleted
  </Pill>
)

type RestoreActionProps = {
  onRestore: () => void
  pending?: boolean
  className?: string
}

export const RestoreAction = ({ onRestore, pending = false, className = '' }: RestoreActionProps) => (
  <button
    type="button"
    onClick={onRestore}
    disabled={pending}
    aria-busy={pending || undefined}
    className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-body-sm font-medium text-accent-primary no-underline hover:bg-sunken disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${className}`.trim()}
  >
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M3 8a5 5 0 105-5V1L4 4l4 3V5a3 3 0 11-3 3z"
        fill="currentColor"
      />
    </svg>
    Restore
  </button>
)
