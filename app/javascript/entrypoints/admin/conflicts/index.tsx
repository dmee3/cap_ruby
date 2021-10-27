import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { PlusSmIcon, CheckIcon, XIcon } from '@heroicons/react/outline'
import Utilities from '../../../utilities/utilities'
import Badge from '../../../react/components/Badge'

const AdminConflicts = () => {
  const [conflicts, setConflicts] = useState([])
  const [conflictStatuses, setConflictStatuses] = useState([])
  const [pendingConflicts, setPendingConflicts] = useState([])

  const statusToColor = status => {
    switch (status) {
      case 'Approved':
        return 'green'
      case 'Denied':
        return 'red'
      case 'Pending':
        return 'yellow'
      default:
        return 'gray'
    }
  }

  const approveConflict = id => {
    const newStatus = conflictStatuses.filter(c => c.name === 'Approved')[0]
    updateConflict(id, newStatus.id)
  }

  const denyConflict = id => {
    const newStatus = conflictStatuses.filter(c => c.name === 'Denied')[0]
    updateConflict(id, newStatus.id)
  }

  const updateConflict = (conflictId, statusId) => {
    fetch(
      `/api/admin/conflicts/${conflictId}`,
      {
        method: 'PUT',
        headers: {
          'X-CSRF-TOKEN': Utilities.getAuthToken(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conflict: { status_id: statusId }
        }),
      }
    )
      .then(resp => {
        if (resp.ok) {
          fetchAllConflicts()
        } else {
          throw resp
        }
      })
      .catch(error => {
        console.error(error)
      })
  }

  const fetchAllConflicts = () => {
    fetch('/api/admin/conflicts')
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        data = data.sort((a, b) => a.start - b.start)
        setConflicts(data.filter(c => c.status.name !== 'Pending'))
        setPendingConflicts(data.filter(c => c.status.name === 'Pending'))
      })
      .catch(error => console.error(error))
  }

  useEffect(() => {
    fetchAllConflicts()
    fetch('/api/conflict_statuses')
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => setConflictStatuses(data))
      .catch(error => console.error(error))
  }, [])

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between mt-4 mb-2">
        <h1>Conflicts</h1>
        <div>
          <a href="/admin/conflicts/new" className="btn-green btn-lg">
            <PlusSmIcon className="mr-2 h-6 w-6" />
            New
          </a>
        </div>
      </div>
      <div>
        <h2>Pending</h2>
        <ul className="divide-y divide-gray-300">
          {pendingConflicts.map(conflict => {
            return <li key={conflict.id} className="flex flex-col space-y-2 p-4 hover:bg-gray-100 cursor-pointer">
              <div className="flex flex-row space-x-2 items-start">
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">{conflict.title}</span>
                  <span className="text-sm font-light">{Utilities.displayDateTimeReadable(conflict.start)} to {Utilities.displayDateTimeReadable(conflict.end)}</span>
                  <span className="text-sm text-secondary">{conflict.reason}</span>
                </div>
                <Badge
                  text={conflict.status.name}
                  color={statusToColor(conflict.status.name)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button className="btn-green btn-md" onClick={() => approveConflict(conflict.id)}>
                  <CheckIcon className="h-6 w-6" />
                </button>

                <button className="btn-red btn-md" onClick={() => denyConflict(conflict.id)}>
                  <XIcon className="h-6 w-6" />
                </button>
              </div>
            </li>
          })}
        </ul>
      </div>
      <div className="">
        <h2>Upcoming</h2>
        <ul className="divide-y divide-gray-300">
          {conflicts.map(conflict => {
            return <li key={conflict.id} className="flex flex-row space-x-2 p-4 items-start hover:bg-gray-100 cursor-pointer">
              <div className="flex flex-1 flex-col">
                <span className="font-medium">{conflict.title}</span>
                <span className="text-sm font-light">{Utilities.displayDateTimeReadable(conflict.start)} to {Utilities.displayDateTimeReadable(conflict.end)}</span>
                <span className="text-sm text-secondary">{conflict.reason}</span>
              </div>
              <Badge
                text={conflict.status.name}
                color={statusToColor(conflict.status.name)}
              />
            </li>
          })}
        </ul>
      </div>
    </div>
  )
}

ReactDOM.render(
  <AdminConflicts />,
  document.getElementById('conflicts')
)
