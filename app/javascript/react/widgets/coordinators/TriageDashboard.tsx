import React, { useCallback, useState } from 'react'
import Utilities from '../../../utilities/utilities'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import TriageRow, { TriageRowData } from '../../components/TriageRow'

type ReviewRow = TriageRowData & { member: string; section?: string }

type StatusOption = { id: number; name: string }

type TriageDashboardProps = {
  rows: ReviewRow[]
  pendingCount: number
  oldestWaitingDays?: number | null
  oldestMember?: string
  statuses: StatusOption[]
  queuePath: string
  newPath: string
}

// §4.4 as a hero: the backlog stated plainly, the oldest named, and enough of
// the queue inline to clear the easy ones without leaving the page.
//
// Replaces a card that mounted a second full FullCalendar — the dashboard used
// to fetch the whole season to draw a month grid in a panel.
const TriageDashboard = ({
  rows,
  pendingCount,
  oldestWaitingDays,
  oldestMember,
  statuses,
  queuePath,
  newPath,
}: TriageDashboardProps) => {
  const [decided, setDecided] = useState<Record<number, boolean>>({})
  const [busy, setBusy] = useState<Record<number, boolean>>({})

  const statusId = useCallback(
    (name: string) => statuses.find(status => status.name === name)?.id,
    [statuses]
  )

  const decide = useCallback(
    (id: number, name: 'Approved' | 'Denied') => {
      const target = statusId(name)
      if (!target) return

      setBusy(current => ({ ...current, [id]: true }))
      fetch(`/api/conflicts/${id}`, {
        method: 'PUT',
        headers: {
          'X-CSRF-TOKEN': Utilities.getAuthToken(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conflict: { status_id: target } }),
      })
        .then(resp => {
          if (!resp.ok) throw resp
          setDecided(current => ({ ...current, [id]: true }))
        })
        .catch(() => {
          // Leave the row in place: a failed decision must not look like a
          // successful one.
        })
        .finally(() => setBusy(current => ({ ...current, [id]: false })))
    },
    [statusId]
  )

  const remaining = rows.filter(row => !decided[row.id])
  const caughtUp = pendingCount === 0 || remaining.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`card flex flex-col gap-2 border-l-[4px] ${
          pendingCount > 0 ? 'border-l-warning-fg' : 'border-l-moss'
        }`}
      >
        <span className="text-label uppercase text-secondary">Waiting on you</span>
        <span className="text-h2 font-bold text-primary">
          {pendingCount > 0
            ? `${pendingCount} ${pendingCount === 1 ? 'conflict' : 'conflicts'}`
            : 'Nothing'}
        </span>
        <span className="text-body-sm text-secondary">
          {pendingCount > 0 && oldestMember
            ? `Oldest: ${oldestMember}${
                oldestWaitingDays ? `, waiting ${oldestWaitingDays} days` : ''
              }.`
            : "You're caught up. Check back in a few days to see if anything new comes in."}
        </span>
        <div className="mt-1 flex flex-wrap gap-2">
          {pendingCount > 0 ? (
            <a href={queuePath} className="btn-primary btn-lg">
              Open the queue
            </a>
          ) : (
            <>
              <a href={queuePath} className="btn-secondary btn-lg">
                See all season
              </a>
              <a href={newPath} className="link text-body-sm self-center">
                Add a conflict
              </a>
            </>
          )}
        </div>
      </div>

      <div className="card flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="card-title">Clear a few from here</span>
          {pendingCount > remaining.length && (
            <a href={queuePath} className="link text-body-sm">
              See all {pendingCount}
            </a>
          )}
        </div>

        {caughtUp ? (
          <EmptyState
            title="No decisions to make"
            body="When something comes in it shows up here with Approve and Deny on the row, so you can handle it without opening the queue."
          />
        ) : (
          <div className="divide-y divide-border-subtle">
            {remaining.map(row => (
              <TriageRow
                key={row.id}
                row={row}
                member={row.member}
                section={row.section}
                busy={busy[row.id]}
                onApprove={id => decide(id, 'Approved')}
                onDeny={id => decide(id, 'Denied')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TriageDashboard
