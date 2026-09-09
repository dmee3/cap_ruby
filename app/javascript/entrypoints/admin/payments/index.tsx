import React from 'react'
import { render } from 'react-dom'
import PaymentsList from '../../../react/widgets/admin/PaymentsList'

const el = document.getElementById('admin-payments')

if (el) {
  let paymentTypes: { id: number; name: string }[] = []
  try {
    paymentTypes = JSON.parse(el.dataset.paymentTypes || '[]')
  } catch {
    paymentTypes = []
  }
  const raw = el.dataset.justCreated
  const justCreatedId = raw ? Number(raw) : null

  render(
    <PaymentsList
      paymentTypes={paymentTypes}
      justCreatedId={Number.isFinite(justCreatedId) ? justCreatedId : null}
    />,
    el,
  )
}
