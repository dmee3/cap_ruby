import React from 'react'

export type DuesState =
  | 'on-track'
  | 'ahead'
  | 'behind'
  | 'pending'
  | 'paid-in-full'
  | 'no-schedule'

type DuesMeterProps = {
  paidCents: number
  totalCents: number
  /** PaymentSchedule#scheduled_to_date — where the "expected by today" tick sits. */
  expectedCents: number
  /** Money committed but not counted toward `paid` — past-due gap or a pending charge. */
  committedCents?: number
  committedKind?: 'past-due' | 'pending'
  state: DuesState
  showLabel?: boolean
  className?: string
}

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const STATE_METRIC_TONE: Record<Exclude<DuesState, 'no-schedule'>, string> = {
  'on-track': 'text-primary',
  ahead: 'text-success-fg',
  behind: 'text-danger-fg',
  pending: 'text-warning-fg',
  'paid-in-full': 'text-success-fg',
}

const clampPct = (n: number) => Math.max(0, Math.min(100, n))

const DuesMeter = ({
  paidCents,
  totalCents,
  expectedCents,
  committedCents = 0,
  committedKind = 'past-due',
  state,
  showLabel = true,
  className = '',
}: DuesMeterProps) => {
  if (state === 'no-schedule') {
    return (
      <p className={`text-body-sm text-secondary ${className}`.trim()}>
        No dues schedule set yet — a director will add one.
      </p>
    )
  }

  const total = Math.max(totalCents, 1)
  const paidPct = clampPct((paidCents / total) * 100)
  const expectedPct = clampPct((expectedCents / total) * 100)
  const committedPct = clampPct((committedCents / total) * 100)

  const hatch =
    committedKind === 'pending'
      ? 'repeating-linear-gradient(135deg, rgb(var(--status-warning-bg)) 0 5px, rgb(var(--status-warning-fg) / 0.4) 5px 10px)'
      : 'repeating-linear-gradient(135deg, rgb(var(--status-danger-bg)) 0 5px, rgb(var(--status-danger-fg) / 0.4) 5px 10px)'

  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      {showLabel && (
        <div className="flex items-baseline justify-between gap-2 text-body-sm">
          <span className={`font-mono tabular-nums ${STATE_METRIC_TONE[state]}`}>
            {money(paidCents)} <span className="text-secondary">/ {money(totalCents)}</span>
          </span>
          {expectedCents > 0 && state !== 'paid-in-full' && (
            <span className="text-secondary whitespace-nowrap">
              Expected by today: <span className="font-mono">{money(expectedCents)}</span>
            </span>
          )}
        </div>
      )}

      <div className="relative h-3.5 rounded-full bg-sunken border border-border-default overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-moss rounded-full"
          style={{ width: `${paidPct}%` }}
        />
        {committedPct > 0 && (
          <div
            className="absolute inset-y-0"
            data-committed={committedKind}
            style={{ left: `${paidPct}%`, width: `${committedPct}%`, background: hatch }}
          />
        )}
        {expectedPct > 0 && state !== 'paid-in-full' && (
          <div
            className="absolute -inset-y-1 w-0.5 bg-primary"
            style={{ left: `${expectedPct}%` }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  )
}

export default DuesMeter
