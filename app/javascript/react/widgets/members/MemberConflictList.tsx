import React from 'react'
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
}

type MemberConflictListProps = {
  conflicts: ConflictListItem[]
  emptyTitle?: string
  emptyBody?: string
}

// Renders the shared conflict-row shape (§4.19). Used both on the
// submit-conflict form (existing-conflicts context) and the dashboard
// "Your conflicts" card, with different empty-state copy per screen.
const MemberConflictList = ({
  conflicts,
  emptyTitle = 'Nothing on the books',
  emptyBody = "You haven't told anyone you'll miss a rehearsal this season. When you know, say so early.",
}: MemberConflictListProps) => {
  if (conflicts.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} />
  }

  return (
    <div className="flex flex-col divide-y divide-border-default">
      {conflicts.map((c) => (
        <ConflictContextRow
          key={c.id}
          dateRangeLabel={c.date_range_label}
          timeRangeLabel={c.time_range_label}
          status={c.status}
          relativeSubline={c.relative_subline}
          reason={c.reason}
        />
      ))}
    </div>
  )
}

export default MemberConflictList
