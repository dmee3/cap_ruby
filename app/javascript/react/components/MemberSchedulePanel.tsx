import React from 'react'
import Card from './Card'
import Pill from './Pill'
import { dollars } from '../../utilities/money'

export type ScheduleInstallment = {
  pay_date: string
  amount_cents: number
  paid: boolean
}

type MemberSchedulePanelProps = {
  memberName: string
  scheduleId: number | null
  installments: ScheduleInstallment[]
  /** Cents about to be recorded — highlights the rows it will land against. */
  pendingCents: number
  className?: string
}

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  })

/**
 * Which unpaid installments the pending amount will cover, oldest first —
 * mirrors how a payment actually credits against the schedule.
 */
const coveredByPending = (installments: ScheduleInstallment[], pendingCents: number) => {
  const covered = new Set<string>()
  let left = pendingCents
  for (const i of installments) {
    if (i.paid) continue
    if (left <= 0) break
    covered.add(i.pay_date)
    left -= i.amount_cents
  }
  return covered
}

const MemberSchedulePanel = ({
  memberName,
  scheduleId,
  installments,
  pendingCents,
  className = '',
}: MemberSchedulePanelProps) => {
  if (installments.length === 0) return null

  const pending = coveredByPending(installments, pendingCents)
  const total = installments.reduce((sum, i) => sum + i.amount_cents, 0)

  return (
    <Card
      variant="list"
      title={`${memberName}’s schedule`}
      action={
        scheduleId && (
          <a
            href={`/admin/payment_schedules/${scheduleId}/edit`}
            className="text-body-sm font-semibold text-accent-primary no-underline hover:underline"
          >
            Edit
          </a>
        )
      }
      className={className}
    >
      <ul className="flex flex-col">
        {installments.map((i) => {
          const isPending = pending.has(i.pay_date)
          return (
            <li
              key={i.pay_date}
              className={`flex items-center gap-3 border-b border-border-default px-4 py-2.5 ${
                isPending ? 'bg-accent-primary/5 shadow-[inset_3px_0_0] shadow-accent-primary' : ''
              }`}
            >
              <span
                className={`font-mono text-body-sm ${
                  isPending ? 'font-semibold text-primary' : 'text-secondary'
                }`}
              >
                {fmt(i.pay_date)}
              </span>
              <span
                className={`font-mono text-body-sm ${
                  isPending ? 'font-semibold text-primary' : 'text-secondary'
                }`}
              >
                {dollars(i.amount_cents)}
              </span>
              <span className="ml-auto">
                {i.paid ? (
                  <Pill tone="success" casing="sentence">
                    Paid
                  </Pill>
                ) : isPending ? (
                  <Pill tone="neutral" casing="sentence" className="text-accent-primary">
                    Covers this
                  </Pill>
                ) : null}
              </span>
            </li>
          )
        })}
      </ul>
      <div className="flex items-baseline justify-between bg-sunken px-4 py-2.5">
        <span className="text-body-sm font-semibold text-primary">Season total</span>
        <span className="font-mono text-body-sm font-bold text-primary">{dollars(total)}</span>
      </div>
    </Card>
  )
}

export default MemberSchedulePanel
