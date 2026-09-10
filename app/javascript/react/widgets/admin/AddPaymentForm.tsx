import React, { useMemo, useState } from 'react'
import MoneyField from '../../components/MoneyField'
import PaymentProjectionPanel from '../../components/PaymentProjectionPanel'
import MemberSchedulePanel, { ScheduleInstallment } from '../../components/MemberSchedulePanel'
import MemberCombobox from '../../components/MemberCombobox'
import ValidationSummaryCard, { ValidationError } from '../../components/ValidationSummaryCard'
import Button from '../../components/Button'

export type AddPaymentMember = {
  id: number
  name: string
  section: string
  paid_before_cents: number
  season_total_cents: number
  expected_cents: number
  /** ISO dates of the next unpaid installments, oldest first. */
  applies_to: string[]
  schedule_id: number | null
  installments: ScheduleInstallment[]
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

const fieldBase =
  'h-11 w-full rounded-sm bg-surface px-3 text-body text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1'
const fieldOk = `${fieldBase} border border-border-strong`
const fieldErr = `${fieldBase} border-2 border-danger-fg px-[11px]`

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })

const Hint = ({ children }: { children: React.ReactNode }) => (
  <span className="text-caption text-secondary">{children}</span>
)

const FieldError = ({ children }: { children: React.ReactNode }) => (
  <span className="text-caption font-semibold text-danger-fg">{children}</span>
)

const AddPaymentForm = ({
  members,
  paymentTypes,
  preselectedUserId,
  csrfToken,
  serverErrors,
  initial,
}: AddPaymentFormProps) => {
  const today = new Date().toISOString().slice(0, 10)

  const [userId, setUserId] = useState<string>(String(initial.userId ?? preselectedUserId ?? ''))
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

  const errorFor = (fieldId: string) => clientErrors.find((e) => e.fieldId === fieldId)?.message

  const validate = (): ValidationError[] => {
    const next: ValidationError[] = []
    if (!userId) {
      next.push({ fieldId: 'payment_user_id', message: 'Pick the member this payment is from.' })
    }
    if (amountCents == null || amountCents <= 0) {
      next.push({ fieldId: 'payment_amount', message: 'Amount has to be more than $0.' })
    }
    if (!paymentTypeId) {
      next.push({ fieldId: 'payment_payment_type_id', message: 'Choose how the payment was made.' })
    }
    if (!datePaid) {
      next.push({ fieldId: 'payment_date_paid', message: 'Set the date the payment was made.' })
    }
    return next
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const found = validate()
    if (found.length > 0) {
      e.preventDefault()
      setClientErrors(found)
      return
    }
    setSubmitting(true) // real POST proceeds; the button locks against a double-submit
  }

  return (
    <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-4">
        {errors.length > 0 && (
          <ValidationSummaryCard errors={errors} lead="This payment wasn't saved." />
        )}

        <form
          action="/admin/payments"
          method="post"
          onSubmit={onSubmit}
          className="flex flex-col gap-5 rounded-md border border-border-default bg-surface p-6"
        >
          <input type="hidden" name="authenticity_token" value={csrfToken} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="payment_user_id" className="text-body-sm font-semibold text-primary">
              Member
            </label>
            <MemberCombobox
              id="payment_user_id"
              name="payment[user_id]"
              members={members.map((m) => ({ id: m.id, name: m.name, section: m.section }))}
              value={userId}
              onChange={setUserId}
              error={errorFor('payment_user_id')}
            />
            {errorFor('payment_user_id') ? (
              <FieldError>{errorFor('payment_user_id')}</FieldError>
            ) : (
              <Hint>
                Current-season members only. Start typing to search {members.length} names.
              </Hint>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <MoneyField
                id="payment_amount"
                name="payment[amount]"
                label="Amount"
                valueCents={amountCents}
                onChangeCents={setAmountCents}
                error={errorFor('payment_amount')}
              />
              {!errorFor('payment_amount') && (
                <Hint>Full amount received. No processing fee on manual payments.</Hint>
              )}
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-body-sm font-semibold text-primary">Payment type</span>
              <select
                id="payment_payment_type_id"
                name="payment[payment_type_id]"
                value={paymentTypeId}
                onChange={(e) => setPaymentTypeId(e.target.value)}
                className={errorFor('payment_payment_type_id') ? fieldErr : fieldOk}
              >
                <option value="">Select a type…</option>
                {paymentTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {errorFor('payment_payment_type_id') ? (
                <FieldError>{errorFor('payment_payment_type_id')}</FieldError>
              ) : (
                <Hint>{paymentTypes.map((t) => t.name).join(' · ')}</Hint>
              )}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-body-sm font-semibold text-primary">Date paid</span>
              <input
                type="date"
                id="payment_date_paid"
                name="payment[date_paid]"
                value={datePaid}
                max={today}
                onChange={(e) => setDatePaid(e.target.value)}
                className={errorFor('payment_date_paid') ? fieldErr : fieldOk}
              />
              {errorFor('payment_date_paid') ? (
                <FieldError>{errorFor('payment_date_paid')}</FieldError>
              ) : (
                <Hint>Defaults to today. Back-date it if the cash sat in the box.</Hint>
              )}
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-body-sm font-semibold text-primary">Applies to</span>
              <div className="flex min-h-11 items-center rounded-sm border border-dashed border-border-strong bg-sunken px-3 text-body-sm text-secondary">
                {member
                  ? member.applies_to.length > 0
                    ? `Oldest unpaid due date first: ${member.applies_to.map(fmtDate).join(', then ')}`
                    : 'Nothing outstanding — this counts as paid ahead.'
                  : 'Pick a member to see their due dates'}
              </div>
              <Hint>Not editable: payments credit against the schedule in order.</Hint>
            </div>
          </div>

          <label className="flex flex-col gap-1.5 border-t border-border-default pt-5">
            <span className="flex items-baseline gap-2">
              <span className="text-body-sm font-semibold text-primary">Notes</span>
              <span className="text-caption text-secondary">Optional</span>
              <span className="ml-auto font-mono text-caption text-secondary">{notes.length}</span>
            </span>
            <textarea
              id="payment_notes"
              name="payment[notes]"
              value={notes}
              maxLength={255}
              placeholder="What should the member see about this payment?"
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20 w-full rounded-sm border border-border-strong bg-surface p-3 text-body text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            />
            <Hint>Members can see this on their payment history.</Hint>
          </label>

          <div className="flex items-center gap-3 border-t border-border-default pt-5">
            <Button type="submit" variant="primary" size="lg" loading={submitting} fullWidthBelow={false}>
              Record payment
            </Button>
            <a
              href="/admin/payments"
              className="flex h-11 items-center px-3 text-body font-medium text-secondary no-underline hover:text-primary"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>

      <div className="flex flex-col gap-5">
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

        {member && (
          <MemberSchedulePanel
            memberName={member.name.split(' ')[0]}
            scheduleId={member.schedule_id}
            installments={member.installments}
            pendingCents={amountCents ?? 0}
          />
        )}
      </div>
    </div>
  )
}

export default AddPaymentForm
