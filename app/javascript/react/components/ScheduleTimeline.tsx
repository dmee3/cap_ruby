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

/** Where a date sits along the track, 0–100. */
const positionOf = (iso: string, first: string, last: string) => {
  const t = new Date(`${iso}T00:00:00`).getTime()
  const a = new Date(`${first}T00:00:00`).getTime()
  const b = new Date(`${last}T00:00:00`).getTime()
  if (b === a) return 0
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
    <div className={`flex flex-col gap-3 ${className}`.trim()}>
      <div className="relative h-14">
        <div className="absolute inset-x-0 top-[26px] h-1 rounded-full bg-sunken" />
        <div
          className="absolute left-0 top-[26px] h-1 rounded-full bg-moss"
          style={{ width: `${paidPct}%` }}
        />

        {todayInRange && (
          <>
            <div
              className="absolute bottom-0 top-3.5 border-l border-dashed border-primary"
              style={{ left: `${todayPct}%` }}
              aria-hidden="true"
            />
            <span
              className="absolute top-0 -translate-x-1/2 text-caption font-semibold text-primary"
              style={{ left: `${todayPct}%` }}
            >
              Today
            </span>
          </>
        )}

        {sorted.map((node) => (
          <span
            key={node.id}
            className="absolute top-3 flex -translate-x-1/2 flex-col items-center gap-1"
            style={{ left: `${positionOf(node.payDate, first, last)}%` }}
          >
            <span className="font-mono text-caption font-semibold text-secondary">
              {fmt(node.payDate)}
            </span>
            <span className={`h-3 w-3 rounded-full border-2 ${DOT[node.status]}`} aria-hidden="true" />
            <span className={`text-caption font-medium ${AMOUNT_TONE[node.status]}`}>
              {dollars(node.amountCents)}
            </span>
          </span>
        ))}
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
