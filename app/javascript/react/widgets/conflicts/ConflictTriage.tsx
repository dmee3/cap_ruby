import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Utilities from '../../../utilities/utilities'
import Button from '../../components/Button'
import ViewSwitcher, { ViewOption } from '../../components/ViewSwitcher'
import ConflictFilterBar, {
  ConflictFilters,
  DEFAULT_CONFLICT_FILTERS,
} from '../../components/ConflictFilterBar'
import TriageQueue, { PendingDecision, TriageGroup } from './TriageQueue'
import ConflictCalendarView, { CalendarConflict } from './ConflictCalendarView'

type StatusOption = { id: number; name: string }

type ConflictTriageProps = {
  /** '/admin/conflicts' or '/coordinators/conflicts' — the only thing that
   * differed between the two entrypoints this replaces. */
  basePath: string
  ensembles?: string[]
}

const VIEW_STORAGE_KEY = 'capcity.conflicts.view'
const PAGE_SIZE = 10
const UNDO_MS = 60000

const readStoredView = (): ViewOption => {
  try {
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === 'calendar' ? 'calendar' : 'queue'
  } catch {
    // Private browsing or blocked storage — the preference is a convenience,
    // never a requirement.
    return 'queue'
  }
}

const ConflictTriage = ({ basePath, ensembles = [] }: ConflictTriageProps) => {
  const [groups, setGroups] = useState<TriageGroup[]>([])
  const [conflicts, setConflicts] = useState<CalendarConflict[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [statuses, setStatuses] = useState<StatusOption[]>([])
  const [filters, setFilters] = useState<ConflictFilters>(DEFAULT_CONFLICT_FILTERS)
  const [view, setView] = useState<ViewOption>(readStoredView)
  const [showDecided, setShowDecided] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [decisions, setDecisions] = useState<Record<number, PendingDecision>>({})
  const timers = useRef<Record<number, number>>({})

  const statusId = useCallback(
    (name: string) => statuses.find(status => status.name === name)?.id,
    [statuses]
  )

  const query = useMemo(() => {
    const params = new URLSearchParams()
    // The queue is only ever "what needs a decision" — every pending conflict,
    // unfiltered. The ensemble filter belongs to the calendar, which is the
    // only view that renders the control; applying it to the queue would hide
    // conflicts behind a filter the queue gives you no way to see or clear.
    if (view === 'queue') {
      params.set('status', 'Pending')
      params.set('when', 'upcoming')
    } else if (filters.ensemble) {
      params.set('ensemble', filters.ensemble)
    }
    return params.toString()
  }, [filters, view])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/conflicts?${query}`)
      .then(resp => {
        if (!resp.ok) throw resp
        return resp.json()
      })
      .then(data => {
        setGroups(data.groups ?? [])
        setConflicts(data.conflicts ?? [])
        setCounts(data.counts ?? {})
        setVisibleCount(PAGE_SIZE)
      })
      .catch(() => setError('load'))
      .finally(() => setLoading(false))
  }, [query])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    fetch('/api/conflict_statuses')
      .then(resp => (resp.ok ? resp.json() : []))
      .then(setStatuses)
      .catch(() => setStatuses([]))
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, view)
    } catch {
      // Not worth surfacing — the view still works, it just won't be remembered.
    }
  }, [view])

  // Clear any countdown still running when the widget goes away.
  useEffect(
    () => () => {
      Object.values(timers.current).forEach(window.clearTimeout)
    },
    []
  )

  const rowFor = useCallback(
    (id: number) => {
      for (const group of groups) {
        const row = group.rows.find(candidate => candidate.id === id)
        if (row) return row
      }
      return null
    },
    [groups]
  )

  const save = useCallback(
    (id: number, target: number) =>
      fetch(`/api/conflicts/${id}`, {
        method: 'PUT',
        headers: {
          'X-CSRF-TOKEN': Utilities.getAuthToken(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conflict: { status_id: target } }),
      }).then(resp => {
        if (!resp.ok) throw resp
        return resp
      }),
    []
  )

  const decide = useCallback(
    (id: number, statusName: 'Approved' | 'Denied' | 'Resolved') => {
      const target = statusId(statusName)
      if (!target) return

      const found = rowFor(id)

      // On the calendar there is no visible row to turn into a confirmation —
      // both views share one payload, so a queue row usually still exists in
      // state, but confirming on it would be invisible. Save and refetch
      // instead, so the event picks up its new colour.
      if (view === 'calendar' || !found) {
        save(id, target)
          .then(load)
          .catch(() => setError('load'))
        return
      }

      const label = [found.date_range_label, found.time_range_label]
        .filter(Boolean)
        .join(' · ')

      // Optimistic: the row flips immediately and the count follows, because a
      // coordinator clearing a queue shouldn't wait on a round trip per row.
      setDecisions(current => ({
        ...current,
        [id]: {
          outcome: statusName,
          member: found.member,
          dateLabel: label,
          saving: true,
          error: null,
        },
      }))

      save(id, target)
        .then(() => {
          setDecisions(current => ({ ...current, [id]: { ...current[id], saving: false } }))
        })
        .catch(() => {
          setDecisions(current => ({
            ...current,
            [id]: {
              ...current[id],
              saving: false,
              error: "We couldn't save that one.",
            },
          }))
        })
    },
    [rowFor, statusId, save, load, view]
  )

  // Undo restores the prior status. The row was already written, so this is a
  // second write rather than a cancelled one — the design's "saved right away,
  // undoable for a minute" contract.
  const undo = useCallback(
    (id: number) => {
      const target = statusId('Pending')
      window.clearTimeout(timers.current[id])
      delete timers.current[id]
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
          setDecisions(current => {
            const next = { ...current }
            delete next[id]
            return next
          })
          load()
        })
        .catch(() => setError('load'))
    },
    [statusId, load]
  )

  const expire = useCallback((id: number) => {
    setDecisions(current => {
      const next = { ...current }
      delete next[id]
      return next
    })
    setGroups(current =>
      current
        .map(group => ({ ...group, rows: group.rows.filter(row => row.id !== id) }))
        .filter(group => group.rows.length > 0)
    )
  }, [])

  const pendingTotal = counts.Pending ?? 0
  const headline = pendingTotal === 1 ? '1 waiting on you' : `${pendingTotal} waiting on you`

  // Grouped by date, so the useful pointer is what's coming up soonest rather
  // than who has waited longest.
  const soonest = groups.find(group => group.pending_count > 0)
  const subline = soonest ? `Next up: ${soonest.date_label}.` : 'Nothing needs a decision.'

  const addButton = (
    <a
      href={`${basePath}/new`}
      className="inline-flex h-9 items-center justify-center rounded-sm bg-ocean px-4 text-body-sm font-medium text-on-brand transition hover:bg-ocean-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      Add conflict
    </a>
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="m-0 text-h3 text-primary">{headline}</h1>
        <span className="text-body-sm text-secondary">{subline}</span>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <ViewSwitcher value={view} onChange={setView} />
        {addButton}
      </div>

      {view === 'calendar' && (
        <ConflictFilterBar
          filters={filters}
          onChange={setFilters}
          ensembles={ensembles}
          showDecided={showDecided}
          onShowDecidedChange={setShowDecided}
        />
      )}

      {view === 'queue' ? (
        <TriageQueue
          groups={groups}
          basePath={basePath}
          loading={loading}
          error={error}
          onRetry={load}
          onApprove={id => decide(id, 'Approved')}
          onDeny={id => decide(id, 'Denied')}
          onResolve={id => decide(id, 'Resolved')}
          onUndo={undo}
          onDecisionExpire={expire}
          decisions={decisions}
          visibleCount={visibleCount}
          onShowMore={() => setVisibleCount(count => count + PAGE_SIZE)}
          emptyAction={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="secondary"
                size="md"
                fullWidthBelow={false}
                onClick={() => setView('calendar')}
              >
                See the calendar
              </Button>
              {addButton}
            </div>
          }
        />
      ) : (
        <ConflictCalendarView
          conflicts={conflicts}
          basePath={basePath}
          loading={loading}
          error={error}
          onRetry={load}
          onApprove={id => decide(id, 'Approved')}
          onDeny={id => decide(id, 'Denied')}
          showDecided={showDecided}
        />
      )}
    </div>
  )
}

export default ConflictTriage
export { UNDO_MS }
