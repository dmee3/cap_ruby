import React, { useCallback, useEffect, useState } from 'react'
import Utilities from '../../../utilities/utilities'
import ConflictCalendarView, { CalendarConflict } from '../conflicts/ConflictCalendarView'

type StatusOption = { id: number; name: string }

type TriageDashboardProps = {
  pendingCount: number
  oldestWaitingDays?: number | null
  oldestMember?: string
  statuses: StatusOption[]
  queuePath: string
  newPath: string
}

// §4.4 as a hero: a calendar of every conflict in the season from Flow 5's
// dashboard screen, with the backlog stated plainly and the oldest named
// underneath.
const TriageDashboard = ({
  pendingCount,
  oldestWaitingDays,
  oldestMember,
  statuses,
  queuePath,
  newPath,
}: TriageDashboardProps) => {
  const [conflicts, setConflicts] = useState<CalendarConflict[]>([])
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [calendarError, setCalendarError] = useState<string | null>(null)

  const loadCalendar = useCallback(() => {
    setCalendarLoading(true)
    setCalendarError(null)
    fetch('/api/conflicts')
      .then(resp => {
        if (!resp.ok) throw resp
        return resp.json()
      })
      .then(data => setConflicts(data.conflicts ?? []))
      .catch(() => setCalendarError('load'))
      .finally(() => setCalendarLoading(false))
  }, [])

  useEffect(() => {
    loadCalendar()
  }, [loadCalendar])

  const statusId = useCallback(
    (name: string) => statuses.find(status => status.name === name)?.id,
    [statuses]
  )

  const decide = useCallback(
    (id: number, name: 'Approved' | 'Denied') => {
      const target = statusId(name)
      if (!target) return

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
          loadCalendar()
        })
        .catch(() => setCalendarError('load'))
    },
    [statusId, loadCalendar]
  )

  return (
    <div className="flex flex-col gap-4">
      <ConflictCalendarView
        conflicts={conflicts}
        basePath={queuePath}
        loading={calendarLoading}
        error={calendarError}
        onRetry={loadCalendar}
        onApprove={id => decide(id, 'Approved')}
        onDeny={id => decide(id, 'Denied')}
        showDecided
      />

      <div
        className={`card flex flex-col gap-2 border-l-[4px] ${
          pendingCount > 0 ? 'border-l-warning-fg' : 'border-l-moss'
        }`}
      >
        <span className="text-label uppercase text-secondary">Conflicts waiting on you</span>
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
              <a href={queuePath} className="btn-gray btn-lg">
                See all season
              </a>
              <a href={newPath} className="link text-body-sm self-center">
                Add a conflict
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TriageDashboard
