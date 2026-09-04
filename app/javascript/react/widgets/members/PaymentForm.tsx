import React, { useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import PaymentCheckout from './PaymentCheckout'
import MoneyField, { FeeBreakdown } from '../../components/MoneyField'
import { totalCents } from '../../../utilities/stripe_fees'
import Utilities from '../../../utilities/utilities'

type PaymentFormProps = {
  stripePromise: Promise<unknown>
  returnUrl: string
  owedCents: number
  owedDueOn: string | null
  pastDueCents: number
  remainingCents: number
  prefillCents: number | null
}

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const stripeAppearance = () => {
  const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return {
    theme: (dark ? 'night' : 'stripe') as 'night' | 'stripe',
    variables: {
      colorPrimary: dark ? '#498197' : '#386374',
      colorBackground: dark ? '#26272a' : '#ffffff',
      colorText: dark ? '#e9ebec' : '#1d1e20',
      fontFamily: 'Figtree, -apple-system, "Segoe UI", sans-serif',
      borderRadius: '6px',
    },
  }
}

const PaymentForm = ({
  stripePromise,
  returnUrl,
  owedCents,
  owedDueOn,
  pastDueCents,
  remainingCents,
  prefillCents,
}: PaymentFormProps) => {
  // Only prefill when the dashboard "Pay $X" link asked for it (?amount=).
  // "Pay another amount" links here with no amount, so the field starts empty.
  const [amountCents, setAmountCents] = useState<number | null>(prefillCents)
  const [clientSecret, setClientSecret] = useState('')
  const [paying, setPaying] = useState(false)

  const valid = amountCents != null && amountCents > 0 && amountCents <= remainingCents
  const covers = amountCents != null && owedCents > 0 && amountCents >= owedCents && owedDueOn

  const createPaymentIntent = () => {
    if (!valid) return
    setPaying(true)
    fetch('/api/members/payment_intents', {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': Utilities.getAuthToken(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: (amountCents! / 100).toFixed(2) }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret))
      .catch(() => setPaying(false))
  }

  return (
    <div className="flex flex-col gap-5">
      {/* What you owe */}
      <div className="rounded-md bg-sunken border border-border-default p-4 flex flex-col gap-2">
        <span className="card-title">What you owe</span>
        {owedCents > 0 ? (
          <div className="flex justify-between text-body-sm">
            <span>{pastDueCents > 0 ? 'Past due' : `Due ${owedDueOn ?? 'soon'}`}</span>
            <span className="font-mono font-semibold">{money(owedCents)}</span>
          </div>
        ) : (
          <div className="flex justify-between text-body-sm">
            <span>Nothing due right now</span>
            <span className="font-mono">{money(0)}</span>
          </div>
        )}
        <div className="flex justify-between text-body-sm text-secondary border-t border-border-default pt-2">
          <span>Remaining this season</span>
          <span className="font-mono">{money(remainingCents)}</span>
        </div>
      </div>

      {!clientSecret && (
        <div className="rounded-md bg-surface border border-border-default p-4 flex flex-col gap-4">
          <span className="card-title">How much</span>

          <div className="flex gap-2">
            {owedCents > 0 && (
              <button
                type="button"
                onClick={() => setAmountCents(owedCents)}
                className="flex-1 h-11 rounded-sm border border-ocean text-accent-primary font-semibold text-body-sm hover:bg-sunken"
              >
                Pay {money(owedCents)} owed
              </button>
            )}
            {remainingCents > 0 && remainingCents !== owedCents && (
              <button
                type="button"
                onClick={() => setAmountCents(remainingCents)}
                className="flex-1 h-11 rounded-sm border border-border-strong font-semibold text-body-sm hover:bg-sunken"
              >
                All {money(remainingCents)}
              </button>
            )}
          </div>

          <MoneyField
            id="payment-amount"
            valueCents={amountCents}
            onChangeCents={setAmountCents}
            maxCents={remainingCents}
            autoFocus
            helper={covers ? `Covers your ${owedDueOn} installment in full.` : undefined}
          />
          <p className="text-caption text-secondary">
            Any amount up to {money(remainingCents)} · applied to the oldest installment first
          </p>

          <p className="text-body-sm text-secondary bg-sunken rounded-sm p-3">
            Paying by card? The processor charges 3% + 30¢, and we add it on top so your full
            payment lands on your dues. Venmo, cash, or a check at rehearsal has no fee.
          </p>

          <FeeBreakdown amountCents={amountCents} className="border-t border-border-default pt-4" />

          <button
            type="button"
            onClick={createPaymentIntent}
            disabled={!valid || paying}
            className="btn-primary btn-lg disabled:opacity-40 disabled:pointer-events-none"
          >
            {paying
              ? 'Setting up…'
              : amountCents
                ? `Pay ${money(totalCents(amountCents))}`
                : 'Enter an amount'}
          </button>
        </div>
      )}

      {clientSecret && (
        <div className="rounded-md bg-surface border border-border-default p-4 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="card-title">Card details</span>
            <button
              type="button"
              onClick={() => {
                setClientSecret('')
                setPaying(false)
              }}
              className="text-caption text-accent-primary hover:underline"
            >
              Change amount
            </button>
          </div>
          <FeeBreakdown amountCents={amountCents} className="pb-1" />
          <Elements options={{ clientSecret, appearance: stripeAppearance() }} stripe={stripePromise as never}>
            <PaymentCheckout returnUrl={returnUrl} />
          </Elements>
        </div>
      )}
    </div>
  )
}

export default PaymentForm
