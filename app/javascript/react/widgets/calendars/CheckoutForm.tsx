import React, { useState } from 'react'
import {useStripe, useElements, PaymentElement} from '@stripe/react-stripe-js';

const CheckoutForm = () => {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault()
    setSubmitting(true)

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return
    }

    const host = window.location.origin
    const result = await stripe.confirmPayment({
      //`Elements` instance that was used to create the Payment Element
      elements,
      confirmParams: {
        return_url: `${host}/calendars/payment-confirmed`,
      },
    })

    setSubmitting(false)

    if (result.error) {
      // Show error to your customer (for example, payment details incomplete)
      console.error(result.error.message)
      setError('We were unable to process your payment. Please refresh the page and try again.')
    } else {
      // Your customer will be redirected to your `return_url`. For some payment
      // methods like iDEAL, your customer will be redirected to an intermediate
      // site first to authorize the payment, then redirected to the `return_url`.
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error.length > 0 &&
        <div className="my-4 text-red-300">
          {error}
        </div>
      }
      <div className="flex justify-center mt-4">
        <button className="btn-lg btn-primary" disabled={!stripe && !submitting}>Submit</button>
      </div>
    </form>
  )
};

export default CheckoutForm
