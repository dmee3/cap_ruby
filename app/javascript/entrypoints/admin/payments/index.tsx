import React from 'react'
import { render } from 'react-dom'
import { PlusSmIcon } from '@heroicons/react/outline'

import PaymentsTable from '../../../react/widgets/PaymentsTable'

const AdminPayments = () => {
  render(
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between mt-4 mb-2">
        <h1>Payments</h1>
        <div>
          <a href="/admin/payments/new" className="btn-green btn-lg">
            <PlusSmIcon className="mr-2 h-6 w-6" />
            New
          </a>
        </div>
      </div>
      <div className="overflow-x-auto align-middle inline-block min-w-full">
        <PaymentsTable />
      </div>
    </div>,
    document.getElementById('payments')
  )
}

AdminPayments()
