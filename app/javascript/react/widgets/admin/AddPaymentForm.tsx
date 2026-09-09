import React, { useMemo, useRef, useState } from 'react'
import MoneyField from '../../components/MoneyField'
import PaymentProjectionPanel from '../../components/PaymentProjectionPanel'
import ValidationSummaryCard, { ValidationError } from '../../components/ValidationSummaryCard'
import Button from '../../components/Button'

export type AddPaymentMember = {
  id: number
  name: string
  paid_before_cents: number
  season_total_cents: number
  expected_cents: number
  /** ISO dates of the next unpaid installments, oldest first. */
  applies_to: string[]
}

export type AddPaymentType = { id: number; name: string }

type AddPaymentFormProps = {
  members: AddPaymentMember[]
  paymentTypes: AddPaymentType[]
  preselectedUserId?: number
  /** Rails CSRF token for the real form POST. */
  csrfToken: string
  /** Server-side validation errors from a failed submit (form repopulates). */
  serverErrors: string[]
  /** Sticky field values after a failed submit. */
  initial: {
    userId?: number
    paymentTypeId?: number
    amountCents?: number | null
    datePaid?: string
    notes?: string
  }
}

const fieldClass =
  'h-11 w-full rounded-sm border border-border-strong bg-surface px-3 text-body text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1'

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })

const AddPaymentForm = ({
  members,
  paymentTypes,
  preselectedUserId,
  csrfToken,
  serverErrors,
  initial,
}: AddPaymentFormProps) => {
  const today = new Date().toISOString().slice(0, 10)
  const formRef = useRef<HTMLFormElement>(null)

  const [userId, setUserId] = useState<string>(
    String(initial.userId ?? preselectedUserId ?? ''),
  )
  const [paymentTypeId, setPaymentTypeId] = useState<string>(
    String(initial.paymentTypeId ?? paymentTypes.find((t) => t.name === 'Venmo')?.id ?? ''),
  )
  const [amountCents, setAmountCents] = useState<number | null>(initial.amountCents ?? null)
  const [datePaid, setDatePaid] = useState(initial.datePaid ?? today)
  const [notes, setNotes] = useState(initial.notes ?? '')
  const [clientErrors, setClientErrors] = useState<ValidationError[]>([])
  const [submitting, setSubmitting] = useState(false)

  const member = useMemo(
    () => members.find((m) => String(m.id) === userId) ?? null,
    [members, userId],
  )

  const errors: ValidationError[] = clientErrors.length
    ? clientErrors
    : serverErrors.map((message, i) => ({ fieldId: `server-${i}`, message }))

  const validate = (): ValidationError[] => {
    const next: ValidationError[] = []
    if (!userId) next.push({ fieldId: 'payment_user_id', message: 'Pick the member this payment is for.' })
    if (amountCents == null || amountCents <= 0)
      next.push({ fieldId: 'payment_amount', message: 'Enter an amount greater than $0.' })
    if (!paymentTypeId)
      next.push({ fieldId: 'payment_payment_type_id', message: 'Choose how the payment was made.' })
    if (!datePaid) next.push({ fieldId: 'payment_date_paid', message: 'Set the date the payment was made.' })
    return next
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const found = validate()
    if (found.length > 0) {
      e.preventDefault()
      setClientErrors(found)
      return
    }
    setSubmitting(true) // real POST proceeds; button locks against a double-submit
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-4">
        {errors.length > 0 && <ValidationSummaryCard errors={errors} />}

        <form
          ref={formRef}
          action="/admin/payments"
          method="post"
          onSubmit={onSubmit}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="authenticity_token" value={csrfToken} />

          <label className="flex flex-col gap-1.5">
            <span className="text-body-sm font-semibold text-primary">Member</span>
            <select
              id="payment_user_id"
              name="payment[user_id]"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Select a member…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <MoneyField
            id="payment_amount"
            name="payment[amount]"
            label="Amount"
            valueCents={amountCents}
            onChangeCents={setAmountCents}
            helper={amountCents != null && amountCents > 0 ? 'Looks good.' : undefined}
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-body-sm font-semibold text-primary">Payment type</span>
            <select
              id="payment_payment_type_id"
              name="payment[payment_type_id]"
              value={paymentTypeId}
              onChange={(e) => setPaymentTypeId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Select a type…</option>
              {paymentTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-body-sm font-semibold text-primary">Date paid</span>
            <input
              type="date"
              id="payment_date_paid"
              name="payment[date_paid]"
              value={datePaid}
              max={today}
              onChange={(e) => setDatePaid(e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-body-sm font-semibold text-primary">Notes</span>
            <textarea
              id="payment_notes"
              name="payment[notes]"
              rows={3}
              value={notes}
              maxLength={255}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-sm border border-border-strong bg-surface px-3 py-2 text-body text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            />
            <span className="self-end text-caption text-secondary">{notes.length}/255</span>
          </label>

          <div className="rounded-sm bg-sunken px-3 py-2 text-body-sm text-secondary">
            <span className="font-semibold text-primary">Applies to:</span>{' '}
            {member && member.applies_to.length > 0
              ? `oldest unpaid due date first — ${member.applies_to.map(fmtDate).join(', then ')}`
              : 'nothing outstanding — this will count as paid ahead.'}
            <span className="mt-1 block text-caption">
              Not editable: payments credit against the schedule in order.
            </span>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="lg" loading={submitting} fullWidthBelow={false}>
              Record payment
            </Button>
          </div>
        </form>
      </div>

      <PaymentProjectionPanel
        member={
          member && {
            id: member.id,
            name: member.name,
            paidBeforeCents: member.paid_before_cents,
            seasonTotalCents: member.season_total_cents,
            expectedCents: member.expected_cents,
          }
        }
        thisPaymentCents={amountCents ?? 0}
      />
    </div>
  )
}

export default AddPaymentForm
