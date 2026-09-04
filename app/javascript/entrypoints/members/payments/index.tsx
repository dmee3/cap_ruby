import React from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { render } from 'react-dom'
import PaymentForm from '../../../react/widgets/members/PaymentForm'

const cfg = window.duesPayment
const stripePromise = loadStripe(cfg.stripePublicKey)

render(
  <PaymentForm
    stripePromise={stripePromise}
    returnUrl={cfg.returnUrl}
    owedCents={cfg.owedCents}
    owedDueOn={cfg.owedDueOn}
    pastDueCents={cfg.pastDueCents}
    remainingCents={cfg.remainingCents}
    prefillCents={cfg.prefillCents}
  />,
  document.getElementById('payments')
)
