import React from 'react'
import Button from './Button'

export type DiffKind = 'unchanged' | 'changed' | 'added' | 'removed'

export type ScheduleDiffRow = {
  /** ISO date. */
  payDate: string
  kind: DiffKind
  fromCents: number | null
  toCents: number | null
  locked: boolean
}

type ScheduleDiffPanelProps = {
  /** Human label for the default being compared, e.g. "the vet default". */
  defaultLabel: string
  rows: ScheduleDiffRow[]
  onApply: () => void
  onKeep: () => void
  applying?: boolean
  className?: string
}

const money = (cents: number | null) =>
  cents == null ? '—' : `$${Math.round(cents / 100).toLocaleString('en-US')}`

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })

const KIND_TEXT: Record<DiffKind, string> = {
  unchanged: 'text-secondary',
  changed: 'text-primary',
  added: 'text-success-fg',
  removed: 'text-danger-fg',
}

const rowLabel = (row: ScheduleDiffRow) => {
  if (row.locked) return `${money(row.fromCents)} · paid, kept as-is`
  switch (row.kind) {
    case 'added':
      return `+ ${money(row.toCents)} added`
    case 'removed':
      return `${money(row.fromCents)} removed`
    case 'changed':
      return `${money(row.fromCents)} → ${money(row.toCents)}`
    default:
      return `${money(row.toCents)} unchanged`
  }
}

const ScheduleDiffPanel = ({
  defaultLabel,
  rows,
  onApply,
  onKeep,
  applying = false,
  className = '',
}: ScheduleDiffPanelProps) => {
  const hasChanges = rows.some((r) => r.kind !== 'unchanged' && !r.locked)

  return (
    <div
      className={`flex flex-col gap-3 rounded-md border border-border-default bg-surface p-5 ${className}`.trim()}
    >
      <div className="flex flex-col gap-1">
        <span className="text-h3 text-primary">
          {hasChanges ? `Differs from ${defaultLabel}` : `Matches ${defaultLabel}`}
        </span>
        <span className="text-body-sm text-secondary">
          Resetting only rewrites future due dates. The ones already covered by payments stay as they
          are.
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-border-default border-y border-border-default">
        {rows.map((row) => (
          <li key={row.payDate} className="flex items-center justify-between gap-3 py-2 text-body-sm">
            <span className="font-mono text-secondary">{fmt(row.payDate)}</span>
            <span className={`font-mono tabular-nums ${KIND_TEXT[row.kind]}`}>{rowLabel(row)}</span>
          </li>
        ))}
      </ul>

      {hasChanges && (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" loading={applying} onClick={onApply} fullWidthBelow={false}>
            Apply default
          </Button>
          <Button variant="secondary" size="sm" onClick={onKeep} fullWidthBelow={false}>
            Keep mine
          </Button>
        </div>
      )}
    </div>
  )
}

export default ScheduleDiffPanel
