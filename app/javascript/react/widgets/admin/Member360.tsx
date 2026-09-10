import React, { useState } from 'react'
import Card from '../../components/Card'
import Member360Header from '../../components/Member360Header'
import { DuesState } from '../../components/DuesMeter'
import ConflictContextRow from '../../components/ConflictContextRow'
import { StatusValue } from '../../components/StatusPill'
import Pill, { PillTone } from '../../components/Pill'
import AlertBanner from '../../components/AlertBanner'
import EmptyState from '../../components/EmptyState'
import Button from '../../components/Button'
import { DeletedPill } from '../../components/deletedRow'
import Utilities from '../../../utilities/utilities'
import { dollars } from '../../../utilities/money'
import { typeTone, isMachineRecorded } from '../../../utilities/payment_type'

type DuesSummary = {
  state: 'no_schedule' | 'paid_in_full' | 'behind' | 'ahead' | 'on_track'
  paid: number
  total: number
  expected: number
  past_due: number
}

type EntryStatus = 'paid' | 'late' | 'due-next' | 'not-due'

type ScheduleEntry = {
  id: number
  pay_date: string
  amount_cents: number
  covered: boolean
  status: EntryStatus
  status_label: string
}

type PaymentRowModel = {
  id: number
  amount_cents: number
  date_paid: string | null
  payment_type: string
  notes: string | null
  deleted: boolean
  edit_href: string
  restore_href: string
}

type ConflictRow = {
  id: number
  date_range_label: string
  time_range_label?: string
  status: StatusValue
  relative_subline: string
}

export type Member360Data = {
  season_label: string
  identity: {
    id: number
    name: string
    first_name: string
    username: string
    email: string
    phone: string | null
    ensemble: string | null
    section: string | null
    role: string | null
    vet: boolean
    member_type: string
  }
  dues: DuesSummary
  roles_by_season: {
    year: string
    ensemble: string | null
    section: string | null
    role: string | null
    current: boolean
  }[]
  schedule: { id: number | null; total_cents: number; entries: ScheduleEntry[] }
  schedule_setup_href: string | null
  payment_rows: PaymentRowModel[]
  payments_summary: { count: number; total_cents: number }
  conflict_rows: ConflictRow[]
  conflicts_count: number
  fundraiser: { raised_cents: number; dates_covered: number; dates_target: number }
}

const DUES_STATE: Record<DuesSummary['state'], DuesState> = {
  no_schedule: 'no-schedule',
  paid_in_full: 'paid-in-full',
  behind: 'behind',
  ahead: 'ahead',
  on_track: 'on-track',
}

const ENTRY_TONE: Record<EntryStatus, PillTone> = {
  paid: 'success',
  late: 'danger',
  'due-next': 'warning',
  'not-due': 'neutral',
}

const fmtDate = (iso: string | null) =>
  iso ? Utilities.displayDate(Utilities.dateWithTZ(iso)) : '—'

const Member360 = ({ data, csrfToken }: { data: Member360Data; csrfToken: string }) => {
  const { identity, dues, schedule } = data
  const [restoring, setRestoring] = useState<number | null>(null)
  const [restoredIds, setRestoredIds] = useState<Set<number>>(new Set())
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const scheduleHref = data.schedule_setup_href ?? '#'
  const variant: 'on-track' | 'past-due' | 'no-schedule' =
    dues.state === 'no_schedule' ? 'no-schedule' : dues.past_due > 0 ? 'past-due' : 'on-track'

  const tags = [
    [identity.ensemble, identity.section].filter(Boolean).join(' / '),
    identity.member_type,
    identity.role,
  ].filter(Boolean) as string[]

  const restore = (row: PaymentRowModel) => {
    setRestoring(row.id)
    fetch(row.restore_href, { method: 'PUT', headers: { 'X-CSRF-Token': csrfToken } })
      .then((r) => {
        if (!r.ok) throw r
        setRestoredIds((prev) => {
          const next = new Set(prev)
          next.add(row.id)
          return next
        })
        setDeletedIds((prev) => {
          const next = new Set(prev)
          next.delete(row.id)
          return next
        })
      })
      .catch(() => undefined)
      .finally(() => setRestoring(null))
  }

  const destroy = (row: PaymentRowModel) => {
    setRestoring(row.id)
    fetch(`/admin/payments/${row.id}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken },
    })
      .then((r) => {
        if (!r.ok) throw r
        setDeletedIds((prev) => {
          const next = new Set(prev)
          next.add(row.id)
          return next
        })
        setConfirmDelete(null)
      })
      .catch(() => undefined)
      .finally(() => setRestoring(null))
  }

  // Same in-place confirm as the payments list — the row stays visible while
  // you decide, and a soft delete is reversible from the Restore that replaces
  // these actions.
  const rowActions = (p: PaymentRowModel, stillDeleted: boolean) => {
    if (stillDeleted) {
      return (
        <button
          type="button"
          onClick={() => restore(p)}
          disabled={restoring === p.id}
          className="font-medium text-accent-primary underline disabled:opacity-50"
        >
          Restore
        </button>
      )
    }

    if (isMachineRecorded(p.payment_type)) {
      return <span className="text-secondary">{p.payment_type}</span>
    }

    if (confirmDelete === p.id) {
      return (
        <>
          <span className="text-secondary">Delete?</span>
          <button
            type="button"
            onClick={() => destroy(p)}
            disabled={restoring === p.id}
            className="font-semibold text-danger-fg underline disabled:opacity-50"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(null)}
            className="font-medium text-secondary underline"
          >
            No
          </button>
        </>
      )
    }

    return (
      <>
        <a href={p.edit_href} className="font-medium text-accent-primary underline">
          Edit
        </a>
        <button
          type="button"
          onClick={() => setConfirmDelete(p.id)}
          className="font-medium text-danger-fg underline"
        >
          Delete
        </button>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-5">
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
          headline={`${identity.first_name} has no payment schedule`}
          body={
            dues.paid > 0
              ? `${dollars(dues.paid)} has been credited against the default new-member schedule. Set a real one so the due dates and the burndown include ${identity.first_name}.`
              : `Set one up so the due dates and the burndown include ${identity.first_name}.`
          }
          actions={[{ label: 'No schedule on file', href: scheduleHref, linkLabel: 'Set up schedule' }]}
        />
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.35fr]">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <Card
            variant="list"
            title="Roles by season"
            count={`${data.roles_by_season.length} ${
              data.roles_by_season.length === 1 ? 'season' : 'seasons'
            }`}
          >
            {data.roles_by_season.length === 0 ? (
              <EmptyState title="No member seasons on file" />
            ) : (
              <ul className="flex flex-col">
                {data.roles_by_season.map((r) => (
                  <li
                    key={r.year}
                    className={`flex flex-col gap-1 border-b border-border-default px-4 py-3 last:border-0 ${
                      r.current ? 'bg-sunken' : ''
                    }`}
                  >
                    <span className="flex items-baseline gap-2">
                      <span
                        className={`text-body-sm text-primary ${r.current ? 'font-bold' : 'font-semibold'}`}
                      >
                        {r.year}
                      </span>
                      {r.current && (
                        <Pill tone="neutral" className="text-accent-primary">
                          Current
                        </Pill>
                      )}
                    </span>
                    <span className="text-body-sm text-secondary">
                      {[[r.ensemble, r.section].filter(Boolean).join(' / '), r.current ? r.role : null]
                        .filter(Boolean)
                        .join(' · ') || 'Unassigned'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            variant="list"
            title="Payment schedule"
            action={
              <a
                href={scheduleHref}
                className="text-body-sm font-semibold text-accent-primary no-underline hover:underline"
              >
                {schedule.entries.length > 0 ? 'Edit' : 'Set up'}
              </a>
            }
          >
            {schedule.entries.length === 0 ? (
              <EmptyState
                title="No schedule yet"
                body="Start from the new-member default, or write their own dates and amounts."
                action={
                  <a href={scheduleHref} className="no-underline">
                    <Button variant="primary" size="md" fullWidthBelow={false}>
                      Use default schedule
                    </Button>
                  </a>
                }
              />
            ) : (
              <>
                <ul className="flex flex-col">
                  {schedule.entries.map((e) => (
                    <li
                      key={e.id}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-border-default px-4 py-2.5"
                    >
                      <span className="font-mono text-body-sm text-secondary">{fmtDate(e.pay_date)}</span>
                      <span className="text-right font-mono text-body-sm text-primary">
                        {dollars(e.amount_cents)}
                      </span>
                      <Pill tone={ENTRY_TONE[e.status]} casing="sentence">
                        {e.status_label}
                      </Pill>
                    </li>
                  ))}
                </ul>
                <div className="flex items-baseline justify-between bg-sunken px-4 py-3">
                  <span className="text-body-sm font-semibold text-primary">Season total</span>
                  <span className="font-mono text-body-sm font-bold text-primary">
                    {dollars(schedule.total_cents)}
                  </span>
                </div>
              </>
            )}
          </Card>

          {data.fundraiser.raised_cents > 0 && (
            <Card variant="list" title="Calendar fundraiser">
              <p className="px-4 py-3 text-body-sm text-secondary">
                <span className="font-mono font-semibold text-primary">
                  {dollars(data.fundraiser.raised_cents)}
                </span>{' '}
                raised · {data.fundraiser.dates_covered} of {data.fundraiser.dates_target} calendar
                dates covered. Tracked separately from dues.
              </p>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <Card
            variant="list"
            title="Payments"
            count={`${data.payments_summary.count} this season · ${dollars(
              data.payments_summary.total_cents,
            )}`}
            action={
              <a
                href="/admin/payments"
                className="text-body-sm font-semibold text-accent-primary no-underline hover:underline"
              >
                All payments
              </a>
            }
          >
            {data.payment_rows.length === 0 ? (
              <EmptyState title="No payments yet" body="Manual and card payments show up here." />
            ) : (
              <ul className="flex flex-col">
                {data.payment_rows.map((p) => {
                  const stillDeleted =
                    (p.deleted || deletedIds.has(p.id)) && !restoredIds.has(p.id)
                  return (
                    <li
                      key={p.id}
                      className={`flex items-center gap-3 border-b border-border-default px-4 py-3 last:border-0 ${
                        stillDeleted ? 'bg-sunken/40' : ''
                      }`}
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex items-center gap-2">
                          <span
                            className={`font-mono text-body-sm font-semibold ${
                              stillDeleted ? 'text-secondary line-through' : 'text-primary'
                            }`}
                          >
                            {dollars(p.amount_cents)}
                          </span>
                          <span className={stillDeleted ? 'line-through' : ''}>
                            <Pill tone={typeTone(p.payment_type)}>{p.payment_type}</Pill>
                          </span>
                          {stillDeleted && <DeletedPill />}
                        </span>
                        <span className="truncate text-caption text-secondary">
                          {[fmtDate(p.date_paid), p.notes].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-baseline gap-2.5 text-body-sm">
                        {rowActions(p, stillDeleted)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card
            variant="list"
            title="Conflicts"
            count={`${data.season_label} · ${data.conflicts_count}`}
          >
            {data.conflict_rows.length === 0 ? (
              <EmptyState
                title="No conflicts this season"
                body={`${identity.first_name} hasn't submitted any. Members submit their own; coordinators can't add them here.`}
              />
            ) : (
              <div className="flex flex-col">
                {data.conflict_rows.map((c) => (
                  <ConflictContextRow
                    key={c.id}
                    className="border-b border-border-default px-4 last:border-0"
                    dateRangeLabel={c.date_range_label}
                    timeRangeLabel={c.time_range_label}
                    status={c.status}
                    relativeSubline={c.relative_subline}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Member360
