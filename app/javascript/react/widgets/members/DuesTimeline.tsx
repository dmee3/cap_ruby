import React, { useState } from 'react'
import PaymentRow, { PaymentMethod } from '../../components/PaymentRow'
import EmptyState from '../../components/EmptyState'
import Button from '../../components/Button'
import { exact } from '../../../utilities/money'

export type TimelineRow = {
  kind: 'paid' | 'upcoming' | 'past-due'
  date: string
  amount_cents: number
  method?: string
  subline?: string
  installment_chip?: string
}

type DuesTimelineProps = {
  paid: TimelineRow[]
  upcoming: TimelineRow[]
}

const PAID_METHODS = new Set<PaymentMethod>(['Card', 'Venmo', 'Cash', 'Check', 'Other'])
const asMethod = (name?: string): PaymentMethod | undefined => {
  if (name === 'Stripe') return 'Card'
  if (name && PAID_METHODS.has(name as PaymentMethod)) return name as PaymentMethod
  return 'Other'
}

const Section = ({ label, right }: { label: string; right?: string }) => (
  <div className="flex items-center justify-between bg-sunken px-4 py-2 text-caption font-semibold uppercase tracking-wide text-secondary">
    <span>{label}</span>
    {right && <span className="font-mono tabular-nums normal-case tracking-normal">{right}</span>}
  </div>
)

const DuesTimeline = ({ paid, upcoming }: DuesTimelineProps) => {
  const [showAllPaid, setShowAllPaid] = useState(false)
  const paidTotal = paid.reduce((sum, r) => sum + r.amount_cents, 0)
  const visiblePaid = showAllPaid ? paid : paid.slice(-3)

  if (paid.length === 0 && upcoming.length === 0) {
    return (
      <EmptyState
        title="Nothing scheduled yet"
        body="Once a director sets your dues schedule, your installments and payments show up here."
      />
    )
  }

  return (
    <div className="flex flex-col">
      {upcoming.length > 0 && (
        <>
          <Section label="Coming up" />
          {upcoming.map((r, i) => (
            <div key={`u-${i}`} className="border-b border-border-default last:border-0">
              <PaymentRow
                variant={r.kind === 'past-due' ? 'past-due' : 'upcoming'}
                date={r.date}
                amountCents={r.amount_cents}
                installmentChip={r.installment_chip}
                subline={r.subline}
              />
            </div>
          ))}
        </>
      )}

      {paid.length > 0 && (
        <>
          <Section label="Paid" right={exact(paidTotal)} />
          {visiblePaid.map((r, i) => (
            <div key={`p-${i}`} className="border-b border-border-default last:border-0">
              <PaymentRow
                variant="paid"
                date={r.date}
                amountCents={r.amount_cents}
                method={asMethod(r.method)}
                subline={r.subline}
              />
            </div>
          ))}
          {paid.length > 3 && !showAllPaid && (
            <Button
              variant="ghost"
              tone="accent"
              className="!h-auto !rounded-none border-t border-border-default py-2.5"
              onClick={() => setShowAllPaid(true)}
            >
              Show all {paid.length} payments
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export default DuesTimeline
