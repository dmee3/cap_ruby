import React from 'react'
import { dollars } from '../../utilities/money'

export type TimelineNodeStatus = 'paid' | 'due-next' | 'not-due' | 'late'

export type TimelineNode = {
  id: number
  /** ISO date. */
  payDate: string
  amountCents: number
  status: TimelineNodeStatus
}

type ScheduleTimelineProps = {
  nodes: TimelineNode[]
  /** ISO date of today. */
  today: string
  paidCents: number
  plannedCents: number
  /** How many due dates were moved past their original date. */
  movedPastDueCount?: number
  className?: string
}

const DOT: Record<TimelineNodeStatus, string> = {
  paid: 'bg-success-fg border-surface',
  'due-next': 'bg-surface border-warning-fg',
  'not-due': 'bg-surface border-border-strong',
  late: 'bg-danger-fg border-surface',
}

const AMOUNT_TONE: Record<TimelineNodeStatus, string> = {
  paid: 'text-success-fg',
  'due-next': 'text-warning-fg',
  'not-due': 'text-secondary',
  late: 'text-danger-fg',
}

// The legend is fixed — the same three keys regardless of which statuses
// happen to be present, so the chart reads the same way every time.
const LEGEND: [TimelineNodeStatus, string][] = [
  ['paid', 'Covered by a payment'],
  ['due-next', 'Due next'],
  ['not-due', 'Not due yet'],
]

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })

/** Where a date sits along the track, 0–100. Exported for testing. */
export const positionOf = (iso: string, first: string, last: string) => {
  const t = new Date(`${iso}T00:00:00`).getTime()
  const a = new Date(`${first}T00:00:00`).getTime()
  const b = new Date(`${last}T00:00:00`).getTime()
  // A one-entry schedule has no span to place things along — centre it rather
  // than pinning it to the left edge.
  if (b === a) return 50
  return Math.max(0, Math.min(100, ((t - a) / (b - a)) * 100))
}

// Per-member, node-based — distinct from the §4.5 burndown line chart.
const ScheduleTimeline = ({
  nodes,
  today,
  paidCents,
  plannedCents,
  movedPastDueCount = 0,
  className = '',
}: ScheduleTimelineProps) => {
  const sorted = [...nodes].sort((a, b) => a.payDate.localeCompare(b.payDate))
  if (sorted.length === 0) return null

  const first = sorted[0].payDate
  const last = sorted[sorted.length - 1].payDate
  const paidPct = plannedCents > 0 ? Math.min(100, (paidCents / plannedCents) * 100) : 0
  const todayPct = positionOf(today, first, last)
  const todayInRange = today >= first && today <= last

  return (
    <div className={`flex flex-col gap-4 ${className}`.trim()}>
      {/*
        Three stacked bands rather than hand-computed offsets: a "Today"
        caption row, then the rail row, then the amounts row. The rail lives
        INSIDE the middle band and the dots are centred in that same band, so
        they line up by construction — no magic top values to drift when the
        type scale changes, and nothing can be struck through by the rail.

        Horizontally the track is inset by a 2rem gutter, because each node is
        centred on its date and the outermost two would otherwise hang half
        their width off the card.
      */}
      <div className="px-8">
        {/* Band 1 — the Today caption, above everything */}
        <div className="relative h-4">
          {todayInRange && (
            <span
              className="absolute -translate-x-1/2 whitespace-nowrap text-caption font-semibold text-primary"
              style={{ left: `${todayPct}%` }}
            >
              Today
            </span>
          )}
        </div>

        {/* Band 2 — dates, then the rail with the dots centred on it */}
        <div className="relative h-9">
          {sorted.map((node) => (
            <span
              key={`d-${node.id}`}
              className="absolute top-0 -translate-x-1/2 whitespace-nowrap font-mono text-caption font-semibold text-secondary"
              style={{ left: `${positionOf(node.payDate, first, last)}%` }}
            >
              {fmt(node.payDate)}
            </span>
          ))}

          <div className="absolute inset-x-0 bottom-1.5 h-1 rounded-full bg-sunken" />
          <div
            className="absolute bottom-1.5 left-0 h-1 rounded-full bg-moss"
            style={{ width: `${paidPct}%` }}
          />

          {todayInRange && (
            <div
              className="absolute -top-1 bottom-0 border-l border-dashed border-primary"
              style={{ left: `${todayPct}%` }}
              aria-hidden="true"
            />
          )}

          {sorted.map((node) => (
            <span
              key={`n-${node.id}`}
              className={`absolute bottom-0.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 ${DOT[node.status]}`}
              style={{ left: `${positionOf(node.payDate, first, last)}%` }}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Band 3 — amounts, clear of the rail */}
        <div className="relative h-5 pt-1.5">
          {sorted.map((node) => (
            <span
              key={`a-${node.id}`}
              className={`absolute -translate-x-1/2 whitespace-nowrap text-caption font-medium ${AMOUNT_TONE[node.status]}`}
              style={{ left: `${positionOf(node.payDate, first, last)}%` }}
            >
              {dollars(node.amountCents)}
            </span>
          ))}
        </div>
      </div>

      {movedPastDueCount > 0 ? (
        <p className="border-t border-border-default pt-3 text-body-sm text-danger-fg">
          {movedPastDueCount === 1 ? 'One due date' : `${movedPastDueCount} due dates`} went by unpaid.
          Moving {movedPastDueCount === 1 ? 'it' : 'them'} forward doesn’t erase{' '}
          {movedPastDueCount === 1 ? 'it' : 'them'}. It just changes when{' '}
          {movedPastDueCount === 1 ? "it's" : "they're"} counted as late.
        </p>
      ) : (
        <div className="flex flex-wrap gap-4 border-t border-border-default pt-3 text-caption text-secondary">
          {LEGEND.map(([status, label]) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full border-2 ${DOT[status]}`} aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default ScheduleTimeline
