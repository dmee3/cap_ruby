import React, { useState } from 'react'
import Card from '../../components/Card'
import StatBlock from '../../components/StatBlock'
import BurndownChart, { BurndownPoint } from '../../components/BurndownChart'
import AlertBanner from '../../components/AlertBanner'
import PaginatedList from '../../components/PaginatedList'
import { StatusValue } from '../../components/StatusPill'

export type DashboardBehindMember = {
  id: number
  name: string
  section: string
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
  meta: string
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
    member_count: number
    average_days_late: number | null
  }
  burndown: {
    scheduled: BurndownPoint[]
    actual: BurndownPoint[]
    today: string
    currency: string
  }
  seasonLabel: string
  behindMembers: DashboardBehindMember[]
  recentPayments: DashboardRecentPayment[]
  blankScheduleMembers: DashboardBlankScheduleMember[]
  conflictsToReview: DashboardConflict[]
}

/** Whole dollars, no cents — headline figures never show cents. */
const money = (cents: number) =>
  `$${Math.round(cents / 100).toLocaleString('en-US')}`

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  })

const fmtLong = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  })

const rowLink =
  'flex items-center gap-3 px-4 py-3 no-underline transition hover:bg-sunken'

// Range control filters the chart client-side — all the season's data is
// already present, no refetch.
type Range = 'season-to-date' | 'full-season' | 'last-30'

const RANGES: [Range, string][] = [
  ['season-to-date', 'Season to date'],
  ['full-season', 'Full season'],
  ['last-30', 'Last 30 days'],
]

const AdminDashboard = ({
  stats,
  burndown,
  seasonLabel,
  behindMembers,
  recentPayments,
  blankScheduleMembers,
  conflictsToReview,
}: AdminDashboardProps) => {
  const [range, setRange] = useState<Range>('season-to-date')
  const [dismissedAlert, setDismissedAlert] = useState(false)

  const scheduled = sliceRange(burndown.scheduled, range, burndown.today)
  const actual = sliceRange(burndown.actual, range, burndown.today)
  const shortfall = Math.max(stats.expected_cents - stats.collected_cents, 0)

  return (
    <div className="flex flex-col gap-5">
      {blankScheduleMembers.length > 0 && !dismissedAlert && (
        <AlertBanner
          headline={`${blankScheduleMembers.length} ${
            blankScheduleMembers.length === 1 ? 'member has' : 'members have'
          } no payment schedule`}
          body="They're missing from the burndown and won't be flagged as behind."
          onDismiss={() => setDismissedAlert(true)}
          actions={blankScheduleMembers.map((m) => ({
            label: m.name,
            meta: m.meta,
            href: m.schedule_edit_path ?? '#',
          }))}
        />
      )}

      <div className="rounded-md border border-border-default bg-surface px-6 pb-[22px] pt-5">
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-[3px]">
            <h2 className="m-0 text-h2 font-bold tracking-tight text-primary">
              Dues collected against plan
            </h2>
            <span className="text-body-sm text-secondary">
              {seasonLabel} · every member&rsquo;s own schedule, summed weekly · through{' '}
              {fmtLong(burndown.today)}
            </span>
          </div>

          <div
            className="ml-auto flex gap-[3px] rounded-[8px] border border-border-default bg-sunken p-[3px]"
            role="group"
            aria-label="Chart range"
          >
            {RANGES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                aria-pressed={range === value}
                className={
                  range === value
                    ? 'rounded-sm border border-border-default bg-surface px-3 py-1.5 text-body-sm font-semibold text-primary'
                    : 'rounded-sm px-3 py-1.5 text-body-sm font-medium text-secondary hover:text-primary'
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <BurndownChart
          scheduled={scheduled}
          actual={actual}
          today={burndown.today}
          currency={burndown.currency}
          showCaption={false}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <StatBlock
            kicker="Expected by today"
            metric={money(stats.expected_cents)}
            context="Summed from every member's own schedule"
          />
        </Card>
        <Card>
          <StatBlock
            kicker="Collected so far"
            metric={money(stats.collected_cents)}
            context={
              shortfall > 0 ? `${money(shortfall)} short of the plan` : 'Ahead of the plan'
            }
            tone="success"
          />
        </Card>
        <Card tone={statTone(stats.behind_count)} borderTone={stats.behind_count > 0}>
          <StatBlock
            kicker="Members behind"
            metric={String(stats.behind_count)}
            context={`of ${stats.member_count}`}
            threshold={stats.behind_count}
          />
        </Card>
        <Card>
          <StatBlock
            kicker="Average days late"
            metric={stats.average_days_late == null ? '—' : `${stats.average_days_late} days`}
            context={
              stats.average_days_late == null
                ? 'Everyone current'
                : 'Across every past due date this season'
            }
          />
        </Card>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_1fr_1fr]">
        <Card
          variant="list"
          title="Behind on payments"
          count={`${behindMembers.length} ${behindMembers.length === 1 ? 'member' : 'members'}`}
          action={
            <a
              href="/admin/users"
              className="text-body-sm font-semibold text-accent-primary no-underline hover:underline"
            >
              View all members
            </a>
          }
        >
          {behindMembers.length > 0 && (
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-3 border-b border-border-default bg-sunken px-4 py-2.5 text-label uppercase text-secondary">
              <span>Member</span>
              <span className="text-right">Paid</span>
              <span className="text-right">Season total</span>
              <span className="text-right">Past due</span>
            </div>
          )}
          <PaginatedList
            items={behindMembers}
            keyFor={(m) => m.id}
            emptyIcon={<CheckBadge />}
            emptyTitle="Everyone's caught up"
            emptyBody={`All ${stats.member_count} members have paid everything due so far this season.`}
            caption={(shown, total) =>
              shown === total ? `Showing all ${total}` : `${shown} of ${total}`
            }
            renderItem={(m) => (
              <a
                href={`/admin/users/${m.id}`}
                className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-3 px-4 py-3 no-underline transition hover:bg-sunken"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-body-sm font-semibold text-accent-primary">
                    {m.name}
                  </span>
                  {m.section && <span className="truncate text-caption text-secondary">{m.section}</span>}
                </span>
                <span className="text-right font-mono text-body-sm text-primary">
                  {money(m.paid_cents)}
                </span>
                <span className="text-right font-mono text-body-sm text-primary">
                  {money(m.season_total_cents)}
                </span>
                <span className="text-right font-mono text-body-sm font-bold text-danger-fg">
                  {money(m.past_due_cents)}
                </span>
              </a>
            )}
          />
        </Card>

        <Card
          variant="list"
          title="Recent payments"
          action={
            <a
              href="/admin/payments"
              className="text-body-sm font-semibold text-accent-primary no-underline hover:underline"
            >
              All payments
            </a>
          }
        >
          <PaginatedList
            items={recentPayments}
            keyFor={(p) => p.id}
            loadIncrement={10}
            emptyTitle="Nothing in the last 30 days"
            emptyBody="Manual and card payments show up here as they're recorded."
            caption={(shown, total) => `${shown} of ${total} this season`}
            renderItem={(p) => (
              <a href={`/admin/users/${p.user_id}`} className={rowLink}>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body-sm font-semibold text-accent-primary">
                    {p.name}
                  </span>
                  <span className="truncate text-caption text-secondary">
                    {p.payment_type} · {fmtDate(p.date_paid)}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-body-sm font-semibold text-success-fg">
                  +{money(p.amount_cents)}
                </span>
              </a>
            )}
          />
        </Card>

        <Card
          variant="list"
          title="Conflicts to review"
          count={`${conflictsToReview.length} waiting`}
          action={
            <a
              href="/admin/conflicts"
              className="text-body-sm font-semibold text-accent-primary no-underline hover:underline"
            >
              All conflicts
            </a>
          }
        >
          <PaginatedList
            items={conflictsToReview}
            keyFor={(c) => c.id}
            captionOnly
            emptyTitle="No conflicts waiting"
            emptyBody="Pending rehearsal conflicts needing a decision land here."
            caption={(shown, total) => `Soonest first · ${shown} of ${total}`}
            renderItem={(c) => (
              <a
                href="/admin/conflicts"
                className="flex flex-col gap-[5px] px-4 py-3 no-underline transition hover:bg-sunken"
              >
                <span className="flex items-baseline gap-2">
                  <span className="truncate text-body-sm font-semibold text-accent-primary">
                    {c.member}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-caption text-secondary">
                    {c.date_range_label}
                  </span>
                </span>
                <span className="text-caption text-secondary">
                  {[c.time_range_label, c.reason].filter(Boolean).join(' · ') || c.relative_subline}
                </span>
              </a>
            )}
          />
        </Card>
      </div>
    </div>
  )
}

const CheckBadge = () => (
  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-bg text-body font-bold text-success-fg">
    ✓
  </span>
)

const statTone = (behindCount: number) => {
  if (behindCount <= 0) return 'success' as const
  if (behindCount < 5) return 'warning' as const
  return 'danger' as const
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
