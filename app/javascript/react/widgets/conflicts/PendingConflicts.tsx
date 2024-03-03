import React, { useEffect, useState } from 'react'
import Utilities from '../../../utilities/utilities'
import Badge from '../../components/Badge'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

type PendingConflictsProps = {
  conflicts: any[],
  approveConflict: (id: number) => void,
  denyConflict: (id: number) => void
}

const PendingConflicts = ({
  conflicts,
  approveConflict,
  denyConflict
}: PendingConflictsProps) => {
  return (
    <>
      <ul className="divide-y divide-gray-300 dark:divide-gray-600">
        {conflicts.map(conflict => {
          return <li key={conflict.id} className="flex flex-col space-y-2 p-4">
            <div className="flex flex-row space-x-2 items-start">
              <div className="flex flex-1 flex-col">
                <span className="font-medium">{conflict.title}</span>
                <span className="text-sm font-light">{Utilities.displayDateTimeReadable(conflict.start)} to {Utilities.displayDateTimeReadable(conflict.end)}</span>
                <span className="text-sm text-secondary">{conflict.reason}</span>
              </div>
              <Badge
                text={conflict.status.name}
                color={Utilities.statusToColor(conflict.status.name)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button className="btn-green btn-md" onClick={() => approveConflict(conflict.id)}>
                <CheckIcon className="h-6 w-6" />
              </button>

              <button className="btn-red btn-md" onClick={() => denyConflict(conflict.id)}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </li>
        })}
      </ul>
    </>
  )
}

export default PendingConflicts
