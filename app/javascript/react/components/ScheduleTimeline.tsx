import React from 'react'

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
  /** Show the "dates moved past due" caption. */
  datesMovedPastDue?: boolean
  className?: string
}

const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`

const STATUS_DOT: Record<TimelineNodeStatus, string> = {
  paid: 'bg-success-fg',
  'due-next': 'bg-warning-fg',
  'not-due': 'bg-border-strong',
  late: 'bg-danger-fg',
}

const STATUS_LABEL: Record<TimelineNodeStatus, string> = {
  paid: 'Paid',
  'due-next': 'Due next',
  'not-due': 'Not due yet',
  late: 'Late',
}

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })

// Per-member, node-based — distinct from the §4.5 burndown line chart.
const ScheduleTimeline = ({
  nodes,
  today,
  paidCents,
  plannedCents,
  datesMovedPastDue = false,
  className = '',
}: ScheduleTimelineProps) => {
  const sorted = [...nodes].sort((a, b) => a.payDate.localeCompare(b.payDate))
  const usedStatuses = Array.from(new Set(sorted.map((n) => n.status)))

  return (
    <div className={`flex flex-col gap-3 ${className}`.trim()}>
      <div className="flex flex-wrap items-baseline gap-x-2 text-body-sm">
        <span className="font-semibold text-primary">
          {money(paidCents)} paid of {money(plannedCents)} planned
        </span>
      </div>

      <ol className="flex gap-1 overflow-x-auto pb-2">
        {sorted.map((node) => {
          const isNextAfterToday = node.payDate >= today && node.status !== 'paid'
          return (
            <li
              key={node.id}
              className="flex min-w-[64px] flex-1 flex-col items-center gap-1 text-center"
            >
              <span className="font-mono text-caption text-secondary">{fmt(node.payDate)}</span>
              <span className={`h-3 w-3 rounded-full ${STATUS_DOT[node.status]}`} aria-hidden="true" />
              <span className="font-mono text-caption text-primary">{money(node.amountCents)}</span>
              <span className="text-caption text-secondary">{STATUS_LABEL[node.status]}</span>
              {isNextAfterToday && <span className="text-caption font-semibold text-warning-fg">Today ▸</span>}
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap gap-3 text-caption text-secondary">
        {usedStatuses.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[s]}`} aria-hidden="true" />
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>

      {datesMovedPastDue && (
        <p className="text-caption text-secondary">
          Two due dates went by unpaid. Moving them forward doesn’t erase them — it just changes when
          they’re counted as late.
        </p>
      )}
    </div>
  )
}

export default ScheduleTimeline
