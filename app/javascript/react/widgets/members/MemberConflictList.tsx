import React from 'react'
import Card from '../../components/Card'
import ConflictContextRow from '../../components/ConflictContextRow'
import EmptyState from '../../components/EmptyState'
import { StatusValue } from '../../components/StatusPill'

export type ConflictListItem = {
  id: number
  date_range_label: string
  time_range_label?: string
  status: StatusValue
  relative_subline: string
  /** Present only when the server decided this row should show it (Denied / next-upcoming). */
  reason?: string
  /** Pending rows only — the server's own edit rule, not a widget guess. */
  editable?: boolean
  edit_path?: string
}

type MemberConflictListProps = {
  conflicts: ConflictListItem[]
  emptyTitle?: string
  emptyBody?: string
  /**
   * Show the per-row Edit affordance. On for the conflicts index, where
   * editing is the point; off for the dashboard card, which is a glance.
   */
  showEditLinks?: boolean
  /**
   * Wrap the rows in a `Card variant="list"` with this title — the header
   * strip and full-bleed body the Flow 3 board shows. Without it the rows
   * render bare, for a caller that brings its own card.
   */
  cardTitle?: string
  /** Muted text opposite the card title ("2026 Season · 3"). */
  cardCount?: string
}

// Renders the shared conflict-row shape (§4.19). Used both on the
// submit-conflict form (existing-conflicts context) and the dashboard
// "Your conflicts" card, with different empty-state copy per screen.
const MemberConflictList = ({
  conflicts,
  emptyTitle = 'Nothing on the books',
  emptyBody = "You haven't told anyone you'll miss a rehearsal this season. When you know, say so early.",
  showEditLinks = false,
  cardTitle,
  cardCount,
}: MemberConflictListProps) => {
  const body =
    conflicts.length === 0 ? (
      <EmptyState title={emptyTitle} body={emptyBody} />
    ) : (
      <div className="flex flex-col">
        {conflicts.map((c) => (
          <ConflictContextRow
            key={c.id}
            dateRangeLabel={c.date_range_label}
            timeRangeLabel={c.time_range_label}
            status={c.status}
            relativeSubline={c.relative_subline}
            reason={c.reason}
            editable={showEditLinks ? c.editable : undefined}
            editPath={c.edit_path}
            // The row owns its padding so the divider reaches the card's
            // edges. Every caller mounts this in a flush card now.
            className="border-b border-border-default px-4 py-3 last:border-0"
          />
        ))}
      </div>
    )

  if (!cardTitle) return body

  return (
    <Card variant="list" title={cardTitle} count={cardCount}>
      {body}
    </Card>
  )
}

export default MemberConflictList
