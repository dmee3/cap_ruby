import React from 'react'
import Card from '../../components/Card'
import Member360Header from '../../components/Member360Header'
import { DuesState } from '../../components/DuesMeter'
import PaymentRow, { PaymentMethod } from '../../components/PaymentRow'
import ConflictContextRow from '../../components/ConflictContextRow'
import { StatusValue } from '../../components/StatusPill'
import Pill from '../../components/Pill'
import AlertBanner from '../../components/AlertBanner'
import EmptyState from '../../components/EmptyState'
import { deletedRowClass, DeletedPill, RestoreAction } from '../../components/deletedRow'
import Utilities from '../../../utilities/utilities'

type DuesSummary = {
  state: 'no_schedule' | 'paid_in_full' | 'behind' | 'ahead' | 'on_track'
  paid: number
  total: number
  expected: number
  past_due: number
}

type ScheduleEntry = { id: number; pay_date: string; amount_cents: number; covered: boolean }

type PaymentRowModel = {
  id: number
  amount_cents: number
  date_paid: string | null
  payment_type: string
  notes: string | null
  deleted: boolean
}

type ConflictRow = {
  id: number
  date_range_label: string
  time_range_label?: string
  status: StatusValue
  relative_subline: string
  reason?: string
}

export type Member360Data = {
  season_label: string
  identity: {
    id: number
    name: string
    username: string
    email: string
    phone: string | null
    ensemble: string | null
    section: string | null
    role: string | null
    vet: boolean
  }
  dues: DuesSummary
  roles_by_season: { year: string; ensemble: string | null; section: string | null; current: boolean }[]
  schedule: { id: number | null; total_cents: number; entries: ScheduleEntry[] }
  payment_rows: PaymentRowModel[]
  conflict_rows: ConflictRow[]
  conflicts_count: number
  fundraiser: { raised_cents: number; dates_covered: number; dates_target: number }
}

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const DUES_STATE: Record<DuesSummary['state'], DuesState> = {
  no_schedule: 'no-schedule',
  paid_in_full: 'paid-in-full',
  behind: 'behind',
  ahead: 'ahead',
  on_track: 'on-track',
}

const asMethod = (name: string): PaymentMethod => {
  if (name === 'Stripe' || name.startsWith('Square')) return 'Card'
  if (name === 'Venmo' || name === 'Cash' || name === 'Check') return name
  return 'Other'
}

const fmtDate = (iso: string | null) =>
  iso ? Utilities.displayDate(Utilities.dateWithTZ(iso)) : '—'

const Member360 = ({ data, csrfToken }: { data: Member360Data; csrfToken: string }) => {
  const { identity, dues, schedule } = data
  const [restoring, setRestoring] = React.useState<number | null>(null)
  const [restoredIds, setRestoredIds] = React.useState<Set<number>>(new Set())

  const scheduleHref = schedule.id ? `/admin/payment_schedules/${schedule.id}/edit` : '#'
  const variant: 'on-track' | 'past-due' | 'no-schedule' =
    dues.state === 'no_schedule' ? 'no-schedule' : dues.past_due > 0 ? 'past-due' : 'on-track'

  const tags = [
    identity.section && identity.ensemble ? `${identity.ensemble} · ${identity.section}` : null,
    identity.vet ? 'Vet' : 'New member',
    identity.role === 'member' ? 'Member' : identity.role,
  ].filter(Boolean) as string[]

  const restore = (id: number) => {
    setRestoring(id)
    fetch(`/admin/payments/restore/${id}`, {
      method: 'PUT',
      headers: { 'X-CSRF-Token': csrfToken },
    })
      .then((r) => {
        if (!r.ok) throw r
        setRestoredIds((prev) => new Set(prev).add(id))
      })
      .catch(() => undefined)
      .finally(() => setRestoring(null))
  }

  return (
    <div className="flex flex-col gap-4">
      <Member360Header
        name={identity.name}
        username={identity.username}
        email={identity.email}
        seasonLabel={data.season_label}
        tags={tags}
        dues={{
          paidCents: dues.paid,
          totalCents: dues.total,
          expectedCents: dues.expected,
          pastDueCents: dues.past_due,
          state: DUES_STATE[dues.state],
        }}
        conflictsCount={data.conflicts_count}
        variant={variant}
        scheduleHref={scheduleHref}
      />

      {dues.state === 'no_schedule' && (
        <AlertBanner
          headline={`${identity.name} has no payment schedule`}
          body={
            dues.paid > 0
              ? `${money(dues.paid)} has been credited against the default new-member schedule. Set a real one so the due dates and the burndown include ${identity.name}.`
              : 'Set one up so the due dates and the burndown include them.'
          }
          actions={
            schedule.id
              ? [{ label: `${identity.name}'s schedule`, href: scheduleHref }]
              : []
          }
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Roles by season">
          {data.roles_by_season.length === 0 ? (
            <EmptyState title="No member seasons on file" />
          ) : (
            <ul className="flex flex-col divide-y divide-border-default">
              {data.roles_by_season.map((r) => (
                <li key={r.year} className="flex items-center justify-between gap-3 py-2 text-body-sm">
                  <span className="text-primary">
                    {r.year} — {[r.ensemble, r.section].filter(Boolean).join(' · ') || 'Unassigned'}
                  </span>
                  {r.current && <Pill tone="success">Current</Pill>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Payment schedule"
          action={
            schedule.id && (
              <a href={scheduleHref} className="text-body-sm font-semibold text-accent-primary">
                Edit schedule
              </a>
            )
          }
        >
          {schedule.entries.length === 0 ? (
            <EmptyState
              title="No schedule yet"
              body="A director sets the installment plan for the season."
            />
          ) : (
            <>
              <p className="mb-2 text-body-sm text-secondary">Total {money(schedule.total_cents)}</p>
              <ul className="flex flex-col divide-y divide-border-default">
                {schedule.entries.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 py-2 text-body-sm"
                  >
                    <span className="font-mono text-secondary">{fmtDate(e.pay_date)}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-primary">{money(e.amount_cents)}</span>
                      {e.covered && <Pill tone="success">Covered</Pill>}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card title="Payments">
          {data.payment_rows.length === 0 ? (
            <EmptyState title="No payments yet" body="Manual and card payments show up here." />
          ) : (
            <ul className="flex flex-col divide-y divide-border-default">
              {data.payment_rows.map((p) => {
                const stillDeleted = p.deleted && !restoredIds.has(p.id)
                return (
                  <li
                    key={p.id}
                    className={`flex items-center justify-between gap-3 ${deletedRowClass(stillDeleted)}`}
                  >
                    <div className="flex-1">
                      <PaymentRow
                        variant="paid"
                        date={fmtDate(p.date_paid)}
                        amountCents={p.amount_cents}
                        method={asMethod(p.payment_type)}
                        subline={stillDeleted ? undefined : p.payment_type}
                      />
                    </div>
                    {stillDeleted && (
                      <span className="flex shrink-0 items-center gap-2 pr-3">
                        <DeletedPill />
                        <RestoreAction onRestore={() => restore(p.id)} pending={restoring === p.id} />
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card title="Conflicts">
          {data.conflict_rows.length === 0 ? (
            <EmptyState title="No conflicts this season" />
          ) : (
            <div className="flex flex-col divide-y divide-border-default">
              {data.conflict_rows.map((c) => (
                <ConflictContextRow
                  key={c.id}
                  dateRangeLabel={c.date_range_label}
                  timeRangeLabel={c.time_range_label}
                  status={c.status}
                  relativeSubline={c.relative_subline}
                  reason={c.reason}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {data.fundraiser.raised_cents > 0 && (
        <Card title="Calendar fundraiser">
          <p className="text-body-sm text-secondary">
            <span className="font-mono tabular-nums text-primary">
              {money(data.fundraiser.raised_cents)}
            </span>{' '}
            raised · {data.fundraiser.dates_covered} of {data.fundraiser.dates_target} calendar dates
            covered. Tracked separately from dues.
          </p>
        </Card>
      )}
    </div>
  )
}

export default Member360
