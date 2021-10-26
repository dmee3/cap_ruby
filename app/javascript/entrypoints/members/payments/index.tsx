import React from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { render } from 'react-dom'
import PaymentForm from '../../../react/widgets/members/PaymentForm'

const stripePromise = loadStripe(stripePublicKey)

const MembersPayments = () => {
  
  render(
    <div className="flex flex-col">
      <h1>New Payment</h1>
      <PaymentForm
        stripePromise={stripePromise}
        returnUrl={returnUrl}
      />
    </div>,
    document.getElementById('payments')
  )
}

MembersPayments()
