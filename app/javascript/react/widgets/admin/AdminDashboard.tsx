import React, { useState } from 'react'
import Card from '../../components/Card'
import StatBlock from '../../components/StatBlock'
import BurndownChart, { BurndownPoint } from '../../components/BurndownChart'
import AlertBanner from '../../components/AlertBanner'
import PaginatedList from '../../components/PaginatedList'
import PaymentRow, { PaymentMethod } from '../../components/PaymentRow'
import ConflictContextRow from '../../components/ConflictContextRow'
import Pill from '../../components/Pill'
import { StatusValue } from '../../components/StatusPill'

export type DashboardBehindMember = {
  id: number
  name: string
  paid_cents: number
  season_total_cents: number
  past_due_cents: number
}

export type DashboardRecentPayment = {
  id: number
  name: string
  user_id: number
  amount_cents: number
  date_paid: string
  payment_type: string
}

export type DashboardBlankScheduleMember = {
  name: string
  section: string | null
  schedule_edit_path: string | null
}

export type DashboardConflict = {
  id: number
  member: string
  date_range_label: string
  time_range_label?: string
  status: StatusValue
  relative_subline: string
  reason?: string
}

type AdminDashboardProps = {
  stats: {
    expected_cents: number
    collected_cents: number
    behind_count: number
    average_days_late: number | null
  }
  burndown: {
    scheduled: BurndownPoint[]
    actual: BurndownPoint[]
    today: string
    currency: string
  }
  behindMembers: DashboardBehindMember[]
  recentPayments: DashboardRecentPayment[]
  blankScheduleMembers: DashboardBlankScheduleMember[]
  conflictsToReview: DashboardConflict[]
}

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`

const asMethod = (name: string): PaymentMethod => {
  if (name === 'Stripe' || name.startsWith('Square')) return 'Card'
  if (name === 'Venmo' || name === 'Cash' || name === 'Check') return name
  return 'Other'
}

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })

// Range control filters the chart client-side — all the season's data is
// already present, no refetch.
type Range = 'season-to-date' | 'full-season' | 'last-30'

const AdminDashboard = ({
  stats,
  burndown,
  behindMembers,
  recentPayments,
  blankScheduleMembers,
  conflictsToReview,
}: AdminDashboardProps) => {
  const [range, setRange] = useState<Range>('season-to-date')
  const [dismissedAlert, setDismissedAlert] = useState(false)

  const scheduled = sliceRange(burndown.scheduled, range, burndown.today)
  const actual = sliceRange(burndown.actual, range, burndown.today)

  return (
    <div className="flex flex-col gap-4">
      {blankScheduleMembers.length > 0 && !dismissedAlert && (
        <AlertBanner
          headline={`${blankScheduleMembers.length} ${
            blankScheduleMembers.length === 1 ? 'member has' : 'members have'
          } no payment schedule`}
          body="They're missing from the burndown and won't be flagged as behind."
          onDismiss={() => setDismissedAlert(true)}
          actions={blankScheduleMembers.map((m) => ({
            label: [m.name, m.section].filter(Boolean).join(' · '),
            href: m.schedule_edit_path ?? '#',
          }))}
        />
      )}

      <Card
        title="Dues collected against plan"
        action={
          <div className="flex gap-1" role="group" aria-label="Chart range">
            {(
              [
                ['season-to-date', 'Season to date'],
                ['full-season', 'Full season'],
                ['last-30', 'Last 30 days'],
              ] as [Range, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                aria-pressed={range === value}
                className={`rounded-sm px-2 py-1 text-caption ${
                  range === value ? 'bg-sunken font-semibold text-primary' : 'text-secondary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        <BurndownChart
          scheduled={scheduled}
          actual={actual}
          today={burndown.today}
          currency={burndown.currency}
        />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <StatBlock kicker="Expected to date" metric={money(stats.expected_cents)} />
        </Card>
        <Card>
          <StatBlock
            kicker="Collected"
            metric={money(stats.collected_cents)}
            context={`of ${money(stats.expected_cents)} expected`}
            tone={stats.collected_cents >= stats.expected_cents ? 'success' : 'warning'}
          />
        </Card>
        <Card>
          <StatBlock
            kicker="Members behind"
            metric={String(stats.behind_count)}
            threshold={stats.behind_count}
          />
        </Card>
        <Card>
          <StatBlock
            kicker="Avg days late"
            metric={stats.average_days_late == null ? '—' : `${stats.average_days_late} days`}
            context={stats.average_days_late == null ? 'Everyone current' : 'across past-due installments'}
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Who's behind">
          <PaginatedList
            items={behindMembers}
            keyFor={(m) => m.id}
            emptyTitle="Everyone's caught up"
            emptyBody="No member is behind their payment schedule right now."
            renderItem={(m) => (
              <a
                href={`/admin/users/${m.id}`}
                className="flex items-center justify-between gap-3 py-3 no-underline hover:bg-sunken"
              >
                <span className="text-body-sm font-semibold text-primary">{m.name}</span>
                <Pill tone="danger">{money(m.past_due_cents)} past due</Pill>
              </a>
            )}
          />
        </Card>

        <Card title="Recent payments">
          <PaginatedList
            items={recentPayments}
            keyFor={(p) => p.id}
            emptyTitle="Nothing in the last 30 days"
            emptyBody="Manual and card payments show up here as they're recorded."
            renderItem={(p) => (
              <PaymentRow
                variant="paid"
                date={`${fmtDate(p.date_paid)} · ${p.name}`}
                amountCents={p.amount_cents}
                method={asMethod(p.payment_type)}
                subline={p.payment_type}
              />
            )}
          />
        </Card>

        <Card title="Conflicts to review">
          <PaginatedList
            items={conflictsToReview}
            keyFor={(c) => c.id}
            emptyTitle="No conflicts waiting"
            emptyBody="Pending rehearsal conflicts needing a decision land here."
            renderItem={(c) => (
              <ConflictContextRow
                dateRangeLabel={`${c.member} · ${c.date_range_label}`}
                timeRangeLabel={c.time_range_label}
                status={c.status}
                relativeSubline={c.relative_subline}
                reason={c.reason}
              />
            )}
          />
        </Card>
      </div>
    </div>
  )
}

const sliceRange = (series: BurndownPoint[], range: Range, today: string): BurndownPoint[] => {
  if (range === 'full-season' || series.length === 0) return series
  if (range === 'season-to-date') return series.filter(([d]) => d <= today)
  const cutoff = new Date(`${today}T00:00:00`)
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffIso = cutoff.toISOString().slice(0, 10)
  return series.filter(([d]) => d >= cutoffIso && d <= today)
}

export default AdminDashboard
