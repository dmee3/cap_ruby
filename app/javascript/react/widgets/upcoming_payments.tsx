import React, { useState, useEffect } from 'react'
import Utilities from '../../utilities/utilities'

import { Badge } from '../components/badge'

type UpcomingPaymentProps = {
}

const UpcomingPayment = ({
}: UpcomingPaymentProps) => {
  const [payments, setPayments] = useState([])
  const [start, setStart] = useState(new Date(Date.now()))
  const [end, endDate] = useState(new Date(Date.now() + 12096e5)) // 14 days away

  useEffect(() => {
    let params = `start=${Utilities.formatIsoDate(start)}&end=${Utilities.formatIsoDate(end)}`
    fetch(`/admin/api/payments?${params}`)
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        setPayments(
          data.map(entry => {
            return {
              ...entry,
              date: new Date(entry.date),
              owed: entry.scheduled - entry.paid
            }
          })
        )
      })
      .catch(error => {
        console.error(error)
      })
  }, [])

  const total = payments.map(p => p.owed).reduce((sum, curr) => sum + curr, 0)

  return (
    <div className="p-5 shadow-md bg-green-600 row-span-2">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-green-200">UPCOMING PAYMENTS</span>
        <span className="text-3xl text-white font-extrabold font-mono">
          {Utilities.formatMoney(total)}
        </span>
      </div>
      <ul className="divide-y divide-green-500">
        {payments.map(payment => {
          return <li key={payment.user_id}>
            <a href={`/admin/users/${payment.user_id}`} className="px-5 py-4 -mx-5 flex flex-col hover:bg-green-500 transition">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <span className="mb-0.5 text-white">{payment.name}</span>
                  <span className="text-sm font-medium text-green-200 hidden xl:inline">
                    {Utilities.displayDate(payment.date)}
                  </span>
                </div>
                <div>
                  <Badge
                    text={Utilities.formatMoney(payment.owed)}
                    color='green'
                  />
                </div>
              </div>
              {
                payment.owed > payment.current_amount &&
                <div>
                  <span className="text-green-200 font-medium text-xs">
                  {Utilities.formatMoney(payment.current_amount)} + {Utilities.formatMoney(payment.owed - payment.current_amount)} past due
                  </span>
                </div>
              }
            </a>
          </li>
        })}
      </ul>
    </div>
  )
}

export default UpcomingPayment