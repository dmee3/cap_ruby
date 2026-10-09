import React from 'react'
import Field, { TextInput } from './Field'

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
}: ConflictDateTimeFieldProps) => (
  <Field label={label} id={id} error={error} className={className}>
    <div className="grid grid-cols-[1.35fr_1fr] gap-2">
      <TextInput
        name={dateName}
        type="date"
        mono
        min={minDate}
        value={dateValue}
        onChange={(e) => onDateChange(e.target.value)}
      />
      <TextInput
        id={`${id}-time`}
        name={timeName}
        type="time"
        mono
        aria-label={`${label}, time`}
        value={timeValue}
        onChange={(e) => onTimeChange(e.target.value)}
      />
    </div>
  </Field>
)

export default ConflictDateTimeField
