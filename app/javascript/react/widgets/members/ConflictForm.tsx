import React, { useState } from 'react'
import ConflictDateTimeField from '../../components/ConflictDateTimeField'
import ValidationSummaryCard, { ValidationError } from '../../components/ValidationSummaryCard'

type FieldDefaults = {
  startDate?: string
  startTime?: string
  endDate?: string
  endTime?: string
  reason?: string
}

type ServerError = { field: 'start_date' | 'end_date' | 'reason'; message: string }

type ConflictFormProps = {
  formAction: string
  authenticityToken: string
  /** ISO `YYYY-MM-DD` — today; the native date pickers won't offer anything earlier. */
  minDate: string
  defaults: FieldDefaults
  errors: ServerError[]
}

const REASON_MAX = 500

// Advisory only — the real gate is Conflict#end_date_after_start_date on the
// server. Native inputs give ISO values, so a lexicographic compare of
// `${date}T${time}` is a correct chronological compare.
const endBeforeStart = (startDate: string, startTime: string, endDate: string, endTime: string): boolean => {
  if (!startDate || !startTime || !endDate || !endTime) return false
  return `${endDate}T${endTime}` < `${startDate}T${startTime}`
}

// A real <form method="post"> posting to the existing Rails create action —
// not a fetch/JSON flow. Fields are controlled; the two native inputs per
// boundary post as conflict[start_date_date] / conflict[start_date_time],
// which the controller combines back into a datetime.
const ConflictForm = ({ formAction, authenticityToken, minDate, defaults, errors }: ConflictFormProps) => {
  const [startDate, setStartDate] = useState(defaults.startDate ?? '')
  const [startTime, setStartTime] = useState(defaults.startTime ?? '')
  const [endDate, setEndDate] = useState(defaults.endDate ?? '')
  const [endTime, setEndTime] = useState(defaults.endTime ?? '')
  const [reason, setReason] = useState(defaults.reason ?? '')

  const serverErrorFor = (field: ServerError['field']) => errors.find((e) => e.field === field)?.message

  const clientEndError = endBeforeStart(startDate, startTime, endDate, endTime)
    ? 'End date and time must be on or after the start.'
    : undefined

  const startError = serverErrorFor('start_date')
  const endError = serverErrorFor('end_date') ?? clientEndError
  const reasonError = serverErrorFor('reason')

  const summaryErrors: ValidationError[] = [
    startError && { fieldId: 'conflict-start-date', message: startError },
    endError && { fieldId: 'conflict-end-date', message: endError },
    reasonError && { fieldId: 'conflict-reason', message: reasonError },
  ].filter((e): e is ValidationError => Boolean(e))

  const hadErrors = errors.length > 0

  return (
    <form method="post" action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="authenticity_token" value={authenticityToken} />

      <ValidationSummaryCard errors={summaryErrors} />

      <div className="card flex flex-col gap-4">
        <ConflictDateTimeField
          label="Starts"
          namePrefix="conflict[start_date]"
          id="conflict-start-date"
          dateValue={startDate}
          timeValue={startTime}
          onDateChange={setStartDate}
          onTimeChange={setStartTime}
          minDate={minDate}
          error={startError}
        />
        <ConflictDateTimeField
          label="Ends"
          namePrefix="conflict[end_date]"
          id="conflict-end-date"
          dateValue={endDate}
          timeValue={endTime}
          onDateChange={setEndDate}
          onTimeChange={setEndTime}
          minDate={startDate || minDate}
          error={endError}
        />

        <div className="flex flex-col gap-2 border-t border-border-default pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="conflict-reason" className="text-body-sm font-semibold text-primary">
              What&apos;s going on
            </label>
            <span className="font-mono text-caption text-secondary">{reason.length}</span>
          </div>
          <textarea
            id="conflict-reason"
            name="conflict[reason]"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX))}
            placeholder="Work, travel, school, family. A sentence is plenty."
            className={`min-h-[96px] rounded-sm border bg-surface p-3 text-body text-primary ${
              reasonError ? 'border-danger-fg' : 'border-border-strong focus:border-[color:rgb(var(--focus-ring))]'
            }`}
          />
          <span className="text-caption text-secondary">
            Coordinators and directors read this to decide on your conflict.
          </span>
          {reasonError && <span className="text-caption text-danger-fg">{reasonError}</span>}
        </div>
      </div>

      <div className="card flex gap-3 border-l-[3px] border-l-warning-fg">
        <div className="flex flex-col gap-1">
          <span className="text-body-sm font-semibold text-primary">Sending this isn&apos;t approval</span>
          <span className="text-caption text-secondary">
            A coordinator has to review it. If it&apos;s urgent, contact your coordinator, too.
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button type="submit" className="btn-primary btn-lg">
          Submit conflict
        </button>
        {hadErrors && (
          <span className="text-center text-caption text-secondary">Nothing you typed was lost.</span>
        )}
      </div>
    </form>
  )
}

export default ConflictForm
