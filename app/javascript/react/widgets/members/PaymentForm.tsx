import React, { useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import PaymentCheckout from './PaymentCheckout'
import InputNumber from '../../components/inputs/InputNumber'
import Utilities from '../../../utilities/utilities'

type PaymentFormProps = {
  stripePromise: Promise<any>,
  returnUrl: string
}

const PaymentForm = ({
  stripePromise,
  returnUrl
}: PaymentFormProps) => {
  const [paymentAmount, setPaymentAmount] = useState(1.0)
  const [paymentFee, setPaymentFee] = useState((1 / 0.97 + 0.3) - 1)
  const [paymentTotal, setPaymentTotal] = useState(1 / 0.97 + 0.3)
  const [clientSecret, setClientSecret] = useState('')
  const [paying, setPaying] = useState(false)

  const createPaymentIntent = () => {
    fetch('/api/members/payment_intents', {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': Utilities.getAuthToken(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        total: paymentTotal.toFixed(2),
        amount: paymentAmount.toFixed(2)
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setPaying(true)
        setClientSecret(data.clientSecret)
      })
  }

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#386374',
    },
  }
  const options = {
    clientSecret,
    appearance,
  }

  const calculateTotal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^0-9.]/, '')
    const lastChar = input.substring(input.length - 1)
    let amt
    if (lastChar === '.' || lastChar === '0') {
      amt = input
    } else {
      amt = parseFloat(input)
      if (Number.isNaN(amt)) {
        amt = 0
      }
    }
    const total = amt == 0 ? 0 : (amt / 0.97) + 0.3

    setPaymentAmount(amt)
    setPaymentFee(total - amt)
    setPaymentTotal(total)
  }

  return (
    <>
      <div className="grid grid-cols-5 gap-x-6 gap-y-4">
        <div className="col-span-5 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
          <label htmlFor="payment_amount" className="input-label">Amount</label>
        </div>
        <div className="col-span-5 sm:col-span-4 flex items-center">
          <div className="text-secondary font-bold mr-3">
            $
          </div>
          <InputNumber
            name="payment_amount"
            autofocus={true}
            disabled={paying}
            masked={true}
            min={1}
            onChange={calculateTotal}
            value={paymentAmount}
          />
        </div>

        <div className="col-span-5 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
          <label htmlFor="payment_fees" className="input-label">Credit Card Fee</label>
        </div>
        <div className="col-span-5 sm:col-span-4 flex items-center">
          <InputNumber
            name="payment_fees"
            currency={true}
            disabled={true}
            value={paymentFee}
          />
        </div>

        <div className="col-span-5 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
          <label htmlFor="payment_total" className="input-label">Total Charge</label>
        </div>
        <div className="col-span-5 sm:col-span-4 flex items-center">
          <InputNumber
            name="payment_total"
            currency={true}
            disabled={true}
            value={paymentTotal}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-row justify-end">
        <input type="submit" name="commit" value="Submit" onClick={createPaymentIntent} disabled={paying} className={`btn-primary btn-lg ${paying && `opacity-50 cursor-default`}`} />
      </div>

      {clientSecret && (
        <div className="mt-4">
          <Elements options={options} stripe={stripePromise}>
            <PaymentCheckout
              returnUrl={returnUrl}
            />
          </Elements>
        </div>
      )}
    </>
  )
}

export default PaymentForm