import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

import Utilities from '../../../utilities/utilities'
import addFlash from '../../../utilities/flashes'

import { PlusSmIcon, CheckIcon, XIcon } from '@heroicons/react/outline'
import Badge from '../../../react/components/Badge'
import InputToggle from '../../../react/components/inputs/InputToggle'

import ConflictCalendar from '../../../react/widgets/coordinators/ConflictCalendar'

const CoordinatorsConflicts = () => {
  const [conflicts, setConflicts] = useState([])
  const [displayedConflicts, setDisplayedConflicts] = useState([])
  const [showPast, setShowPast] = useState(false)
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
      `/api/coordinators/conflicts/${conflictId}`,
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
          return resp.json()
        }
        throw resp
      })
      .then(data => addFlash('success', data.message))
      .catch(error => {
        console.error(error)
      })
  }

  const fetchAllConflicts = () => {
    fetch('/api/coordinators/conflicts')
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        }
        throw resp
      })
      .then(data => {
        data = data.sort((a, b) => a.start - b.start)
        setConflicts(data.filter(c => c.status.name !== 'Pending'))
        setDisplayedConflicts(
          data.filter(c => c.status.name !== 'Pending')
            .filter(c => new Date(c.start) >= new Date(Date.now()))
        )
        setPendingConflicts(data.filter(c => c.status.name === 'Pending'))
      })
      .catch(error => console.error(error))
  }

  const togglePast = shouldShowPast => {
    setShowPast(shouldShowPast)
    if (shouldShowPast) {
      setDisplayedConflicts(conflicts)
    } else {
      setDisplayedConflicts(conflicts.filter(c => new Date(c.start) >= new Date(Date.now())))
    }
  }

  const redirectTo = conflict => {
    window.location.href = `/coordinators/conflicts/${conflict.id}/edit`
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
        <h1 className="my-0">Conflicts</h1>
        <div>
          <a href="/coordinators/conflicts/new" className="btn-green btn-lg">
            <PlusSmIcon className="mr-2 h-6 w-6" />
            New
          </a>
        </div>
      </div>
      {pendingConflicts.length > 0 && (
        <>
          <h2>Pending</h2>
          <ul className="divide-y divide-gray-300 dark:divide-gray-600">
            {pendingConflicts.map(conflict => {
              return <li key={conflict.id} className="flex flex-col space-y-2 p-4" onClick={() => redirectTo(conflict)}>
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
        </>
      )}

      <h2 className="mt-6">Calendar</h2>
      <ConflictCalendar coordinator={true} />

      <div className="flex flex-row items-center justify-between mt-6 mb-2">
        <h2 className="my-0">All</h2>
        <div className="pr-4">
          <InputToggle
            checked={showPast}
            id={'show-past-conflicts'}
            name={'show-past-conflicts'}
            onChange={() => togglePast(!showPast)}
            text={'Show Past'}
          />
        </div>
      </div>
      <ul className="divide-y divide-gray-300 dark:divide-gray-600">
        {displayedConflicts.map(conflict => {
          return <li key={conflict.id} className="flex flex-row space-x-2 p-4 items-start table-row-hover" onClick={() => redirectTo(conflict)}>
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
  )
}

ReactDOM.render(
  <CoordinatorsConflicts />,
  document.getElementById('conflicts')
)
