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

  render(
    <PaymentsList
      paymentTypes={paymentTypes}
      seasonLabel={el.dataset.seasonLabel || 'This season'}
    />,
    el,
  )
}
