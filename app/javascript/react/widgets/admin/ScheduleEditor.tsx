import React, { useEffect, useMemo, useState } from 'react'
import ScheduleTimeline, { TimelineNode } from '../../components/ScheduleTimeline'
import ScheduleDiffPanel, { ScheduleDiffRow } from '../../components/ScheduleDiffPanel'
import MoneyField from '../../components/MoneyField'
import Button from '../../components/Button'
import Pill from '../../components/Pill'
import { toast } from '../../components/Toast'
import Utilities from '../../../utilities/utilities'

type ServerEntry = {
  id: number
  pay_date: string
  amount_cents: number
  status: 'paid' | 'due-next' | 'not-due' | 'late'
  days_late: number | null
}

export type ScheduleEditorData = {
  schedule_id: number
  member: { id: number; name: string; ensemble: string | null; section: string | null; vet: boolean }
  paid_cents: number
  planned_cents: number
  entries: ServerEntry[]
}

type Row = {
  id: number
  payDate: string
  amountCents: number | null
  originalDate: string
  originalAmount: number
  status: ServerEntry['status']
  daysLate: number | null
}

const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': '' }
const withToken = () => ({ ...headers, 'X-CSRF-Token': Utilities.getAuthToken() })

const toRow = (e: ServerEntry): Row => ({
  id: e.id,
  payDate: e.pay_date,
  amountCents: e.amount_cents,
  originalDate: e.pay_date,
  originalAmount: e.amount_cents,
  status: e.status,
  daysLate: e.days_late,
})

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })

const statusPill = (row: Row) => {
  if (row.payDate !== row.originalDate) return <Pill tone="warning">Moved from {fmt(row.originalDate)}</Pill>
  switch (row.status) {
    case 'paid':
      return <Pill tone="success">Paid</Pill>
    case 'late':
      return <Pill tone="danger">{row.daysLate} days late</Pill>
    case 'due-next':
      return <Pill tone="warning">Due next</Pill>
    default:
      return <Pill tone="neutral">Not due yet</Pill>
  }
}

const ScheduleEditor = ({ data }: { data: ScheduleEditorData }) => {
  const [rows, setRows] = useState<Row[]>(data.entries.map(toRow))
  const [saving, setSaving] = useState(false)
  const [diff, setDiff] = useState<ScheduleDiffRow[] | null>(null)
  const [applying, setApplying] = useState(false)

  const scheduleId = data.schedule_id

  useEffect(() => {
    type ServerDiffRow = {
      pay_date: string
      kind: ScheduleDiffRow['kind']
      from_cents: number | null
      to_cents: number | null
      locked: boolean
    }
    fetch(`/api/admin/payment_schedules/${scheduleId}/default-preview`, {
      headers: { Accept: 'application/json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { diff: ServerDiffRow[] } | null) =>
        setDiff(
          body?.diff.map((row) => ({
            payDate: row.pay_date,
            kind: row.kind,
            fromCents: row.from_cents,
            toCents: row.to_cents,
            locked: row.locked,
          })) ?? null,
        ),
      )
      .catch(() => setDiff(null))
  }, [scheduleId])

  const dirty = useMemo(
    () =>
      rows.some(
        (r) => r.payDate !== r.originalDate || r.amountCents !== r.originalAmount || r.id < 0,
      ),
    [rows],
  )

  const timelineNodes: TimelineNode[] = rows
    .filter((r) => r.amountCents != null)
    .map((r) => ({
      id: r.id,
      payDate: r.payDate,
      amountCents: r.amountCents as number,
      status: r.payDate !== r.originalDate && r.status !== 'paid' ? 'late' : r.status,
    }))

  const movedPastDue = rows.some(
    (r) => r.payDate !== r.originalDate && r.originalDate < new Date().toISOString().slice(0, 10),
  )

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
        window.location.href = `/admin/users/${data.member.id}`
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
        toast("Couldn't apply the default", { variant: 'error' })
      })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-5">
        <div className="rounded-md border border-border-default bg-surface p-5">
          <ScheduleTimeline
            nodes={timelineNodes}
            today={new Date().toISOString().slice(0, 10)}
            paidCents={data.paid_cents}
            plannedCents={rows.reduce((sum, r) => sum + (r.amountCents ?? 0), 0)}
            datesMovedPastDue={movedPastDue}
          />
        </div>

        <div className="rounded-md border border-border-default bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-h3 text-primary">Installments</span>
            {dirty && <span className="text-caption font-semibold text-warning-fg">Unsaved changes</span>}
          </div>

          <ul className="flex flex-col gap-4">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-body-sm font-semibold text-primary">Date</span>
                  <input
                    type="date"
                    value={row.payDate}
                    onChange={(e) => setRow(row.id, { payDate: e.target.value })}
                    className="h-11 rounded-sm border border-border-strong bg-surface px-3 text-body text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  />
                </label>
                <div className="w-40">
                  <MoneyField
                    id={`entry-${row.id}`}
                    label="Amount"
                    valueCents={row.amountCents}
                    onChangeCents={(cents) => setRow(row.id, { amountCents: cents })}
                  />
                </div>
                <div className="flex items-center gap-2 pb-2.5">
                  {statusPill(row)}
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="rounded-sm px-2 py-1 text-body-sm text-danger-fg hover:bg-sunken"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap justify-between gap-2">
            <Button variant="secondary" size="md" onClick={addRow} fullWidthBelow={false}>
              Add installment
            </Button>
            <div className="flex gap-2">
              <a
                href={`/admin/users/${data.member.id}`}
                className="inline-flex h-9 items-center rounded-sm px-3 text-body-sm font-medium text-secondary hover:bg-sunken"
              >
                Cancel
              </a>
              <Button variant="primary" size="md" loading={saving} onClick={save} fullWidthBelow={false}>
                Save schedule
              </Button>
            </div>
          </div>
        </div>
      </div>

      {diff && diff.length > 0 && (
        <ScheduleDiffPanel
          defaultLabel={data.member.vet ? 'the vet default' : 'the new-member default'}
          rows={diff}
          onApply={applyDefault}
          onKeep={() => setDiff(null)}
          applying={applying}
        />
      )}
    </div>
  )
}

export default ScheduleEditor
