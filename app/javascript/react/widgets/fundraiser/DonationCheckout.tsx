import React, { useState } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import DateChip from '../../components/DateChip'
import { dollars } from '../../../utilities/money'
import Utilities from '../../../utilities/utilities'
import { Performer } from '../../components/PerformerCard'

type DonationCheckoutProps = {
  performer: Performer
  dates: number[]
  totalCents: number
  stripeKey: string
  datesPath: string
}

type PaymentFormProps = {
  totalCents: number
  donorName: string
  onDonorNameChange: (value: string) => void
  performerFirstName: string
  datesPath: string
  paymentIntentId: string | null
}

const PaymentForm = ({
  totalCents,
  donorName,
  onDonorNameChange,
  performerFirstName,
  datesPath,
  paymentIntentId,
}: PaymentFormProps) => {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // Guard BEFORE flipping `submitting`. The old form set it first and then
    // returned early, leaving the button stuck in its submitting state forever.
    if (!stripe || !elements) return

    setSubmitting(true)
    setError('')

    // The webhook reads the byline off the intent's metadata, and the name was
    // typed after the intent was created, so attach it now. A failure here
    // costs the byline, not the donation, so it doesn't block the charge.
    if (paymentIntentId) {
      try {
        await fetch(`/api/fundraiser/payment_intents/${paymentIntentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': Utilities.getAuthToken(),
          },
          body: JSON.stringify({ donor_name: donorName }),
        })
      } catch {
        // Ignored on purpose: see above.
      }
    }

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/fundraiser/thanks` },
    })

    // Reached only if the redirect didn't happen, i.e. something went wrong.
    setSubmitting(false)

    if (result.error) {
      setError(
        result.error.message ||
          'We were unable to process your payment. Check the card details and try again.',
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="donor-name" className="text-body font-semibold text-primary">
          Your name <span className="font-normal text-secondary">· optional</span>
        </label>
        <input
          id="donor-name"
          type="text"
          value={donorName}
          onChange={(e) => onDonorNameChange(e.target.value)}
          className="input-text h-[46px]"
          autoComplete="name"
        />
        <span className="text-caption text-secondary">
          This is how {performerFirstName} will see your gift. Leave it blank to stay anonymous.
        </span>
      </div>

      <div className="border-t border-border-default" />

      <div className="flex flex-col gap-3">
        <span className="text-body font-semibold text-primary">Card</span>
        <PaymentElement />
      </div>

      {error && (
        <div className="card card--danger flex flex-col gap-1.5">
          <span className="text-body font-bold text-danger-fg">Your card was declined</span>
          <p className="m-0 text-body-sm text-secondary">
            Nothing was charged and your dates are still here. Try another card, or check with your
            bank.
          </p>
          <p className="m-0 text-body-sm text-secondary">{error}</p>
        </div>
      )}

      <button
        type="submit"
        // The old form had `!stripe && !submitting`, which is false as soon as
        // Stripe loads, so the button was never actually disabled and a donor
        // could submit twice.
        disabled={!stripe || submitting}
        className="btn-primary btn-lg h-[52px] w-full"
      >
        {submitting ? (
          <span className="flex items-center gap-2.5">
            <span
              className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-ocean-lightest border-t-transparent motion-reduce:animate-none"
              aria-hidden="true"
            />
            Sending your {dollars(totalCents)}…
          </span>
        ) : (
          `Donate ${dollars(totalCents)}`
        )}
      </button>

      {submitting ? (
        <p className="m-0 text-center text-caption text-secondary">
          Hang on, don't close this page or press back.
        </p>
      ) : (
        <p className="m-0 text-caption text-secondary">
          We'll charge your card {dollars(totalCents)} today, once. That's the whole amount.
          Nothing is added on top and nothing repeats.
        </p>
      )}

      <a href={datesPath} className="link self-start text-body-sm">
        Change dates
      </a>
    </form>
  )
}

/**
 * Checkout. The performer, the chips and the total stay on screen while the
 * card form sits beside them on desktop and under them on mobile, so the page
 * never loses the thing the donor is paying for.
 */
const DonationCheckout = ({
  performer,
  dates,
  totalCents,
  stripeKey,
  datesPath,
}: DonationCheckoutProps) => {
  const [donorName, setDonorName] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [stripePromise] = useState<Promise<Stripe | null>>(() => loadStripe(stripeKey))
  const [error, setError] = useState('')
  const [claimedSince, setClaimedSince] = useState<number[]>([])

  const firstName = performer.name.split(' ')[0]

  // The intent is created on mount so the Payment Element can render straight
  // away. The server derives the amount from the dates, so the figure below is
  // only ever a display of what it computed.
  React.useEffect(() => {
    let cancelled = false

    const createIntent = async () => {
      const response = await fetch('/api/fundraiser/payment_intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': Utilities.getAuthToken(),
        },
        body: JSON.stringify({ token: performer.token, dates }),
      })

      if (cancelled) return

      const body = await response.json().catch(() => ({}))

      if (response.status === 409) {
        // Someone else took one of these while this donor was deciding.
        setClaimedSince(body.claimed_dates || [])
        return
      }

      if (!response.ok) {
        setError(body.error || "We couldn't start this donation. Please try again.")
        return
      }

      setClientSecret(body.clientSecret)
      setPaymentIntentId(body.paymentIntentId || null)
    }

    createIntent()

    return () => {
      cancelled = true
    }
    // Deliberately once: re-creating the intent on every keystroke of the name
    // field would make a new charge for each character.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const summary = (
    <div className="card flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-ocean text-body font-bold text-on-brand"
          aria-hidden="true"
        >
          {performer.initials}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-body font-bold text-primary">{performer.name}</span>
          {(performer.ensemble || performer.section) && (
            <span className="text-caption text-secondary">
              {[performer.ensemble, performer.section].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-border-default" />

      <span className="card-title">Dates you're sponsoring</span>
      <div className="flex flex-wrap gap-2">
        {dates.map((date) => (
          <DateChip key={date} date={date} />
        ))}
      </div>

      <div className="border-t border-border-default" />

      <div className="flex items-end justify-between">
        <span className="text-body-sm font-semibold text-secondary">Total</span>
        <span className="text-[36px] font-extrabold leading-[38px] tracking-tight text-primary">
          {dollars(totalCents)}
        </span>
      </div>
    </div>
  )

  if (claimedSince.length > 0) {
    return (
      <div className="card card--warning flex max-w-[560px] flex-col gap-2.5">
        <span className="text-h3 text-primary">Someone just took one of your dates</span>
        <p className="m-0 text-body text-secondary">
          Nothing was charged. {firstName}'s calendar changed while you were deciding, so pick
          again and the total will update.
        </p>
        <a href={datesPath} className="btn-primary btn-lg self-start">
          Back to {firstName}'s calendar
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row-reverse lg:gap-7">
      <div className="w-full lg:w-[320px] lg:flex-none">{summary}</div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <h1 className="m-0 text-h1 tracking-tight text-primary">Finish your donation</h1>

        <div className="card">
          {error && <p className="m-0 text-body text-danger-fg">{error}</p>}

          {!error && !clientSecret && (
            <div className="flex flex-col gap-3">
              <span className="h-11 w-full animate-pulse rounded-sm bg-sunken motion-reduce:animate-none" />
              <span className="h-11 w-full animate-pulse rounded-sm bg-sunken motion-reduce:animate-none" />
            </div>
          )}

          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                totalCents={totalCents}
                donorName={donorName}
                onDonorNameChange={setDonorName}
                performerFirstName={firstName}
                datesPath={datesPath}
                paymentIntentId={paymentIntentId}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  )
}

export default DonationCheckout
