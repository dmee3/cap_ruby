import React from 'react'

export type SortDir = 'asc' | 'desc'

type SortableThProps = {
  /** The sort key this column emits, e.g. "date_paid". */
  sortKey: string
  label: string
  /** The currently-active sort key across the table. */
  activeKey: string | null
  activeDir: SortDir
  onSort: (key: string, dir: SortDir) => void
  /** Right-align numeric columns (amount). */
  align?: 'left' | 'right'
  className?: string
}

const Glyph = ({ state }: { state: 'asc' | 'desc' | 'idle' }) => {
  if (state === 'idle') {
    return (
      <svg viewBox="0 0 16 16" className="h-3 w-3 opacity-40" aria-hidden="true">
        <path d="M8 3l3 3H5zM8 13l-3-3h6z" fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
      {state === 'asc' ? (
        <path d="M8 4l4 5H4z" fill="currentColor" />
      ) : (
        <path d="M8 12L4 7h8z" fill="currentColor" />
      )}
    </svg>
  )
}

const SortableTh = ({
  sortKey,
  label,
  activeKey,
  activeDir,
  onSort,
  align = 'left',
  className = '',
}: SortableThProps) => {
  const isActive = activeKey === sortKey
  const ariaSort = isActive ? (activeDir === 'asc' ? 'ascending' : 'descending') : 'none'
  const nextDir: SortDir = isActive && activeDir === 'asc' ? 'desc' : 'asc'

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`px-4 py-2 text-label uppercase text-secondary ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className}`.trim()}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey, nextDir)}
        className={`inline-flex items-center gap-1 ${
          align === 'right' ? 'flex-row-reverse' : ''
        } ${isActive ? 'text-primary' : ''} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-sm`}
      >
        {label}
        <Glyph state={isActive ? activeDir : 'idle'} />
      </button>
    </th>
  )
}

export default SortableTh
