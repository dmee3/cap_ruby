import React, { useEffect, useState } from 'react'
import InputToggle from '../../components/inputs/InputToggle'
import ConflictListItem from './ConflictListItem'

export type ConflictAction = {
  icon: React.ComponentType<{ className?: string }>
  onClick: (id: number) => void
  className: string
  ariaLabel: string
}

type ConflictListProps = {
  conflicts: any[]
  title?: string
  baseRedirectUrl?: string
  actions?: ConflictAction[]
  showFilters?: boolean
  showHeader?: boolean
}

const ConflictList = ({
  conflicts,
  title = 'All',
  baseRedirectUrl,
  actions,
  showFilters = true,
  showHeader = true
}: ConflictListProps) => {
  const [displayedConflicts, setDisplayedConflicts] = useState([])
  const [showPast, setShowPast] = useState(false)
  const [filter, setFilter] = useState('')

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
    if (showFilters) {
      setDisplayedConflicts(
        conflicts.filter(c => new Date(c.start) >= new Date(Date.now()))
      )
    } else {
      setDisplayedConflicts(conflicts)
    }
  }, [conflicts, showFilters])

  if (conflicts.length === 0) {
    return null
  }

  return (
    <>
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 mb-2 sm:pr-4">
          <div className="flex flex-1">
            <h2 className="my-0">{title}</h2>
          </div>
          {showFilters && (
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
          )}
        </div>
      )}
      <ul className="divide-y divide-gray-300 dark:divide-gray-600">
        {displayedConflicts.map(conflict => (
          <ConflictListItem
            key={conflict.id}
            conflict={conflict}
            baseRedirectUrl={baseRedirectUrl}
            actions={actions}
          />
        ))}
      </ul>
    </>
  )
}

export default ConflictList
