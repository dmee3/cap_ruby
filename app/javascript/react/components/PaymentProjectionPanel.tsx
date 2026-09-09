import React from 'react'
import DuesMeter, { DuesState } from './DuesMeter'

type ProjectionMember = {
  id: number
  name: string
  paidBeforeCents: number
  seasonTotalCents: number
  expectedCents: number
}

type PaymentProjectionPanelProps = {
  /** Null renders the no-member-selected placeholder. */
  member: ProjectionMember | null
  thisPaymentCents: number
  className?: string
}

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const projectedState = (paidAfter: number, total: number, expected: number): DuesState => {
  if (paidAfter >= total) return 'paid-in-full'
  if (paidAfter < expected) return 'behind'
  if (paidAfter > expected) return 'ahead'
  return 'on-track'
}

// The "where this leaves them" side panel on /admin/payments/new — updates live
// as the form changes. §4.24.
const PaymentProjectionPanel = ({
  member,
  thisPaymentCents,
  className = '',
}: PaymentProjectionPanelProps) => {
  if (!member) {
    return (
      <div
        className={`flex flex-col gap-3 rounded-md border border-border-default bg-surface p-5 ${className}`.trim()}
      >
        <span className="text-label uppercase text-secondary">Where this leaves them</span>
        <div className="h-3.5 rounded-full bg-sunken" />
        <p className="text-body-sm text-secondary">
          Pick a member to see how this payment moves their dues.
        </p>
      </div>
    )
  }

  const paidAfter = member.paidBeforeCents + thisPaymentCents
  const stillOwed = Math.max(member.seasonTotalCents - paidAfter, 0)
  const state = projectedState(paidAfter, member.seasonTotalCents, member.expectedCents)

  const verdict =
    stillOwed === 0
      ? 'Fully paid up for the season after this.'
      : paidAfter >= member.expectedCents
        ? 'Caught up to what’s expected by today.'
        : `Still ${money(member.expectedCents - paidAfter)} short of what’s expected by today.`

  return (
    <div
      className={`flex flex-col gap-4 rounded-md border border-border-default bg-surface p-5 ${className}`.trim()}
    >
      <span className="text-label uppercase text-secondary">Where this leaves them</span>

      <DuesMeter
        paidCents={paidAfter}
        totalCents={member.seasonTotalCents}
        expectedCents={member.expectedCents}
        state={state}
        showLabel={false}
      />

      <dl className="flex flex-col gap-1 text-body-sm">
        <div className="flex justify-between">
          <dt className="text-secondary">Paid before</dt>
          <dd className="font-mono tabular-nums text-primary">{money(member.paidBeforeCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-secondary">This payment</dt>
          <dd className="font-mono tabular-nums text-success-fg">+{money(thisPaymentCents)}</dd>
        </div>
        <div className="flex justify-between border-t border-border-default pt-1">
          <dt className="text-secondary">Still owed</dt>
          <dd className="font-mono tabular-nums font-semibold text-primary">{money(stillOwed)}</dd>
        </div>
      </dl>

      <p className="text-body-sm text-secondary">{verdict}</p>

      <a href={`/admin/users/${member.id}`} className="text-body-sm font-semibold text-accent-primary">
        Open {member.name}’s Member 360
      </a>
    </div>
  )
}

export default PaymentProjectionPanel
