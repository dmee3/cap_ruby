import moment from 'moment'
import React, { useState, useEffect } from 'react'
import Badge from '../components/badge'

type PaymentsTableProps = {}

const PaymentsTable = ({
}: PaymentsTableProps) => {
  const [members, setMembers] = useState([])

  const moneyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  useEffect(() => {
    fetch(`/api/admin/payments`)
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        const members = data.users.map(member => ({
          ...member,
          paid:  member.payments.reduce((sum, payment) => sum + payment.amount, 0),
          total: member.payment_schedule.entries.reduce((sum, entry) => sum + entry.amount, 0),
          owed: findOwed(member)
        }))
        setMembers(members)
      })
      .catch(error => {
        console.error(error)
      })
  }, [])

  const findOwed = member => {
    const currentEntries = member.payment_schedule.entries.filter(entry => moment(entry.pay_date) <= moment())
    return currentEntries.reduce((sum, entry) => sum + entry.amount, 0)
  }

  const handleMemberClick = member => {
    window.location.href = `/admin/users/${member}`
  }

  return(
    <table className="min-w-full divide-y divide-gray-500">
      <thead>
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Name
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            total
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Paid / Owed
          </th>
          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-300 text-sm">
        {members.map(member => {
          return <tr
            key={member.id}
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => handleMemberClick(member.id)}
          >
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex flex-col">
                <span className="font-medium">
                  {`${member.first_name} ${member.last_name}`}
                </span>
                <span>
                  {`${member.ensemble} ${member.section}`}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 text-left whitespace-nowrap">
              {`${moneyFormatter.format(member.total / 100.0)}`}
            </td>
            <td className="px-6 py-4 text-left whitespace-nowrap">
              {`${moneyFormatter.format(member.paid / 100.0)} / ${moneyFormatter.format(member.owed / 100.0)}`}
            </td>
            <td className="px-6 py-4 text-right whitespace-nowrap">
              {member.paid >= member.owed ? 
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
          </tr>
        })}
      </tbody>
    </table>
  )
}

export default PaymentsTable
