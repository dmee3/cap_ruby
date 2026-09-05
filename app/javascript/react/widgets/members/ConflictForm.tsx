import React, { useMemo, useState } from 'react'
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
  defaults: FieldDefaults
  errors: ServerError[]
}

const REASON_MAX = 500

// Advisory only — the real gate is Conflict#end_date_after_start_date on the
// server. This just gives faster feedback and merges into the same error
// slot a server error would occupy.
const clientSideEndBeforeStart = (defaults: FieldDefaults): string | null => {
  if (!defaults.startDate || !defaults.startTime || !defaults.endDate || !defaults.endTime) return null
  const start = new Date(`${defaults.startDate} ${defaults.startTime}`)
  const end = new Date(`${defaults.endDate} ${defaults.endTime}`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  return end < start ? 'must be on or after the start date' : null
}

// A real <form method="post"> posting to the existing Rails create action —
// not a fetch/JSON flow. There's no Stripe-style reason to need something
// from the server before rendering, so a classic form preserves create's
// existing redirect/re-render contract and keeps server-rendered response
// assertions working unmodified.
const ConflictForm = ({ formAction, authenticityToken, defaults, errors }: ConflictFormProps) => {
  const [reason, setReason] = useState(defaults.reason ?? '')
  const [fields, setFields] = useState(defaults)

  const clientEndError = useMemo(() => clientSideEndBeforeStart(fields), [fields])

  const serverErrorFor = (field: ServerError['field']) => errors.find((e) => e.field === field)?.message

  const startError = serverErrorFor('start_date')
  const endError = serverErrorFor('end_date') ?? (clientEndError ? `End date ${clientEndError}.` : undefined)
  const reasonError = serverErrorFor('reason')

  const summaryErrors: ValidationError[] = [
    startError && { fieldId: 'conflict-start-date', message: startError },
    endError && { fieldId: 'conflict-end-date', message: endError },
    reasonError && { fieldId: 'conflict-reason', message: reasonError },
  ].filter((e): e is ValidationError => Boolean(e))

  const hadErrors = errors.length > 0

  // ConflictDateTimeField's inputs are uncontrolled (flatpickr binds to them
  // directly by class name). Delegated onChange keeps this component's
  // `fields` state — used only for the advisory end-before-start check — in
  // sync without fighting flatpickr for control of the inputs.
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'conflict[start_date]_date') setFields((f) => ({ ...f, startDate: value }))
    else if (name === 'conflict[start_date]_time') setFields((f) => ({ ...f, startTime: value }))
    else if (name === 'conflict[end_date]_date') setFields((f) => ({ ...f, endDate: value }))
    else if (name === 'conflict[end_date]_time') setFields((f) => ({ ...f, endTime: value }))
  }

  return (
    <form method="post" action={formAction} className="flex flex-col gap-4" onChange={handleFieldChange}>
      <input type="hidden" name="authenticity_token" value={authenticityToken} />

      <ValidationSummaryCard errors={summaryErrors} />

      <div className="card flex flex-col gap-4">
        <ConflictDateTimeField
          label="Starts"
          name="conflict[start_date]"
          id="conflict-start-date"
          defaultDateValue={fields.startDate}
          defaultTimeValue={fields.startTime}
          error={startError}
        />
        <ConflictDateTimeField
          label="Ends"
          name="conflict[end_date]"
          id="conflict-end-date"
          defaultDateValue={fields.endDate}
          defaultTimeValue={fields.endTime}
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
