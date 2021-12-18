import { PlusSmIcon } from '@heroicons/react/outline'
import Utilities from '../../../utilities/utilities'
import fuzzysort from 'fuzzysort'
import React, { useState, useEffect } from 'react'
import Badge from '../../components/Badge'

type PaymentsTableProps = {}

const PaymentsTable = ({
}: PaymentsTableProps) => {
  const [members, setMembers] = useState([])
  const [displayedList, setDisplayedList] = useState([])

  const moneyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  const fetchPayment = () => {
    useEffect(() => {
      fetch(`/api/admin/payments`)
        .then(resp => {
          if (resp.ok) {
            return resp.json()
          }
          throw resp
        })
        .then(data => {
          const users = data.users.map(member => ({
            ...member,
            paid:  member.payments.reduce((sum, payment) => sum + payment.amount, 0),
            total: member.total,
            status: checkStatus(member),
            nextPayment: nextPayment(member),
            searchStr: `${member.ensemble} ${member.section} ${member.first_name} ${member.last_name}`
          })).sort((a, b) => {
            const aCompStr = `${a.first_name}${a.last_name}`
            const bCompStr = `${b.first_name}${b.last_name}`
            return aCompStr > bCompStr ? 1 : -1
          })
          setMembers(users)
          setDisplayedList(users)
        })
        .catch(error => {
          console.error(error)
        })
    }, [])
  }

  const filterList = searchTerm => {
    if (searchTerm.length < 2) {
      setDisplayedList(members)
      return
    }

    const filteredList = fuzzysort
      .go(searchTerm, members, {
        allowTypo: true,
        key: 'searchStr',
        threshold: -50,
      })
      .map((item) => item.obj)
    setDisplayedList(filteredList)
  }

  const checkStatus = member => {
    const pastDue = member.remaining_payments.filter(
      p => Utilities.compareToToday(p.pay_date) < 0 && p.amount > 0
    )
    return pastDue.length === 0
  }

  const handleMemberClick = memberId => {
    window.location.href = `/admin/users/${memberId}`
  }

  const nextPayment = member => {
    if (member.total === member.payments.reduce((sum, payment) => sum + payment.amount, 0)) {
      return false
    }

    const payments = member.remaining_payments.filter(
      p => Utilities.compareToToday(p.pay_date) >= 0
    )

    const amount = member.remaining_payments.filter(
      p => new Date(p.pay_date) <= new Date(payments[0].pay_date)
    ).reduce((sum, payment) => sum + payment.amount, 0)
    return {
      amount: amount,
      pay_date: payments[0].pay_date
    }
  }

  fetchPayment()

  return(
    <>
      <div className="mb-4">
        <input
          placeholder="Filter by name/section/ensemble"
          name="search"
          className="input-text"
          type="text"
          onChange={evt => filterList(evt.target.value)}
        />
      </div>
      <table className="custom-table">
        <thead>
          <tr>
            <th scope="col" className="table-header">
              Name
            </th>
            <th scope="col" className="table-header">
              Paid
            </th>
            <th scope="col" className="table-header">
              Remaining
            </th>
            <th scope="col" className="table-header">
              Total
            </th>
            <th scope="col" className="table-header">
              Next Payment
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="sr-only">
              New
            </th>
          </tr>
        </thead>
        <tbody className="table-body">
          {displayedList.map(member => {
            return <tr
              key={member.id}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => handleMemberClick(member.id)}
            >
              <td className="table-cell">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {`${member.first_name} ${member.last_name}`}
                  </span>
                  <span className="text-secondary">
                    {`${member.ensemble} ${member.section}`}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-left whitespace-nowrap">
                {moneyFormatter.format(member.paid / 100.0)}
              </td>
              <td className="px-6 py-4 text-left whitespace-nowrap">
                {moneyFormatter.format((member.total - member.paid) / 100.0)}
              </td>
              <td className="px-6 py-4 text-left whitespace-nowrap">
                {`${moneyFormatter.format(member.total / 100.0)}`}
              </td>
              <td className="px-6 py-4 text-left whitespace-nowrap">
                {member.nextPayment ?
                  <div className="flex flex-col">
                    {`${moneyFormatter.format(member.nextPayment.amount / 100.0)}`}
                    <span className="text-secondary">
                      {Utilities.displayDate(new Date(member.nextPayment.pay_date))}
                    </span>
                  </div>
                  :
                  <span>None</span>
                }
              </td>
              <td className="px-6 py-4 text-center whitespace-nowrap">
                {member.status ?
                  <Badge
                    text='Current'
                    color='green'
                  />
                    :
                  <Badge
                    text='Behind'
                    color='red'
                  />
                }
              </td>
              <td className="px-6 py-4 text-right whitespace-nowrap">
                <div className="flex justify-end">
                  <a href={`/admin/payments/new?user_id=${member.id}`} className="btn-green btn-md">
                    <PlusSmIcon className="mr-1 h-4 w-4" />
                    New
                  </a>
                </div>
              </td>
            </tr>
          })}
        </tbody>
      </table>
    </>
  )
}

export default PaymentsTable
