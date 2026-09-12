import React from 'react'
import Toggle from './Toggle'

export type ConflictFilters = {
  ensemble: string
}

export const DEFAULT_CONFLICT_FILTERS: ConflictFilters = {
  ensemble: '',
}

export const isDirty = (f: ConflictFilters) => f.ensemble !== ''

type ConflictFilterBarProps = {
  filters: ConflictFilters
  onChange: (next: ConflictFilters) => void
  ensembles?: string[]
  /** Calendar only — the queue is always just what needs a decision. */
  showDecided?: boolean
  onShowDecidedChange?: (value: boolean) => void
  className?: string
}

const field =
  'h-[38px] rounded-sm border border-border-strong bg-surface px-2.5 text-body-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1'

// The calendar's filter line. There is no status filter: the calendar shows
// everything, and the one thing worth hiding — decided conflicts — is the
// toggle on this same row. The queue doesn't render this at all; it is only
// ever the pending queue.
const ConflictFilterBar = ({
  filters,
  onChange,
  ensembles = [],
  showDecided,
  onShowDecidedChange,
  className = '',
}: ConflictFilterBarProps) => {
  if (ensembles.length === 0 && !onShowDecidedChange) return null

  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-md border border-border-default bg-surface px-4 py-3 ${className}`.trim()}
    >
      {ensembles.length > 0 && (
        <label className="flex items-center gap-2">
          <span className="text-label uppercase text-secondary">Ensemble</span>
          <select
            className={field}
            value={filters.ensemble}
            onChange={event => onChange({ ...filters, ensemble: event.target.value })}
          >
            <option value="">All ensembles</option>
            {ensembles.map(ensemble => (
              <option key={ensemble} value={ensemble}>
                {ensemble}
              </option>
            ))}
          </select>
        </label>
      )}

      {onShowDecidedChange && (
        <Toggle
          checked={!!showDecided}
          onChange={onShowDecidedChange}
          label="Show denied and resolved"
          className="ml-auto"
        />
      )}
    </div>
  )
}

export default ConflictFilterBar
