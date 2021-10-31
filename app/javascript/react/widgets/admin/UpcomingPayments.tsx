import React, { useState, useEffect } from 'react'
import Utilities from '../../../utilities/utilities'

import Badge from '../../components/Badge'

type UpcomingPaymentProps = {
}

const UpcomingPayment = ({
}: UpcomingPaymentProps) => {
  const daysToSeconds = numDays => {
    return numDays * 86400000
  }

  const [payments, setPayments] = useState([])
  const [days, setDays] = useState(14)
  const [end, setEnd] = useState(new Date(Date.now() + daysToSeconds(14))) // 14 days away
  const start = new Date(Date.now())

  const fetchPayments = () => {
    const params = `start=${Utilities.formatIsoDate(start)}&end=${Utilities.formatIsoDate(end)}`
    fetch(`/api/admin/payments/upcoming?${params}`)
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
  }

  useEffect(() => {
    fetchPayments()
  }, [end])

  const handleEndChange = value => {
    if (Number.parseInt(value)) {
      setDays(value)
      setEnd(new Date(Date.now() + daysToSeconds(value)))
    }
  }

  const total = payments.map(p => p.owed).reduce((sum, curr) => sum + curr, 0)

  return (
    <div className="p-5 shadow-md bg-gradient-to-br from-green-500 to-green-700 row-span-2">
      <div className="flex flex-col">
        <span className="font-medium text-green-200">UPCOMING PAYMENTS</span>
        <span className="text-3xl text-white font-extrabold font-mono">
          {Utilities.formatMoney(total)}
        </span>
        <span className="text-sm text-green-200">
          Next&nbsp;
          <input
            type="text"
            className="inline bg-transparent border-0 border-b-1 border-white p-0 text-white text-center font-medium w-8 focus:ring-0 focus:border-white"
            value={days}
            onChange={(e) => handleEndChange(e.target.value)}
          />
          &nbsp;days
        </span>
      </div>
      <ul className="divide-y divide-green-500">
        {payments.map(payment => {
          return <li key={payment.id}>
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