import { PlusSmIcon } from '@heroicons/react/outline'
import moment from 'moment'
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
  });

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
            total: member.payment_schedule.entries.reduce((sum, entry) => sum + entry.amount, 0),
            owed: findOwed(member),
            searchStr: `${member.ensemble} ${member.section} ${member.first_name} ${member.last_name}`
          })).sort((a, b) => {
            if (a.ensemble === 'World' && b.ensemble === 'CC2') {
              return -1
            } else if (a.ensemble === 'CC2' && b.ensemble === 'World') {
              return 1
            } else {
              const aCompStr = `${a.section}${a.first_name}${a.last_name}`
              const bCompStr = `${b.section}${b.first_name}${b.last_name}`
              return aCompStr > bCompStr ? 1 : -1
            }
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

  const findOwed = member => {
    const currentEntries = member.payment_schedule.entries.filter(entry => moment(entry.pay_date) <= moment())
    return currentEntries.reduce((sum, entry) => sum + entry.amount, 0)
  }

  const handleMemberClick = memberId => {
    window.location.href = `/admin/users/${memberId}`
  }

  fetchPayment()

  return(
    <div>
      <div className="mb-4">
        <input
          placeholder="Filter by name/section/ensemble"
          name="search"
          className="input-text"
          type="text"
          onChange={evt => filterList(evt.target.value)}
        />
      </div>
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
        <thead>
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Paid
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Remaining
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="sr-only">
              New
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-300 dark:divide-gray-600 text-sm">
          {displayedList.map(member => {
            return <tr
              key={member.id}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
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
                {moneyFormatter.format(member.paid / 100.0)}
              </td>
              <td className="px-6 py-4 text-left whitespace-nowrap">
                {moneyFormatter.format((member.total - member.paid) / 100.0)}
              </td>
              <td className="px-6 py-4 text-left whitespace-nowrap">
                {`${moneyFormatter.format(member.total / 100.0)}`}
              </td>
              <td className="px-6 py-4 text-center whitespace-nowrap">
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
    </div>
  )
}

export default PaymentsTable
