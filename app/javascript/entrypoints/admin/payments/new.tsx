import React from 'react'
import ReactDOM from 'react-dom'
import PaymentForm from '../../../react/widgets/admin/PaymentForm'

declare global {
  var members: any
  var paymentTypes: any
  var preselectedUserId: number | null
}

const AdminPaymentsNew = () => {
  return (
    <PaymentForm
      members={members}
      paymentTypes={paymentTypes}
      preselectedUserId={preselectedUserId || undefined}
    />
  )
}

ReactDOM.render(
  <AdminPaymentsNew />,
  document.getElementById('root')
)
