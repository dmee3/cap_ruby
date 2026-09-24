import React, { useState } from 'react'
import Card from '../../components/Card'
import StatBlock from '../../components/StatBlock'
import BurndownChart, { AfterCutoff, BurndownPoint } from '../../components/BurndownChart'
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

export type DashboardWhistleblowerCoverage = {
  count: number
  threshold: number
  users_path: string
}

export type DashboardLastVenmo = {
  name: string
  amount_cents: number
  date_paid: string
  entered_days_ago: number
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
  }
  burndown: {
    scheduled: BurndownPoint[]
    actual: BurndownPoint[]
    today: string
    /** Where the collected line stops — the season's end once it has passed. */
    as_of?: string
    after_cutoff?: AfterCutoff
    currency: string
  }
  seasonLabel: string
  behindMembers: DashboardBehindMember[]
  recentPayments: DashboardRecentPayment[]
  blankScheduleMembers: DashboardBlankScheduleMember[]
  conflictsToReview: DashboardConflict[]
  whistleblowerCoverage: DashboardWhistleblowerCoverage
  lastVenmo: DashboardLastVenmo | null
  newVenmoPaymentPath: string
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

// A report is meant to reach several people so no single one decides what
// happens to it. Below the target the form silently asks for fewer picks
// instead of refusing, so the dashboard is the only place that says so.
const recipientAlertBody = (count: number, threshold: number) => {
  if (count === 0) {
    return 'Reports cannot be submitted until someone is flagged as a recipient.'
  }
  if (count < threshold) {
    return `Reports are meant to reach ${threshold} people; right now the form can only ask for ${count}.`
  }
  return `Reports reach all ${threshold}, so losing one person drops coverage below the intended ${threshold}.`
}

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

const STALE_AFTER_DAYS = 14

// The stat row's odd one out: an operational bookmark rather than a season
// metric, so it carries a name, an amount and a next action instead of one
// figure. Props arrive server-rendered with the page, so there is no loading or
// error state to draw.
const LastVenmoTile = ({
  lastVenmo,
  newPaymentPath,
}: {
  lastVenmo: DashboardLastVenmo | null
  newPaymentPath: string
}) => {
  if (lastVenmo == null) {
    return (
      <Card>
        <div className="flex flex-col gap-1.5">
          <span className="text-label uppercase text-secondary">Last Venmo entered</span>
          <span className="text-body font-semibold text-primary">No Venmo payments yet</span>
          <span className="text-caption text-secondary">
            Once you key one in, the most recent one shows here so you know where to pick up.
          </span>
          <a
            href={newPaymentPath}
            className="mt-1 text-body-sm font-semibold text-accent-primary no-underline hover:underline"
          >
            Enter a Venmo payment
          </a>
        </div>
      </Card>
    )
  }

  const stale = lastVenmo.entered_days_ago > STALE_AFTER_DAYS

  return (
    <Card tone={stale ? 'warning' : undefined} borderTone={stale}>
      <div className="flex flex-col gap-1.5">
        <span className={`text-label uppercase ${stale ? 'text-warning-fg' : 'text-secondary'}`}>
          Last Venmo entered
        </span>
        <span className="text-metric font-extrabold tabular-nums tracking-tight text-primary">
          {fmtLong(lastVenmo.date_paid)}
        </span>
        <span className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-body-sm font-semibold text-primary">{lastVenmo.name}</span>
          <span className="text-body-sm font-medium tabular-nums text-success-fg">
            {money(lastVenmo.amount_cents)}
          </span>
        </span>
        {stale && (
          <span className="text-caption text-warning-fg">
            You keyed it in {lastVenmo.entered_days_ago} days ago. There may be a backlog in Venmo.
          </span>
        )}
        <a
          href={newPaymentPath}
          className="mt-1 text-body-sm font-semibold text-accent-primary no-underline hover:underline"
        >
          Enter another Venmo payment
        </a>
      </div>
    </Card>
  )
}

const AdminDashboard = ({
  stats,
  burndown,
  seasonLabel,
  behindMembers,
  recentPayments,
  blankScheduleMembers,
  conflictsToReview,
  whistleblowerCoverage,
  lastVenmo,
  newVenmoPaymentPath,
}: AdminDashboardProps) => {
  const [range, setRange] = useState<Range>('season-to-date')
  const [dismissedScheduleAlert, setDismissedScheduleAlert] = useState(false)
  const [dismissedRecipientAlert, setDismissedRecipientAlert] = useState(false)

  const { count: wbCount, threshold: wbThreshold } = whistleblowerCoverage
  const showRecipientAlert = wbCount <= wbThreshold && !dismissedRecipientAlert

  // A past season's ranges have to hang off the season's end, not off today —
  // "last 30 days" of a season that ended in April is otherwise empty.
  const asOf = burndown.as_of ?? burndown.today
  const scheduled = sliceRange(burndown.scheduled, range, asOf)
  const actual = sliceRange(burndown.actual, range, asOf)
  // Signed: positive = behind the plan, negative = ahead of it.
  const shortfall = stats.expected_cents - stats.collected_cents

  return (
    <div className="flex flex-col gap-5">
      {blankScheduleMembers.length > 0 && !dismissedScheduleAlert && (
        <AlertBanner
          headline={`${blankScheduleMembers.length} ${
            blankScheduleMembers.length === 1 ? 'member has' : 'members have'
          } no payment schedule`}
          body="They're missing from the burndown and won't be flagged as behind."
          onDismiss={() => setDismissedScheduleAlert(true)}
          actions={blankScheduleMembers.map((m) => ({
            label: m.name,
            meta: m.meta,
            href: m.schedule_edit_path ?? '#',
          }))}
        />
      )}

      {showRecipientAlert && (
        <AlertBanner
          tone={wbCount < wbThreshold ? 'danger' : 'warning'}
          headline={
            wbCount === 0
              ? 'Nobody can receive a whistleblower report'
              : `${wbCount} ${wbCount === 1 ? 'person' : 'people'} can receive a whistleblower report`
          }
          body={recipientAlertBody(wbCount, wbThreshold)}
          onDismiss={() => setDismissedRecipientAlert(true)}
          actions={[
            {
              label: 'Whistleblower recipients',
              meta: `${wbCount} of ${wbThreshold}`,
              href: whistleblowerCoverage.users_path || '#',
              linkLabel: 'Manage users',
            },
          ]}
        />
      )}

      <div className="rounded-md border border-border-default bg-surface px-6 pb-[22px] pt-5">
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-[3px]">
            <h2 className="m-0 text-h2 font-bold tracking-tight text-primary">
              Dues collected
            </h2>
            <span className="text-body-sm text-secondary">
              {seasonLabel} · aggregated by week · through{' '}
              {fmtLong(asOf)}
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
          asOf={asOf}
          afterCutoff={burndown.after_cutoff}
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
            // Always name the gap against the plan — an unqualified "ahead"
            // sitting under the collected figure reads as if that figure were
            // the surplus.
            context={
              shortfall > 0
                ? `${money(shortfall)} short of the plan`
                : `${money(-shortfall)} ahead of the plan`
            }
            tone={shortfall > 0 ? 'warning' : 'success'}
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
        <LastVenmoTile lastVenmo={lastVenmo} newPaymentPath={newVenmoPaymentPath} />
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

const sliceRange = (series: BurndownPoint[], range: Range, asOf: string): BurndownPoint[] => {
  if (range === 'full-season' || series.length === 0) return series
  if (range === 'season-to-date') return series.filter(([d]) => d <= asOf)
  const cutoff = new Date(`${asOf}T00:00:00`)
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffIso = cutoff.toISOString().slice(0, 10)
  return series.filter(([d]) => d >= cutoffIso && d <= asOf)
}

export default AdminDashboard
