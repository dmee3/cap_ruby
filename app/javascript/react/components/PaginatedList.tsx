import React, { useState } from 'react'
import LoadMoreButton from './LoadMoreButton'
import EmptyState from './EmptyState'

type PaginatedListProps<T> = {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  keyFor: (item: T) => React.Key
  /** How many rows to show initially and to reveal per "load more". */
  pageSize?: number
  emptyTitle: string
  emptyBody?: string
  className?: string
}

// Client-side load-more over an already-loaded list — the dashboard hands the
// full (small) list down as JSON, this reveals it a page at a time using the
// one app-wide pager (§4.22). No fetch.
function PaginatedList<T>({
  items,
  renderItem,
  keyFor,
  pageSize = 5,
  emptyTitle,
  emptyBody,
  className = '',
}: PaginatedListProps<T>) {
  const [shown, setShown] = useState(pageSize)

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} className={className} />
  }

  const visible = items.slice(0, shown)
  const hasMore = shown < items.length
  const increment = Math.min(pageSize, items.length - shown)

  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      <ul className="flex flex-col divide-y divide-border-default">
        {visible.map((item) => (
          <li key={keyFor(item)}>{renderItem(item)}</li>
        ))}
      </ul>
      {items.length > pageSize && (
        <LoadMoreButton
          increment={increment}
          totalCount={items.length}
          hasMore={hasMore}
          onClick={() => setShown((n) => n + pageSize)}
        />
      )}
    </div>
  )
}

export default PaginatedList
