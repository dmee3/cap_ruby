import React, { useEffect, useState } from 'react'
import Badge from '../../components/Badge'
import Utilities from '../../../utilities/utilities'
import InputToggle from '../../components/inputs/InputToggle'

type ConflictListProps = {
  baseRedirectUrl: string,
  conflicts: any[]
}

const ConflictList = ({
  baseRedirectUrl,
  conflicts
}: ConflictListProps) => {
  const [displayedConflicts, setDisplayedConflicts] = useState([])
  const [showPast, setShowPast] = useState(false)
  const [filter, setFilter] = useState('')

  const redirectTo = conflict => {
    window.location.href = `${baseRedirectUrl}${conflict.id}/edit`
  }

  const filterConflicts = (value) => {
    if (value.length < 2) {
      updateDisplayedConflicts(showPast, '')
      setFilter('')
      return
    }

    setFilter(value)
    updateDisplayedConflicts(showPast, value)
  }

  const updateDisplayedConflicts = (shouldShowPast, filterTerm) => {
    if (shouldShowPast) {
      setDisplayedConflicts(
        conflicts.filter(c => conflictPassesFilter(c, filterTerm))
      )
    } else {
      setDisplayedConflicts(
        conflicts.filter(c => {
          if (!conflictPassesFilter(c, filterTerm)) {
            return false
          }

          return new Date(c.start) >= new Date(Date.now())
        })
      )
    }
  }

  const conflictPassesFilter = (conflict, filterTerm) => (
    filterTerm.length == 0 || conflict.title.toLowerCase().includes(filterTerm.toLowerCase())
  )

  const togglePast = shouldShowPast => {
    setShowPast(shouldShowPast)
    updateDisplayedConflicts(shouldShowPast, filter)
  }

  useEffect(() => {
    setDisplayedConflicts(
      conflicts.filter(c => new Date(c.start) >= new Date(Date.now()))
    )
  }, [conflicts])

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 mb-2 sm:pr-4">
        <div className="flex flex-1">
          <h2 className="my-0">All</h2>
        </div>
        <div className="flex flex-row items-center space-x-4">
          <div className="flex flex-row">
            <input
              className="input-text"
              type="text"
              name="filter-by-user"
              onChange={evt => filterConflicts(evt.target.value)}
              placeholder="Filter by Member"
            />
          </div>
          <div>
            <InputToggle
              checked={showPast}
              id={'show-past-conflicts'}
              name={'show-past-conflicts'}
              onChange={() => togglePast(!showPast)}
              text={'Show Past'}
            />
          </div>
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
              color={Utilities.statusToColor(conflict.status.name)}
            />
          </li>
        })}
      </ul>
    </>
  )
}

export default ConflictList
