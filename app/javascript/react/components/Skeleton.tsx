import React from 'react'

type SkeletonProps = {
  rows?: number
  className?: string
}

// Shimmer rows for loading table/list bodies.
const Skeleton = ({ rows = 4, className = '' }: SkeletonProps) => (
  <div className={`flex flex-col gap-3 ${className}`.trim()} aria-hidden="true">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="h-3.5 rounded-sm bg-sunken animate-pulse"
        style={{ width: `${[60, 90, 75, 45, 82, 68][i % 6]}%` }}
      />
    ))}
  </div>
)

export default Skeleton
