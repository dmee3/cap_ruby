import React from 'react'

export type ConflictStatusScope = 'Pending' | 'Approved' | 'Denied' | 'Resolved' | 'All'
export type ConflictWhenScope = 'upcoming' | 'past' | 'all'

export type ConflictFilters = {
  status: ConflictStatusScope
  when: ConflictWhenScope
  ensemble: string
  start: string
  end: string
}

export const DEFAULT_CONFLICT_FILTERS: ConflictFilters = {
  status: 'Pending',
  when: 'upcoming',
  ensemble: '',
  start: '',
  end: '',
}

export const isDirty = (f: ConflictFilters) =>
  f.status !== 'Pending' || f.when !== 'upcoming' || f.ensemble !== '' || f.start !== '' || f.end !== ''

const STATUS_SCOPES: ConflictStatusScope[] = ['Pending', 'Approved', 'Denied', 'Resolved', 'All']

const WHEN_LABEL: Record<ConflictWhenScope, string> = {
  upcoming: 'Upcoming',
  past: 'Past',
  all: 'All season',
}

type ConflictFilterBarProps = {
  filters: ConflictFilters
  onChange: (next: ConflictFilters) => void
  counts?: Partial<Record<ConflictStatusScope, number>>
  ensembles?: string[]
  className?: string
}

const field =
  'h-[38px] rounded-sm border border-border-strong bg-surface px-2.5 text-body-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1'

// §4.21 reused with the conflict control set.
//
// The status scope is a native <select>, not the canvas's row of clickable
// pills: that choice was made in Flow 4 because a native control is keyboard-
// and screen-reader-accessible for free, and reverting it here would trade
// that away for presentation.
const ConflictFilterBar = ({
  filters,
  onChange,
  counts = {},
  ensembles = [],
  className = '',
}: ConflictFilterBarProps) => {
  const set = <K extends keyof ConflictFilters>(key: K, value: ConflictFilters[K]) =>
    onChange({ ...filters, [key]: value })

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-md border border-border-default bg-surface px-4 py-3 ${className}`.trim()}
    >
      <label className="flex items-center gap-2">
        <span className="text-label uppercase text-secondary">Status</span>
        <select
          className={field}
          value={filters.status}
          onChange={event => set('status', event.target.value as ConflictStatusScope)}
        >
          {STATUS_SCOPES.map(scope => (
            <option key={scope} value={scope}>
              {typeof counts[scope] === 'number' ? `${scope} · ${counts[scope]}` : scope}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span className="text-label uppercase text-secondary">When</span>
        <select
          className={field}
          value={filters.when}
          onChange={event => set('when', event.target.value as ConflictWhenScope)}
        >
          {(Object.keys(WHEN_LABEL) as ConflictWhenScope[]).map(scope => (
            <option key={scope} value={scope}>
              {WHEN_LABEL[scope]}
            </option>
          ))}
        </select>
      </label>

      {ensembles.length > 0 && (
        <label className="flex items-center gap-2">
          <span className="text-label uppercase text-secondary">Ensemble</span>
          <select
            className={field}
            value={filters.ensemble}
            onChange={event => set('ensemble', event.target.value)}
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

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="text-label uppercase text-secondary">From</span>
          <input
            type="date"
            className={`${field} font-mono`}
            value={filters.start}
            onChange={event => set('start', event.target.value)}
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-label uppercase text-secondary">To</span>
          <input
            type="date"
            className={`${field} font-mono`}
            value={filters.end}
            onChange={event => set('end', event.target.value)}
          />
        </label>
      </div>

      {isDirty(filters) && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_CONFLICT_FILTERS)}
          className="ml-auto text-body-sm font-semibold text-accent-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

export default ConflictFilterBar
