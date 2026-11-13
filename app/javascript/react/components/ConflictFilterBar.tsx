import React from 'react'
import { Select } from './Field'
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
  /** Queue only — the calendar shows every status and hides decided ones with
   * the toggle instead. */
  status?: string
  statusOptions?: string[]
  onStatusChange?: (value: string) => void
  /** Calendar only. */
  showDecided?: boolean
  onShowDecidedChange?: (value: boolean) => void
  className?: string
}

// The filter line above both conflict views. The queue narrows by status; the
// calendar shows everything and only hides decided conflicts, via the toggle.
const ConflictFilterBar = ({
  filters,
  onChange,
  ensembles = [],
  status,
  statusOptions = [],
  onStatusChange,
  showDecided,
  onShowDecidedChange,
  className = '',
}: ConflictFilterBarProps) => {
  const showStatus = !!onStatusChange && statusOptions.length > 0
  if (ensembles.length === 0 && !onShowDecidedChange && !showStatus) return null

  return (
    <div
      className={`flex flex-col items-stretch gap-3 rounded-md border border-border-default bg-surface px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 ${className}`.trim()}
    >
      {ensembles.length > 0 && (
        <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-label uppercase text-secondary">Ensemble</span>
          <Select
            controlSize="sm"
            className="w-full sm:w-auto"
            value={filters.ensemble}
            onChange={event => onChange({ ...filters, ensemble: event.target.value })}
          >
            <option value="">All ensembles</option>
            {ensembles.map(ensemble => (
              <option key={ensemble} value={ensemble}>
                {ensemble}
              </option>
            ))}
          </Select>
        </label>
      )}

      {showStatus && (
        <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-label uppercase text-secondary">Status</span>
          <Select
            controlSize="sm"
            className="w-full sm:w-auto"
            value={status}
            onChange={event => onStatusChange(event.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </label>
      )}

      {onShowDecidedChange && (
        <Toggle
          checked={!!showDecided}
          onChange={onShowDecidedChange}
          label="Show denied and resolved"
          className="sm:ml-auto"
        />
      )}
    </div>
  )
}

export default ConflictFilterBar
