import React, { useEffect, useMemo, useState } from 'react'
import Card from '../../components/Card'
import ScheduleTimeline, { TimelineNode } from '../../components/ScheduleTimeline'
import ScheduleDiffPanel, { ScheduleDiffRow } from '../../components/ScheduleDiffPanel'
import MoneyField from '../../components/MoneyField'
import Button from '../../components/Button'
import Pill, { PillTone } from '../../components/Pill'
import { toast } from '../../components/Toast'
import Utilities from '../../../utilities/utilities'
import { dollars } from '../../../utilities/money'

type EntryStatus = 'paid' | 'due-next' | 'not-due' | 'late'

type ServerEntry = {
  id: number
  pay_date: string
  amount_cents: number
  status: EntryStatus
  days_late: number | null
  covered_on: string | null
}

export type ScheduleEditorData = {
  schedule_id: number
  season_label: string
  member: {
    id: number
    name: string
    ensemble: string | null
    section: string | null
    vet: boolean
    member_type: string
  }
  paid_cents: number
  planned_cents: number
  locked_count: number
  matches_default: boolean
  entries: ServerEntry[]
}

type Row = {
  id: number
  payDate: string
  amountCents: number | null
  originalDate: string
  originalAmount: number
  status: EntryStatus
  daysLate: number | null
  coveredOn: string | null
}

const withToken = () => ({
  'Content-Type': 'application/json',
  'X-CSRF-Token': Utilities.getAuthToken(),
})

const toRow = (e: ServerEntry): Row => ({
  id: e.id,
  payDate: e.pay_date,
  amountCents: e.amount_cents,
  originalDate: e.pay_date,
  originalAmount: e.amount_cents,
  status: e.status,
  daysLate: e.days_late,
  coveredOn: e.covered_on,
})

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })

const STATUS_TONE: Record<EntryStatus, PillTone> = {
  paid: 'success',
  late: 'danger',
  'due-next': 'warning',
  'not-due': 'neutral',
}

const statusPill = (row: Row) => {
  if (row.payDate !== row.originalDate) {
    return (
      <Pill tone="warning" casing="sentence">
        Moved from {fmt(row.originalDate)}
      </Pill>
    )
  }
  const label =
    row.status === 'paid'
      ? `Paid${row.coveredOn ? ` ${row.coveredOn}` : ''}`
      : row.status === 'late'
        ? `${row.daysLate} days late`
        : row.status === 'due-next'
          ? 'Due next'
          : 'Not due yet'
  return (
    <Pill tone={STATUS_TONE[row.status]} casing="sentence">
      {label}
    </Pill>
  )
}

const GRID = 'grid grid-cols-[44px_1fr_1fr_130px_40px] items-center gap-3'

const ScheduleEditor = ({ data }: { data: ScheduleEditorData }) => {
  const [rows, setRows] = useState<Row[]>(data.entries.map(toRow))
  const [saving, setSaving] = useState(false)
  const [diff, setDiff] = useState<ScheduleDiffRow[] | null>(null)
  const [lockedCount, setLockedCount] = useState(data.locked_count)
  const [resetMode, setResetMode] = useState<'resting' | 'confirming'>('resting')
  const [applying, setApplying] = useState(false)

  const scheduleId = data.schedule_id

  useEffect(() => {
    type ServerDiffRow = {
      pay_date: string
      from_date: string | null
      to_date: string | null
      kind: ScheduleDiffRow['kind']
      from_cents: number | null
      to_cents: number | null
      locked: boolean
    }
    fetch(`/api/admin/payment_schedules/${scheduleId}/default-preview`, {
      headers: { Accept: 'application/json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { diff: ServerDiffRow[]; locked_count: number } | null) => {
        if (!body) return
        setLockedCount(body.locked_count)
        setDiff(
          body.diff.map((row) => ({
            payDate: row.pay_date,
            fromDate: row.from_date,
            toDate: row.to_date,
            kind: row.kind,
            fromCents: row.from_cents,
            toCents: row.to_cents,
            locked: row.locked,
          })),
        )
      })
      .catch(() => setDiff(null))
  }, [scheduleId])

  const dirty = useMemo(
    () => rows.some((r) => r.payDate !== r.originalDate || r.amountCents !== r.originalAmount),
    [rows],
  )

  const plannedCents = rows.reduce((sum, r) => sum + (r.amountCents ?? 0), 0)

  const timelineNodes: TimelineNode[] = rows
    .filter((r) => r.amountCents != null)
    .map((r) => ({
      id: r.id,
      payDate: r.payDate,
      amountCents: r.amountCents as number,
      status: r.status,
    }))

  const today = new Date().toISOString().slice(0, 10)
  const movedPastDueCount = rows.filter(
    (r) => r.payDate !== r.originalDate && r.originalDate < today,
  ).length

  const setRow = (id: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const addRow = () => {
    fetch('/api/admin/payment_schedules/add-entry', {
      method: 'POST',
      headers: withToken(),
      body: JSON.stringify({ payment_schedule_id: scheduleId }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((entry: { id: number; pay_date: string; amount: number }) =>
        setRows((prev) => [
          ...prev,
          {
            id: entry.id,
            payDate: entry.pay_date,
            amountCents: entry.amount,
            originalDate: entry.pay_date,
            originalAmount: entry.amount,
            status: 'not-due',
            daysLate: null,
            coveredOn: null,
          },
        ]),
      )
      .catch(() => toast("Couldn't add a row", { variant: 'error' }))
  }

  const removeRow = (id: number) => {
    fetch('/api/admin/payment_schedules/remove-entry', {
      method: 'DELETE',
      headers: withToken(),
      body: JSON.stringify({ id }),
    })
      .then((r) => {
        if (!r.ok) throw r
        setRows((prev) => prev.filter((row) => row.id !== id))
      })
      .catch(() => toast("Couldn't remove that row", { variant: 'error' }))
  }

  const save = () => {
    if (rows.some((r) => r.amountCents == null)) {
      toast('Every row needs an amount before saving', { variant: 'error' })
      return
    }
    setSaving(true)
    fetch(`/api/admin/payment_schedules/${scheduleId}`, {
      method: 'PUT',
      headers: withToken(),
      body: JSON.stringify({
        payment_schedule: {
          id: scheduleId,
          payment_schedule_entries_attributes: rows.map((r) => ({
            id: r.id,
            pay_date: r.payDate,
            amount: r.amountCents,
          })),
        },
      }),
    })
      .then((r) => {
        if (!r.ok) throw r
        toast(
          `Schedule saved — ${rows.length} payments, ${dollars(plannedCents)} for ${data.member.name}`,
          { variant: 'success' },
        )
        window.setTimeout(() => {
          window.location.href = `/admin/users/${data.member.id}`
        }, 600)
      })
      .catch(() => {
        setSaving(false)
        toast("Couldn't save the schedule", { variant: 'error' })
      })
  }

  const applyDefault = () => {
    setApplying(true)
    fetch('/api/admin/payment_schedules/apply-default', {
      method: 'POST',
      headers: withToken(),
      body: JSON.stringify({ payment_schedule_id: scheduleId }),
    })
      .then((r) => {
        if (!r.ok) throw r
        window.location.reload()
      })
      .catch(() => {
        setApplying(false)
        setResetMode('resting')
        toast("Couldn't apply the default", { variant: 'error' })
      })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        {dirty && <span className="text-caption text-secondary">Unsaved changes</span>}
        <a
          href={`/admin/users/${data.member.id}`}
          className="ml-auto flex h-9 items-center px-3 text-body-sm font-medium text-secondary no-underline hover:text-primary"
        >
          Cancel
        </a>
        <Button variant="primary" size="md" loading={saving} onClick={save} fullWidthBelow={false}>
          Save schedule
        </Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <Card
            variant="section"
            title="How this schedule is going"
            action={
              <span className="text-body-sm text-secondary">
                {dollars(data.paid_cents)} paid of {dollars(plannedCents)} planned
              </span>
            }
          >
            <ScheduleTimeline
              nodes={timelineNodes}
              today={today}
              paidCents={data.paid_cents}
              plannedCents={plannedCents}
              movedPastDueCount={movedPastDueCount}
            />
          </Card>

          <Card
            variant="list"
            title="Schedule rows"
            count={
              data.matches_default && !dirty
                ? `Default ${data.member.member_type.toLowerCase()} schedule, unedited`
                : `${rows.length} payments · ${dollars(plannedCents)}`
            }
          >
            <div
              className={`${GRID} border-b border-border-default bg-sunken px-4 py-2.5 text-label uppercase text-secondary`}
            >
              <span>#</span>
              <span>Due date</span>
              <span>Amount</span>
              <span>Status</span>
              <span className="sr-only">Remove</span>
            </div>

            {/*
              Every row is editable, including ones already covered by a
              payment — correcting a mistyped amount or a wrong due date on a
              past installment is ordinary work. "Paid" is information, not a
              barrier. (Preserving paid entries is a property of the RESET
              action, which is separate; see ScheduleDefault.)
            */}
            <ul className="flex flex-col">
              {rows.map((row, i) => (
                <li key={row.id} className={`${GRID} border-b border-border-default px-4 py-2.5`}>
                  <span className="font-mono text-body-sm font-bold text-primary">{i + 1}</span>

                  <input
                    type="date"
                    aria-label={`Due date for payment ${i + 1}`}
                    value={row.payDate}
                    onChange={(e) => setRow(row.id, { payDate: e.target.value })}
                    className="h-10 rounded-sm border border-border-strong bg-surface px-2.5 text-body-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  />

                  <MoneyField
                    id={`entry-${row.id}`}
                    label=""
                    valueCents={row.amountCents}
                    onChangeCents={(cents) => setRow(row.id, { amountCents: cents })}
                    compact
                  />

                  {statusPill(row)}

                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    aria-label={`Remove payment ${i + 1}`}
                    className="text-body font-semibold text-danger-fg hover:opacity-70"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={addRow}
                className="h-9 rounded-sm border border-dashed border-border-strong px-3.5 text-body-sm font-semibold text-accent-primary hover:border-accent-primary"
              >
                + Add a payment date
              </button>
              <span className="ml-auto text-body-sm font-semibold text-primary">
                Total {dollars(plannedCents)}
              </span>
            </div>
          </Card>
        </div>

        <ScheduleDiffPanel
          defaultLabel={data.member.vet ? 'the vet default' : 'the new-member default'}
          rows={diff ?? []}
          lockedCount={lockedCount}
          mode={resetMode}
          onAskReset={() => setResetMode('confirming')}
          onApply={applyDefault}
          onKeep={() => setResetMode('resting')}
          applying={applying}
        />
      </div>
    </div>
  )
}

export default ScheduleEditor
