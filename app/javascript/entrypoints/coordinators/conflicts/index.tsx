import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

import Utilities from '../../../utilities/utilities'
import addFlash from '../../../utilities/flashes'

import { PlusSmallIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Badge from '../../../react/components/Badge'

import ConflictCalendar from '../../../react/widgets/coordinators/ConflictCalendar'
import ConflictList from '../../../react/widgets/conflicts/ConflictList'
import PendingConflicts from '../../../react/widgets/conflicts/PendingConflicts'

const CoordinatorsConflicts = () => {
  const [conflicts, setConflicts] = useState([])
  const [conflictStatuses, setConflictStatuses] = useState([])
  const [pendingConflicts, setPendingConflicts] = useState([])

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
        setConflicts(
          data.filter(c => c.status.name !== 'Pending')
        )
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
        <h1 className="my-0">Conflicts</h1>
        <div>
          <a href="/coordinators/conflicts/new" className="btn-green btn-lg">
            <PlusSmallIcon className="mr-2 h-6 w-6" />
            New
          </a>
        </div>
      </div>
      {pendingConflicts.length > 0 && (
        <>
          <h2>Pending</h2>
          <PendingConflicts
            conflicts={pendingConflicts}
            approveConflict={approveConflict}
            denyConflict={denyConflict}
          />
        </>
      )}

      <h2 className="mt-6">Calendar</h2>
      <ConflictCalendar coordinator={true} />

      <ConflictList
        conflicts={conflicts}
        baseRedirectUrl={"/coordinators/conflicts/"}
      />
    </div>
  )
}

ReactDOM.render(
  <CoordinatorsConflicts />,
  document.getElementById('conflicts')
)
