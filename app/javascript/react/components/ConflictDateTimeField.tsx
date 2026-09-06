import React from 'react'

type ConflictDateTimeFieldProps = {
  label: 'Starts' | 'Ends'
  /** Full `name` for the date input, e.g. `conflict[start_date_date]`. */
  dateName: string
  /** Full `name` for the time input, e.g. `conflict[start_date_time]`. */
  timeName: string
  /** Anchor target used by ValidationSummaryCard's jump links. */
  id: string
  /** ISO `YYYY-MM-DD`, for repopulation after a failed submit. */
  dateValue: string
  /** 24h `HH:MM`, for repopulation after a failed submit. */
  timeValue: string
  onDateChange: (value: string) => void
  onTimeChange: (value: string) => void
  /** Earliest selectable date (ISO `YYYY-MM-DD`) — the native picker enforces it. */
  minDate?: string
  /** e.g. "Start date must be in the future. That was 2 days ago." */
  error?: string
  className?: string
}

// Native date + time inputs — the OS picker on mobile, the browser's own
// calendar on desktop. No library, accessible for free.
const ConflictDateTimeField = ({
  label,
  dateName,
  timeName,
  id,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  minDate,
  error,
  className = '',
}: ConflictDateTimeFieldProps) => {
  const borderClass = error
    ? 'border-danger-fg'
    : 'border-border-strong focus-within:border-[color:rgb(var(--focus-ring))]'
  const inputClass = `h-12 rounded-sm border bg-surface px-3 font-mono text-body-sm text-primary ${borderClass}`

  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      <span className="text-body-sm font-semibold text-primary">{label}</span>
      <div className="grid grid-cols-[1.35fr_1fr] gap-2">
        <input
          id={id}
          name={dateName}
          type="date"
          min={minDate}
          value={dateValue}
          onChange={(e) => onDateChange(e.target.value)}
          className={inputClass}
        />
        <input
          name={timeName}
          type="time"
          value={timeValue}
          onChange={(e) => onTimeChange(e.target.value)}
          className={inputClass}
        />
      </div>
      {error && <span className="text-caption text-danger-fg">{error}</span>}
    </div>
  )
}

export default ConflictDateTimeField
