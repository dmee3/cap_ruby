import React from 'react'
import StatusPill, { StatusValue } from './StatusPill'

type ConflictContextRowProps = {
  /** Preformatted by the caller — single day: "Sat 4/4"; multi-day: "Sat 4/4 – Mon 4/6". */
  dateRangeLabel: string
  timeRangeLabel?: string
  status: StatusValue
  /** e.g. "In 4 days · submitted 3 days ago" */
  relativeSubline: string
  /**
   * Only rendered when the caller passes it — the "Denied or next-upcoming
   * only" rule is a data-shaping decision made server-side, not here.
   */
  reason?: string
  /**
   * Members can change a conflict only while it's Pending. Pass the path to
   * render an active Edit link; pass `editable={false}` to render the
   * disabled one the canvas shows on a decided row. Omit both on screens
   * with no member edit affordance at all (the dashboard card).
   */
  editable?: boolean
  editPath?: string
  className?: string
}

// Reused both on the submit-conflict form's "already submitted" context list
// and the dashboard "Your conflicts" card, so the two reconcile visually —
// and so a future triage queue (Flow 5) can reuse the same row shape.
const ConflictContextRow = ({
  dateRangeLabel,
  timeRangeLabel,
  status,
  relativeSubline,
  reason,
  editable,
  editPath,
  className = '',
}: ConflictContextRowProps) => (
  <div className={`flex flex-col gap-1 py-3 ${className}`.trim()}>
    <div className="flex items-center justify-between gap-2">
      <span className="text-body-sm font-semibold text-primary">
        {dateRangeLabel}
        {timeRangeLabel && ` · ${timeRangeLabel}`}
      </span>
      <span className="flex items-center gap-2">
        <StatusPill status={status} />
        {editable && editPath && (
          <a href={editPath} className="link text-caption font-semibold">
            Edit
          </a>
        )}
        {editable === false && (
          <span
            className="text-caption font-semibold text-secondary opacity-50"
            title="Once it's decided, ask a coordinator if something changed."
          >
            Edit
          </span>
        )}
      </span>
    </div>
    <span className="text-caption text-secondary">{relativeSubline}</span>
    {reason && <span className="text-caption text-secondary">{reason}</span>}
  </div>
)

export default ConflictContextRow
