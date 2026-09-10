import React from 'react'
import { dollars } from '../../utilities/money'

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

const verdictFor = (paidAfter: number, total: number, expected: number) => {
  if (total > 0 && paidAfter >= total) return 'Fully paid up for the season after this.'
  if (paidAfter >= expected) return 'Caught up to what’s expected by today.'
  return `Still ${dollars(expected - paidAfter)} short of what’s expected by today.`
}

// The "where this leaves them" side panel on /admin/payments/new — updates
// live as the form changes. §4.24.
const PaymentProjectionPanel = ({
  member,
  thisPaymentCents,
  className = '',
}: PaymentProjectionPanelProps) => {
  if (!member) {
    return (
      <div
        className={`flex flex-col gap-3.5 rounded-md border border-border-default bg-surface p-5 ${className}`.trim()}
      >
        <span className="text-label uppercase text-secondary">Where this leaves them</span>
        <div className="h-2.5 rounded-full bg-sunken" />
        <p className="text-body-sm text-secondary">
          Pick a member to see how this payment moves their dues.
        </p>
      </div>
    )
  }

  const paidAfter = member.paidBeforeCents + thisPaymentCents
  const stillOwed = Math.max(member.seasonTotalCents - paidAfter, 0)
  const pct =
    member.seasonTotalCents > 0
      ? Math.max(0, Math.min(100, (paidAfter / member.seasonTotalCents) * 100))
      : 0

  return (
    <div
      className={`flex flex-col gap-3.5 rounded-md border border-border-default bg-surface p-5 ${className}`.trim()}
    >
      <span className="text-label uppercase text-secondary">Where this leaves them</span>

      <div className="flex items-baseline gap-2">
        <span className="text-[20px] font-bold leading-[26px] text-primary">
          {dollars(paidAfter)} of {dollars(member.seasonTotalCents)}
        </span>
        <span className="text-body-sm text-secondary">paid</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-sunken">
        <div className="h-full rounded-full bg-moss" style={{ width: `${pct}%` }} />
      </div>

      <p className="text-caption text-success-fg">
        {verdictFor(paidAfter, member.seasonTotalCents, member.expectedCents)}
      </p>

      <dl className="flex flex-col gap-px overflow-hidden rounded-lg border border-border-default bg-border-default">
        <div className="flex justify-between bg-surface px-3 py-2.5 text-body-sm">
          <dt className="text-secondary">Paid before</dt>
          <dd className="font-mono tabular-nums text-primary">{dollars(member.paidBeforeCents)}</dd>
        </div>
        <div className="flex justify-between bg-surface px-3 py-2.5 text-body-sm">
          <dt className="text-secondary">This payment</dt>
          <dd className="font-mono font-bold tabular-nums text-success-fg">
            +{dollars(thisPaymentCents)}
          </dd>
        </div>
        <div className="flex justify-between bg-surface px-3 py-2.5 text-body-sm">
          <dt className="text-secondary">Still owed</dt>
          <dd className="font-mono tabular-nums text-primary">{dollars(stillOwed)}</dd>
        </div>
      </dl>

      <a
        href={`/admin/users/${member.id}`}
        className="text-body-sm font-semibold text-accent-primary"
      >
        Open {member.name}’s Member 360
      </a>
    </div>
  )
}

export default PaymentProjectionPanel
