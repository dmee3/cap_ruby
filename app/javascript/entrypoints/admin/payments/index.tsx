import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { PlusSmallIcon } from '@heroicons/react/24/outline'
import Utilities from '../../../utilities/utilities'

import PaymentsTable from '../../../react/widgets/admin/PaymentsTable'

const AdminPayments = () => {
  const [latestPayment, setLatestPayment] = useState(null)

  const moneyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  useEffect(() => {
    fetch(`/api/admin/payments/latest_venmo`)
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => setLatestPayment(data))
      .catch(error => console.error(error))
  }, [])

  return(
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between mt-4 mb-2">
        <h1>Payments</h1>
        <div>
          <a href="/admin/payments/new" className="btn-green btn-lg">
            <PlusSmallIcon className="mr-2 h-6 w-6" />
            New
          </a>
        </div>
      </div>
      {latestPayment && (
        <div className="card-flat mb-2">
          <div className="card-title text-gray-500">LAST ENTERED VENMO PAYMENT</div>
          <h2 className="mb-0">{latestPayment.user.first_name} {latestPayment.user.last_name}</h2>
          <span className="text-gray-500 text-sm font-medium">{moneyFormatter.format(latestPayment.amount / 100.0)} paid on {Utilities.displayDate(new Date(latestPayment.date_paid))}</span>
          <div className="text-gray-500 text-sm font-light">(Entered on {Utilities.displayDate(new Date(latestPayment.created_at))})</div>
      </div>
      )}
      <div className="overflow-x-auto align-middle inline-block min-w-full">
        <PaymentsTable />
      </div>
    </div>
  )
}

ReactDOM.render(
  <AdminPayments />,
  document.getElementById('payments')
)
