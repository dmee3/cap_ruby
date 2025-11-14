import React, { useState } from 'react'
import InputNumberV2 from '../../components/inputs/InputNumberV2'
import InputTextarea from '../../components/inputs/InputTextarea'

type Member = {
  id: number
  first_name: string
  last_name: string
  full_name: string
}

type PaymentType = {
  id: number
  name: string
}

type PaymentFormProps = {
  members: Member[]
  paymentTypes: PaymentType[]
  preselectedUserId?: number
}

const PaymentForm = ({ members, paymentTypes, preselectedUserId }: PaymentFormProps) => {
  const csrfToken = (document.getElementsByName('csrf-token')[0] as HTMLMetaElement).content
  const [userId, setUserId] = useState(preselectedUserId || '')
  const [paymentTypeId, setPaymentTypeId] = useState(paymentTypes.find(pt => pt.name === 'Venmo')?.id || '')
  const [amount, setAmount] = useState<string>('')
  const [datePaid, setDatePaid] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const validate = () => {
    const newErrors: string[] = []

    if (!userId) {
      newErrors.push('Please select a user')
    }
    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.push('Please enter a valid amount')
    }
    if (!datePaid) {
      newErrors.push('Please select a date paid')
    }
    if (!paymentTypeId) {
      newErrors.push('Please select a payment method')
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    if (submitting) {
      return
    }

    setSubmitting(true)

    fetch('/api/admin/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken
      },
      body: JSON.stringify({
        payment: {
          user_id: userId,
          payment_type_id: paymentTypeId,
          amount: parseFloat(amount),
          date_paid: datePaid,
          notes: notes
        }
      })
    })
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        // Success - redirect to payments index
        window.location.href = '/admin/payments'
      })
      .catch(error => {
        setSubmitting(false)
        if (error.json) {
          error.json().then((data: any) => {
            setErrors(data.errors || ['An error occurred while creating the payment'])
          })
        } else {
          setErrors(['An error occurred while creating the payment'])
          console.error(error)
        }
      })
  }

  return (
    <div className="flex flex-col">
      <h1>New Payment</h1>

      {errors.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <ul className="list-disc list-inside">
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        <div className="grid grid-cols-5 gap-x-6 gap-y-4">
          <div className="col-span-5 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
            <label htmlFor="payment_user_id" className="input-label">User</label>
          </div>
          <div className="col-span-5 sm:col-span-4 flex items-center">
            <select
              id="payment_user_id"
              className="input-select"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={submitting}
            >
              <option value="">Select a user...</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-5 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
            <label htmlFor="payment_payment_type_id" className="input-label">Method</label>
          </div>
          <div className="col-span-5 sm:col-span-4 flex items-center">
            <select
              id="payment_payment_type_id"
              className="input-select"
              value={paymentTypeId}
              onChange={(e) => setPaymentTypeId(e.target.value)}
              disabled={submitting}
            >
              <option value="">Select a payment method...</option>
              {paymentTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-5 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
            <label htmlFor="payment_amount" className="input-label">Amount</label>
          </div>
          <div className="col-span-5 sm:col-span-4 flex items-center">
            <InputNumberV2
              name="amount"
              id="payment_amount"
              currency={true}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={submitting}
              placeholder="0.00"
            />
          </div>

          <div className="col-span-5 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
            <label htmlFor="payment_date_paid" className="input-label">Date Paid</label>
          </div>
          <div className="col-span-5 sm:col-span-4 flex items-center">
            <input
              type="date"
              id="payment_date_paid"
              className="input-select"
              value={datePaid}
              onChange={(e) => setDatePaid(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="col-span-5 sm:col-span-1 -mb-2 sm:mb-0 flex items-center">
            <label htmlFor="payment_notes" className="input-label">Notes</label>
          </div>
          <div className="col-span-5 sm:col-span-4 flex items-center">
            <InputTextarea
              name="notes"
              id="payment_notes"
              placeholder="Notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-row justify-end">
          <button
            type="submit"
            className={`btn-primary btn-lg ${submitting && 'opacity-50 cursor-default'}`}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PaymentForm
