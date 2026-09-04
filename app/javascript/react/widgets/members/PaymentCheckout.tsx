import React, { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

type PaymentCheckoutProps = {
  returnUrl: string
}

const PaymentCheckout = ({ returnUrl }: PaymentCheckoutProps) => {
  const stripe = useStripe()
  const elements = useElements()

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)
    setError(null)

    // Only an immediate confirmation error returns here — otherwise Stripe
    // redirects to return_url. A declined card lands here, PaymentElement stays
    // mounted, and the member can retry in place.
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    })

    if (stripeError.type === 'card_error' || stripeError.type === 'validation_error') {
      setError(stripeError.message ?? 'Your card could not be charged.')
    } else {
      setError('Something went wrong. Nothing was charged — please try again.')
    }
    setIsLoading(false)
  }

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement id="payment-element" />

      {error && (
        <div className="rounded-sm bg-danger-bg text-danger-fg text-body-sm p-3">
          {error} Nothing was charged — check the details above and try again.
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="btn-primary btn-lg disabled:opacity-40 disabled:pointer-events-none"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Processing…
          </span>
        ) : (
          'Pay now'
        )}
      </button>
    </form>
  )
}

export default PaymentCheckout
