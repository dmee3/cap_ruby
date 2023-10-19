import React, { useState, useEffect } from 'react'
import Utilities from '../../../utilities/utilities'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

import Badge from '../../components/Badge'

type UpcomingPaymentProps = {
}

const UpcomingPayment = ({
}: UpcomingPaymentProps) => {
  const daysToSeconds = numDays => {
    return numDays * 86400000
  }

  const [payments, setPayments] = useState([])
  const [displayedPayments, setDisplayedPayments] = useState([])
  const [cursor, setCursor] = useState(0)
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
        const rawPayments = data.map(entry => {
          return {
            ...entry,
            date: Utilities.dateWithTZ(entry.date),
            owed: entry.scheduled - entry.paid
          }
        }).sort((a, b) => a.date - b.date)
        setPayments(rawPayments)
        setDisplayedPayments(rawPayments.slice(cursor, cursor + 5))
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

  const handleLeftClick = (): void => {
    if (cursor == 0) { return; }

    const newCursor = Math.max(0, cursor - 5)
    setCursor(newCursor)
    setDisplayedPayments(payments.slice(newCursor, newCursor + 5))
  }

  const handleRightClick = (): void => {
    if (cursor >= payments.length - 5) { return; }

    const newCursor = Math.min(payments.length, cursor + 5)
    setCursor(newCursor)
    setDisplayedPayments(payments.slice(newCursor, newCursor + 5))
  }

  return (
    <div className="p-5 shadow-md row-span-2 green-gradient">
      <div className="flex flex-col">
        <span className="card-title text-green-200">UPCOMING PAYMENTS</span>
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
        {displayedPayments.map(payment => {
          return <li key={payment.id}>
            <a href={`/admin/users/${payment.user_id}`} className="px-5 py-4 -mx-5 flex flex-col hover:bg-green-500 transition">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <span className="mb-0.5 text-white font-medium">{payment.name}</span>
                  <span className="text-sm text-green-200 hidden xl:inline">
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
              <div>
                <span className="text-green-200 font-medium text-xs">
                  {
                    payment.owed > payment.current_amount &&
                    `${Utilities.formatMoney(payment.current_amount)} + ${Utilities.formatMoney(payment.owed - payment.current_amount)} past due`
                  }
                </span>
              </div>
            </a>
          </li>
        })}
        <li className="pt-4 flex flex-col items-center">
          <div className="flex flex-row">
            <ChevronLeftIcon className="mr-2 h-6 w-6 cursor-pointer text-green-200 hover:text-black transition" onClick={() => handleLeftClick()} />
            <span className="mb-0.5 text-white">
              {
                displayedPayments.length > 0 ?
                  `${Math.max(cursor + 1, 0)} - ${Math.min(payments.length, cursor + 5)} of ${payments.length}`
                  :
                  "0 of 0"
              }
            </span>
            <ChevronRightIcon className="ml-2 h-6 w-6 cursor-pointer text-green-200 hover:text-white transition" onClick={() => handleRightClick()} />
          </div>
        </li>
      </ul>
    </div>
  )
}

export default UpcomingPayment
