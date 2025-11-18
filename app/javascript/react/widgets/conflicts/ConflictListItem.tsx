import React from 'react'
import Badge from '../../components/Badge'
import Utilities from '../../../utilities/utilities'
import { ConflictAction } from './ConflictList'

type ConflictListItemProps = {
  conflict: any
  baseRedirectUrl?: string
  actions?: ConflictAction[]
}

const ConflictListItem = ({
  conflict,
  baseRedirectUrl,
  actions
}: ConflictListItemProps) => {
  const hasActions = actions && actions.length > 0
  const isClickable = !!baseRedirectUrl

  const handleConflictClick = () => {
    if (baseRedirectUrl) {
      window.location.href = `${baseRedirectUrl}${conflict.id}/edit`
    }
  }

  return (
    <li
      key={conflict.id}
      className={`flex w-full ${hasActions ? 'flex-col' : 'flex-row'} items-start ${isClickable ? 'cursor-pointer table-row-hover' : ''}`}
      onClick={isClickable ? handleConflictClick : undefined}
    >
      <div className={`flex flex-row space-x-2 items-start w-full p-4 ${hasActions ? 'pb-2' : ''}`}>
        <div className="flex flex-1 flex-col min-w-0">
          <span className="font-medium">{conflict.title}</span>
          <span className="text-sm font-light">
            {Utilities.displayDateTimeReadable(conflict.start)} to {Utilities.displayDateTimeReadable(conflict.end)}
          </span>
          <span className="text-sm text-secondary">{conflict.reason}</span>
        </div>
        <Badge
          text={conflict.status.name}
          color={Utilities.statusToColor(conflict.status.name)}
        />
      </div>
      {hasActions && (
        <div className="flex w-full justify-end space-x-2 px-4 pb-4 pt-0">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                className={action.className}
                onClick={(e) => {
                  e.stopPropagation()
                  action.onClick(conflict.id)
                }}
                aria-label={action.ariaLabel}
              >
                <Icon className="h-6 w-6" />
              </button>
            )
          })}
        </div>
      )}
    </li>
  )
}

export default ConflictListItem
