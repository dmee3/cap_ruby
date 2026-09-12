import React, { useState } from 'react'
import ConflictDateTimeField from '../../components/ConflictDateTimeField'
import ValidationSummaryCard, { ValidationError } from '../../components/ValidationSummaryCard'

type FieldDefaults = {
  startDate?: string
  startTime?: string
  endDate?: string
  endTime?: string
  reason?: string
  userId?: string
  statusId?: string
}

type ServerError = { field: 'start_date' | 'end_date' | 'reason'; message: string }

export type MemberOption = { id: number; name: string }
export type StatusOption = { id: number; name: string }

type ConflictFormProps = {
  formAction: string
  authenticityToken: string
  /**
   * ISO `YYYY-MM-DD` for the member form, where a conflict must be in the
   * future. Coordinators and admins pass undefined: they file conflicts on
   * someone's behalf after the fact, and the server already skips the
   * future-date validation for them.
   */
  minDate?: string
  defaults: FieldDefaults
  errors: ServerError[]
  /** Triage-only: pick who the conflict is for. Absent on the member form. */
  members?: MemberOption[]
  /** Triage-only: set the status directly. Absent on the member form. */
  statuses?: StatusOption[]
  /** PATCH needs a method override on a plain form post. */
  method?: 'post' | 'patch'
  submitLabel?: string
  cancelHref?: string
  /**
   * Copy written to the member ("your conflict", "sending this isn't
   * approval"). Off for coordinators and admins, who are filing on someone
   * else's behalf and don't need to be told how review works.
   */
  memberVoice?: boolean
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
const ConflictForm = ({
  formAction,
  authenticityToken,
  minDate,
  defaults,
  errors,
  members,
  statuses,
  method = 'post',
  submitLabel = 'Submit conflict',
  cancelHref,
  memberVoice = true,
}: ConflictFormProps) => {
  const [startDate, setStartDate] = useState(defaults.startDate ?? '')
  const [startTime, setStartTime] = useState(defaults.startTime ?? '')
  const [endDate, setEndDate] = useState(defaults.endDate ?? '')
  const [endTime, setEndTime] = useState(defaults.endTime ?? '')
  const [reason, setReason] = useState(defaults.reason ?? '')
  const [userId, setUserId] = useState(defaults.userId ?? '')
  const [statusId, setStatusId] = useState(defaults.statusId ?? '')

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

  return (
    <form method="post" action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="authenticity_token" value={authenticityToken} />
      {method === 'patch' && <input type="hidden" name="_method" value="patch" />}

      <ValidationSummaryCard errors={summaryErrors} />

      <div className="card flex flex-col gap-4">
        {members && (
          <div className="flex flex-col gap-2">
            <label htmlFor="conflict-user" className="text-body-sm font-semibold text-primary">
              Member
            </label>
            <select
              id="conflict-user"
              name="conflict[user_id]"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="h-11 rounded-sm border border-border-strong bg-surface px-3 text-body text-primary"
            >
              <option value="">Pick a member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {statuses && (
          <fieldset className="flex flex-col gap-2 border-0 p-0">
            <legend className="mb-1 text-body-sm font-semibold text-primary">Status</legend>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <label
                  key={status.id}
                  className="inline-flex items-center gap-2 rounded-sm border border-border-strong px-3 py-2 text-body-sm text-primary"
                >
                  <input
                    type="radio"
                    name="conflict[status_id]"
                    value={status.id}
                    checked={String(statusId) === String(status.id)}
                    onChange={(e) => setStatusId(e.target.value)}
                  />
                  {status.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <ConflictDateTimeField
          label="Starts"
          dateName="conflict[start_date_date]"
          timeName="conflict[start_date_time]"
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
          dateName="conflict[end_date_date]"
          timeName="conflict[end_date_time]"
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
          {memberVoice && (
            <span className="text-caption text-secondary">
              Coordinators and directors read this to decide on your conflict.
            </span>
          )}
          {reasonError && <span className="text-caption text-danger-fg">{reasonError}</span>}
        </div>
      </div>

      {memberVoice && (
        <div className="card flex gap-3 border-l-[3px] border-l-warning-fg">
          <div className="flex flex-col gap-1">
            <span className="text-body-sm font-semibold text-primary">Sending this isn&apos;t approval</span>
            <span className="text-caption text-secondary">
              A coordinator has to review it. If it&apos;s urgent, contact your coordinator, too.
            </span>
          </div>
        </div>
      )}

      {members && (
        <div className="card flex gap-3 border-l-[3px] border-l-accent-primary">
          <span className="text-caption text-secondary">
            A past date is fine here if you want to record a previous conflict.
          </span>
        </div>
      )}

      {/* One row at every width, filling the form. `btn-base` is `w-full
          sm:w-auto`, which would stack these on a phone, so the widths are set
          here instead: submit takes the larger share, cancel the smaller. */}
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary btn-lg !w-auto flex-[2]">
          {submitLabel}
        </button>
        {cancelHref && (
          <a href={cancelHref} className="btn-gray btn-lg !w-auto flex-1 no-underline">
            Cancel
          </a>
        )}
      </div>
    </form>
  )
}

export default ConflictForm
