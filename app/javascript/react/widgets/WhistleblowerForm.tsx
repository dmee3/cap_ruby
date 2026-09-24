import React, { useState } from 'react'
import RecipientPicker, { Recipient } from '../components/RecipientPicker'
import ValidationSummaryCard, { ValidationError } from '../components/ValidationSummaryCard'

export type WhistleblowerFormData = {
  recipients: Recipient[]
  minimum: number
}

type WhistleblowerFormProps = {
  data: WhistleblowerFormData
  csrfToken: string
}

const REPORT_ID = 'whistleblower-report'
const RECIPIENTS_ID = 'whistleblower-recipients'

const WhistleblowerForm = ({ data, csrfToken }: WhistleblowerFormProps) => {
  const [report, setReport] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [submitted, setSubmitted] = useState(false)

  const { recipients, minimum } = data

  const reportMissing = report.trim().length === 0
  const tooFewPicked = selected.length < minimum

  const errors: ValidationError[] = []
  if (reportMissing) {
    errors.push({ fieldId: REPORT_ID, message: 'Tell us what happened: the report is empty' })
  }
  if (tooFewPicked) {
    const remaining = minimum - selected.length
    errors.push({
      fieldId: RECIPIENTS_ID,
      message:
        remaining === 1
          ? `Pick one more person: ${selected.length} of ${minimum} so far`
          : `Pick ${remaining} more people: ${selected.length} of ${minimum} so far`
    })
  }

  // No one to send to means no form to fill in. Rendering the fields anyway
  // would be asking someone to write out something difficult and then telling
  // them it can't go anywhere.
  if (recipients.length === 0) {
    return (
      <div className="rounded-md border border-border-default bg-surface p-5">
        <h2 className="mt-0 mb-1 text-body font-bold">Reports can't be sent yet</h2>
        <p className="m-0 text-body-sm text-secondary">
          Nobody is set up to receive them. An admin needs to choose who reads these
          before the form can go anywhere. Ask an admin to set that up, or speak to
          someone you trust in the meantime.
        </p>
      </div>
    )
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setSubmitted(true)
    if (errors.length > 0) event.preventDefault()
  }

  const showErrors = submitted && errors.length > 0

  return (
    <form action="/whistleblowers" method="post" onSubmit={handleSubmit} noValidate>
      <input type="hidden" name="authenticity_token" value={csrfToken} />

      {/* Announced on appearance: the summary is above the fields, so someone
          who submitted from the button at the bottom would otherwise get no
          signal that anything happened. */}
      <div role="alert" aria-live="assertive">
        {showErrors && (
          <ValidationSummaryCard
            errors={errors}
            lead="We didn't send this yet."
            className="mb-5"
          />
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div className="rounded-md border border-border-default bg-surface p-5">
          <label htmlFor="whistleblower-email" className="text-body-sm font-semibold text-primary">
            Your email <span className="font-normal text-secondary">(optional)</span>
          </label>
          <p className="mt-1 mb-2 text-body-sm text-secondary">
            Anonymous is fine, with one trade-off. If you leave this blank we have no way
            to ask you a follow-up question, and that can be the difference between a report
            we can act on and one we can't. If you include your email, only the people you
            pick below can see it.
          </p>
          <input
            id="whistleblower-email"
            type="email"
            name="email"
            autoComplete="email"
            className="input-text"
          />
        </div>

        <div className="rounded-md border border-border-default bg-surface p-5">
          <label htmlFor={REPORT_ID} className="text-body-sm font-semibold text-primary">
            What happened
          </label>
          <p className="mt-1 mb-2 text-body-sm text-secondary">
            Tell us as much as you can. Specific details make it easier for the admin staff
            to investigate: dates, places, and anyone else who was there or knows about it.
          </p>
          <textarea
            id={REPORT_ID}
            name="report"
            rows={8}
            value={report}
            onChange={event => setReport(event.target.value)}
            aria-invalid={showErrors && reportMissing}
            aria-describedby={showErrors && reportMissing ? `${REPORT_ID}-error` : undefined}
            className="input-text"
          />
          {showErrors && reportMissing && (
            <p id={`${REPORT_ID}-error`} className="mt-2 text-body-sm font-medium text-danger-fg">
              This is the part we can't send without.
            </p>
          )}
        </div>

        <div className="rounded-md border border-border-default bg-surface p-5" id={RECIPIENTS_ID}>
          <h2 className="mt-0 mb-1 text-body font-bold">Who should receive it</h2>
          <p className="m-0 mb-3 text-body-sm text-secondary" id="recipients-rule">
            {minimum >= 3
              ? 'Pick at least three people.'
              : `This goes to ${minimum === 1 ? 'the one person' : `all ${minimum} people`} set up to receive reports.`}
          </p>
          <RecipientPicker
            recipients={recipients}
            selected={selected}
            minimum={minimum}
            onChange={setSelected}
            invalid={showErrors && tooFewPicked}
            describedBy="recipients-rule"
          />
        </div>

        <div className="flex flex-col items-start gap-2">
          <button type="submit" className="btn-primary btn-lg">
            Send report
          </button>
        </div>
      </div>
    </form>
  )
}

export default WhistleblowerForm
