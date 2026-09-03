import React, { useState, useEffect } from 'react'
import Utilities from '../../../utilities/utilities'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import Pill from '../../components/Pill'

type BehindMembersProps = {
}

const BehindMembers = ({
}: BehindMembersProps) => {
  const [members, setMembers] = useState([])
  const [displayedMembers, setDisplayedMembers] = useState([])
  const [cursor, setCursor] = useState(0)

  const fetchBehindMembers = () => {
    useEffect(() => {
      fetch(`/api/admin/users?behind=true`)
        .then(resp => {
          if (resp.ok) {
            return resp.json()
          }
          throw resp
        })
        .then(data => {
          setMembers(data)
          setDisplayedMembers(data.slice(cursor, cursor + 5))
        })
        .catch(error => {
          console.error(error)
        })
    }, [])
  }

  const handleLeftClick = (): void => {
    if (cursor == 0) { return; }

    const newCursor = Math.max(0, cursor - 5)
    setCursor(newCursor)
    setDisplayedMembers(members.slice(newCursor, newCursor + 5))
  }

  const handleRightClick = (): void => {
    if (cursor >= members.length - 5) { return; }

    const newCursor = Math.min(members.length, cursor + 5)
    setCursor(newCursor)
    setDisplayedMembers(members.slice(newCursor, newCursor + 5))
  }

  fetchBehindMembers()

  return (
    <div className="h-full card-flat flex flex-col">
      <div className="flex flex-col">
        <span className="card-title">BEHIND MEMBERS</span>
        <span className="text-metric font-mono">
          {members.length === 0 &&
            <span className="text-success-fg">{members.length}</span>
          }
          {members.length < 5 && members.length > 0 &&
            <span className="text-warning-fg">{members.length}</span>
          }
          {members.length >= 5 &&
            <span className="text-danger-fg">{members.length}</span>
          }
        </span>
      </div>

      <div className="flex flex-col flex-1 justify-between">
        <ul className="divide-y divide-border-default">
          {displayedMembers.map(member => (
            <li key={member.id}>
              <a href={`/admin/users/${member.id}`} className="px-5 py-4 -mx-5 flex flex-col group hover:bg-sunken transition">
                <div className="flex justify-between">
                  <div className="flex flex-col">
                    <span className="mb-0.5 font-medium">{member.name}</span>
                  </div>
                  <div>
                    <Pill tone="danger">{`-$${member.behind / 100.0}`}</Pill>
                  </div>
                </div>
                <div>
                  <span className="text-body-sm font-medium text-secondary hidden xl:inline">
                    {member.last_payment &&
                      `Last paid $${member.last_payment.amount / 100.0} on ${Utilities.displayDate(Utilities.dateWithTZ(member.last_payment.date_paid))}`
                    }
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>

        <div className="pt-4 flex flex-col items-center">
          <div className="flex flex-row">
            <ChevronLeftIcon className="mr-2 h-6 w-6 cursor-pointer text-secondary hover:text-primary transition" onClick={() => handleLeftClick()} />
            <span className="mb-0.5 text-primary">
              {
                displayedMembers.length > 0 ?
                  `${Math.max(cursor + 1, 0)} - ${Math.min(members.length, cursor + 5)} of ${members.length}`
                  :
                  "0 of 0"
              }
            </span>
            <ChevronRightIcon className="ml-2 h-6 w-6 cursor-pointer text-secondary hover:text-primary transition" onClick={() => handleRightClick()} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BehindMembers
