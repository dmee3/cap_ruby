import React from 'react'

type ConflictDateTimeFieldProps = {
  label: 'Starts' | 'Ends'
  /** Base name for both inputs — rendered as `${name}` (date) and a matching time input. */
  name: string
  /** Anchor target used by ValidationSummaryCard's jump links. */
  id: string
  defaultDateValue?: string
  defaultTimeValue?: string
  /** e.g. "Start date must be in the future. That was 2 days ago." */
  error?: string
  className?: string
}

// Purely presentational: renders two adjacent inputs (date + time). Actual
// date/time picking is bound externally (flatpickr, by class name, same as
// today) — this component just owns the layout + error-state contract.
const ConflictDateTimeField = ({
  label,
  name,
  id,
  defaultDateValue,
  defaultTimeValue,
  error,
  className = '',
}: ConflictDateTimeFieldProps) => {
  const borderClass = error
    ? 'border-danger-fg'
    : 'border-border-strong focus-within:border-[color:rgb(var(--focus-ring))]'

  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      <span className="text-body-sm font-semibold text-primary">{label}</span>
      <div className="grid grid-cols-[1.35fr_1fr] gap-2">
        <input
          id={id}
          name={`${name}_date`}
          type="text"
          className={`conflict-datetime-date h-12 rounded-sm border bg-surface px-3 font-mono text-body-sm text-primary ${borderClass}`}
          defaultValue={defaultDateValue}
          placeholder="mm/dd/yy"
        />
        <input
          name={`${name}_time`}
          type="text"
          className={`conflict-datetime-time h-12 rounded-sm border bg-surface px-3 font-mono text-body-sm text-primary ${borderClass}`}
          defaultValue={defaultTimeValue}
          placeholder="--:-- --"
        />
      </div>
      {error && <span className="text-caption text-danger-fg">{error}</span>}
    </div>
  )
}

export default ConflictDateTimeField
