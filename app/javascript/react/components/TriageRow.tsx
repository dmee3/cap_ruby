import React, { useState } from 'react'
import Button from './Button'
import StatusPill, { StatusValue } from './StatusPill'

export type TriageRowData = {
  id: number
  date_range_label: string
  time_range_label?: string
  status: StatusValue | string
  relative_subline: string
  reason?: string
}

export type TriageRowProps = {
  row: TriageRowData
  /** Member name + section, shown only when the row stands alone (agenda,
   * dashboard) rather than under a §4.27 group header that already names them. */
  member?: string
  section?: string
  editHref?: string
  onApprove?: (id: number) => void
  onDeny?: (id: number) => void
  onResolve?: (id: number) => void
  /** Disables the decision buttons while a save is in flight. */
  busy?: boolean
  className?: string
}

// §4.26 — §4.19's conflict context row plus a decision.
//
// Two rules differ from §4.19 deliberately: the reason is available on every
// row (deciding requires it, where a member's own list stays scannable), and
// it expands in place rather than living in a hover tooltip — the thing this
// replaces was mouse-only with no keyboard or screen-reader path.
const TriageRow = ({
  row,
  member,
  section,
  editHref,
  onApprove,
  onDeny,
  onResolve,
  busy = false,
  className = '',
}: TriageRowProps) => {
  const [expanded, setExpanded] = useState(false)
  const isPending = row.status === 'Pending'
  const isApproved = row.status === 'Approved'
  const isDenied = row.status === 'Denied'
  const reason = row.reason?.trim()
  const panelId = `conflict-${row.id}-reason`

  return (
    <div
      className={`flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-4 ${
        expanded ? 'bg-sunken/40' : ''
      } ${className}`.trim()}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {member && (
          <span className="text-body-sm font-semibold text-primary">
            {member}
            {section && <span className="font-normal text-secondary"> · {section}</span>}
          </span>
        )}

        <div className="flex items-center gap-2.5">
          <span className="text-body font-semibold text-primary">
            {row.date_range_label}
            {row.time_range_label && ` · ${row.time_range_label}`}
          </span>
          <StatusPill status={row.status} />
        </div>

        <span className="text-caption text-secondary">{row.relative_subline}</span>

        {reason && !expanded && (
          <div className="flex items-baseline gap-2">
            <span className="min-w-0 truncate text-body-sm text-secondary">{reason}</span>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-expanded={false}
              aria-controls={panelId}
              className="flex-none text-body-sm font-semibold text-accent-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              Full reason
            </button>
          </div>
        )}

        {reason && expanded && (
          <div className="flex flex-col items-start gap-1.5">
            <div id={panelId} className="w-full rounded-md border border-border-subtle bg-sunken px-3.5 py-3">
              <p className="text-label uppercase text-secondary">Reason</p>
              <p className="mt-1 whitespace-pre-line text-body-sm text-primary">{reason}</p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-expanded
              aria-controls={panelId}
              className="text-body-sm font-semibold text-accent-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              Hide reason
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-none items-center gap-2">
        {isPending && onApprove && (
          <Button
            variant="success"
            size="md"
            fullWidthBelow={false}
            disabled={busy}
            onClick={() => onApprove(row.id)}
            className="flex-1 sm:flex-none"
          >
            Approve
          </Button>
        )}
        {isPending && onDeny && (
          <Button
            variant="danger"
            size="md"
            fullWidthBelow={false}
            disabled={busy}
            onClick={() => onDeny(row.id)}
            className="flex-1 sm:flex-none"
          >
            Deny
          </Button>
        )}
        {isApproved && onResolve && (
          <Button
            variant="secondary"
            size="md"
            fullWidthBelow={false}
            disabled={busy}
            onClick={() => onResolve(row.id)}
          >
            Mark resolved
          </Button>
        )}
        {isDenied && onApprove && (
          <Button
            variant="success"
            size="md"
            fullWidthBelow={false}
            disabled={busy}
            onClick={() => onApprove(row.id)}
          >
            Approve instead
          </Button>
        )}
        {editHref && (
          <a
            href={editHref}
            className="inline-flex h-9 items-center rounded-sm px-3 text-body-sm font-medium text-accent-primary transition hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            Edit
          </a>
        )}
      </div>
    </div>
  )
}

export default TriageRow
