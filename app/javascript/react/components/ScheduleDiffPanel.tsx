import React from 'react'
import Button from './Button'
import { dollars } from '../../utilities/money'

export type DiffKind = 'unchanged' | 'changed' | 'added' | 'removed' | 'moved'

export type ScheduleDiffRow = {
  payDate: string
  fromDate: string | null
  toDate: string | null
  kind: DiffKind
  fromCents: number | null
  toCents: number | null
  locked: boolean
}

type ScheduleDiffPanelProps = {
  /** Human label for the default being compared, e.g. "the vet default". */
  defaultLabel: string
  rows: ScheduleDiffRow[]
  /** How many entries a reset leaves alone, for the reassurance line. */
  lockedCount: number
  /** `resting` offers the reset; `confirming` shows the diff and commits it. */
  mode: 'resting' | 'confirming'
  onAskReset: () => void
  onApply: () => void
  onKeep: () => void
  applying?: boolean
  className?: string
}

const fmt = (iso: string | null) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
      })
    : '—'

const COUNT_WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six']
const spellOut = (n: number) => COUNT_WORD[n] ?? String(n)

const DiffRow = ({ row }: { row: ScheduleDiffRow }) => {
  if (row.kind === 'moved') {
    return (
      <>
        <span className="font-mono text-body-sm text-secondary line-through">{fmt(row.fromDate)}</span>
        <span className="text-body-sm text-secondary">→</span>
        <span className="font-mono text-body-sm font-semibold text-primary">{fmt(row.toDate)}</span>
      </>
    )
  }
  if (row.kind === 'added') {
    return (
      <>
        <span className="font-mono text-body-sm font-semibold text-primary">+ {fmt(row.payDate)}</span>
        <span className="ml-auto text-caption text-secondary">added · {dollars(row.toCents ?? 0)}</span>
      </>
    )
  }
  if (row.kind === 'removed') {
    return (
      <>
        <span className="font-mono text-body-sm text-secondary line-through">{fmt(row.payDate)}</span>
        <span className="ml-auto text-caption text-secondary">removed</span>
      </>
    )
  }
  if (row.kind === 'changed') {
    return (
      <>
        <span className="font-mono text-body-sm text-secondary">{fmt(row.payDate)}</span>
        <span className="ml-auto font-mono text-caption text-secondary line-through">
          {dollars(row.fromCents ?? 0)}
        </span>
        <span className="text-caption text-secondary">→</span>
        <span className="font-mono text-caption font-semibold text-primary">
          {dollars(row.toCents ?? 0)}
        </span>
      </>
    )
  }
  return (
    <>
      <span className="font-mono text-body-sm text-secondary">{fmt(row.payDate)}</span>
      <span className="ml-auto text-caption text-success-fg">
        {row.locked ? 'paid, kept as-is' : 'unchanged'}
      </span>
    </>
  )
}

const ScheduleDiffPanel = ({
  defaultLabel,
  rows,
  lockedCount,
  mode,
  onAskReset,
  onApply,
  onKeep,
  applying = false,
  className = '',
}: ScheduleDiffPanelProps) => {
  const hasChanges = rows.some((r) => r.kind !== 'unchanged' && !r.locked)
  const confirming = mode === 'confirming'

  const note =
    lockedCount > 0
      ? `Resetting only rewrites future due dates. The ${spellOut(lockedCount)} already covered by payments stay as they are.`
      : 'Resetting rewrites the future due dates on this schedule.'

  return (
    <div
      className={`flex flex-col gap-3 rounded-md border bg-surface p-5 ${
        confirming ? 'border-accent-primary' : 'border-border-default'
      } ${className}`.trim()}
    >
      <span
        className={`text-label uppercase ${confirming ? 'text-accent-primary' : 'text-secondary'}`}
      >
        {confirming ? 'Reset to default?' : hasChanges ? `Differs from ${defaultLabel}` : `Matches ${defaultLabel}`}
      </span>

      {confirming && (
        <p className="text-body-sm text-secondary">
          Here’s what {defaultLabel} would change:
        </p>
      )}

      {hasChanges && (
        <ul className="flex flex-col gap-px overflow-hidden rounded-sm border border-border-default bg-border-default">
          {rows.map((row) => (
            <li key={`${row.kind}-${row.payDate}`} className="flex items-center gap-2 bg-surface px-3 py-2.5">
              <DiffRow row={row} />
            </li>
          ))}
        </ul>
      )}

      {confirming ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" loading={applying} onClick={onApply} fullWidthBelow={false}>
            Apply default
          </Button>
          <Button variant="secondary" size="sm" onClick={onKeep} fullWidthBelow={false}>
            Keep mine
          </Button>
        </div>
      ) : (
        hasChanges && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onAskReset}
            fullWidthBelow={false}
            className="self-start"
          >
            Reset to default
          </Button>
        )
      )}

      <p className="text-caption text-secondary">{note}</p>
    </div>
  )
}

export default ScheduleDiffPanel
