import React, { useState } from 'react'
import Button from '../../../components/Button'
import Field, { TextInput } from '../../../components/Field'
import MoneyField from '../../../components/MoneyField'
import ValidationSummaryCard from '../../../components/ValidationSummaryCard'
import { toast } from '../../../components/Toast'
import { dollars } from '../../../../utilities/money'
import { Combination, ENSEMBLE_NAMES, OVERVIEW_PATH, Overview, editPath, plural } from './shared'
import { jsonHeaders } from '../../../../utilities/api'
import { monthDayYear, weekday } from '../../../../utilities/dates'

export type EditDefaultData = { overview: Overview; slug: string }

type Row = { key: number; payDate: string; amountCents: number | null }
type RowError = { index: number | null; message: string }

let nextKey = 0
const toRows = (c: Combination): Row[] =>
  c.entries.map(e => ({ key: nextKey++, payDate: e.pay_date, amountCents: e.amount_cents }))

const fourWeeksAfter = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + 28)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const whoFor = (c: Combination) =>
  `${ENSEMBLE_NAMES[c.ensemble] ?? c.ensemble} members in ${
    c.section_group === 'Visual' ? 'the Visual section' : 'any section except Visual'
  } who ${c.vet_status === 'Vet' ? 'marched an earlier season' : 'are in their first season'}.`

const EditDefault = ({ data }: { data: EditDefaultData }) => {
  const year = data.overview.season.year
  const combination = data.overview.combinations.find(c => c.slug === data.slug)!
  const [rows, setRows] = useState<Row[]>(() => toRows(combination))
  const [errors, setErrors] = useState<RowError[]>([])
  const [saving, setSaving] = useState(false)

  const total = rows.reduce((sum, r) => sum + (r.amountCents ?? 0), 0)
  const rowError = (i: number) => errors.find(e => e.index === i)?.message

  const setRow = (key: number, patch: Partial<Row>) =>
    setRows(current => current.map(r => (r.key === key ? { ...r, ...patch } : r)))

  const addRow = () =>
    setRows(current => {
      const last = current[current.length - 1]
      return [
        ...current,
        { key: nextKey++, payDate: last?.payDate ? fourWeeksAfter(last.payDate) : '', amountCents: last?.amountCents ?? null },
      ]
    })

  const save = () => {
    setSaving(true)
    fetch(`/api/admin/default-schedules/${combination.slug}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify({
        entries: rows.map(r => ({ pay_date: r.payDate, amount_cents: r.amountCents })),
      }),
    })
      .then(async r => {
        const body = await r.json().catch(() => ({}))
        if (r.ok) {
          // Stays "saving" until the overview loads, so it can't be sent twice.
          window.location.assign(OVERVIEW_PATH)
          return
        }
        if (Array.isArray(body.errors)) {
          setErrors(body.errors)
        } else {
          toast("Couldn't save this default. Nothing changed — try again.", { variant: 'error' })
        }
        setSaving(false)
      })
      .catch(() => {
        toast("Couldn't save this default. Nothing changed — try again.", { variant: 'error' })
        setSaving(false)
      })
  }

  const subtitle = [
    `Default for ${plural(combination.member_count, 'member')}`,
    combination.last_changed_on ? `last changed ${monthDayYear(combination.last_changed_on)}` : 'not set up yet',
  ].join(' · ')

  return (
    <div className="flex flex-col gap-4">
      <a href={OVERVIEW_PATH} className="text-body-sm font-medium text-accent-primary no-underline hover:underline">
        ‹ Default schedules
      </a>
      <div className="flex flex-col gap-1">
        <h1 className="m-0">
          {combination.label}, {year}
        </h1>
        <span className="text-body-sm text-secondary">{subtitle}</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-hidden rounded-md border border-border-default bg-surface">
          {combination.member_count > 0 && (
            <div className="flex flex-col gap-0.5 border-b border-border-default border-l-[3px] border-l-ocean bg-ocean-lightest/10 px-4 py-3.5">
              <span className="text-body-sm font-semibold text-primary">Saving changes the default only</span>
              <span className="text-body-sm text-secondary">
                The {plural(combination.member_count, 'member')} on {combination.label} keep the schedules they have.
                To move someone onto this version, open them in Member 360 and use Reset to default.
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2 px-4 py-4 sm:px-5">
            <ValidationSummaryCard
              lead="This default wasn't saved."
              errors={errors.map((e, i) => ({
                fieldId: `error-${i}`,
                message: e.index == null ? e.message : `Payment ${e.index + 1}: ${e.message}`,
              }))}
            />
            {rows.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border-strong px-4 py-6 text-center">
                <span className="text-body font-semibold">No payments yet</span>
                <span className="max-w-[420px] text-body-sm text-secondary">
                  Add the first due date and amount. Until this has at least one, the{' '}
                  {plural(combination.member_count, 'member')} on {combination.label} have nothing to pay toward.
                </span>
                <Button variant="secondary" onClick={addRow}>
                  + Add first payment
                </Button>
              </div>
            ) : (
              <>
                <div className="hidden grid-cols-[28px_minmax(0,1fr)_minmax(0,1fr)_44px] gap-3 pb-1 text-label uppercase text-secondary sm:grid">
                  <span />
                  <span>Due date</span>
                  <span>Amount</span>
                  <span />
                </div>
                <ol className="m-0 flex list-none flex-col gap-2 p-0">
                  {rows.map((row, i) => {
                    const message = rowError(i)
                    return (
                      <li key={row.key} className="flex flex-col gap-1">
                        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-2 sm:grid-cols-[28px_minmax(0,1fr)_minmax(0,1fr)_44px] sm:gap-3">
                          <span className="hidden font-mono text-body-sm text-secondary sm:block">{i + 1}</span>
                          <div className="relative">
                            <TextInput
                              type="date"
                              aria-label={`Due date for payment ${i + 1}`}
                              value={row.payDate}
                              onChange={e => setRow(row.key, { payDate: e.target.value })}
                              controlSize="sm"
                              mono
                              invalid={Boolean(message)}
                              className="w-full"
                            />
                            {row.payDate && (
                              <span className="pointer-events-none absolute right-9 top-1/2 hidden -translate-y-1/2 text-caption text-secondary sm:inline">
                                {weekday(row.payDate)}
                              </span>
                            )}
                          </div>
                          <Field label={`Amount for payment ${i + 1}`} id={`amount-${row.key}`} hideLabel>
                            <MoneyField
                              label=""
                              compact
                              valueCents={row.amountCents}
                              onChangeCents={cents => setRow(row.key, { amountCents: cents })}
                            />
                          </Field>
                          <button
                            type="button"
                            aria-label={`Remove payment ${i + 1}`}
                            title="Remove payment"
                            onClick={() => setRows(current => current.filter(r => r.key !== row.key))}
                            className="flex h-10 items-center justify-center rounded-sm text-secondary hover:bg-danger-bg hover:text-danger-fg focus-visible:outline-none focus-visible:ring-2"
                          >
                            ✕
                          </button>
                        </div>
                        {message && <span className="text-caption text-danger-fg sm:pl-10">{message}</span>}
                      </li>
                    )
                  })}
                </ol>
                <button
                  type="button"
                  onClick={addRow}
                  className="mt-1 flex h-10 items-center justify-center rounded-sm border border-dashed border-border-strong text-body-sm font-semibold text-accent-primary hover:border-ocean hover:bg-sunken sm:ml-10"
                >
                  + Add payment
                </button>
                <div className="mt-2 flex items-center justify-between rounded-md bg-sunken px-3 py-3 sm:pl-10">
                  <span className="text-body-sm font-semibold">Total · {plural(rows.length, 'payment')}</span>
                  <span className="font-mono text-h3 font-bold">{dollars(total)}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border-default px-4 py-4 sm:flex-row sm:px-5">
            <Button size="lg" loading={saving} onClick={save}>
              Save default
            </Button>
            <a
              href={OVERVIEW_PATH}
              className="inline-flex h-11 items-center justify-center rounded-md border border-border-strong bg-surface px-4 text-body font-semibold text-primary no-underline hover:bg-sunken"
            >
              Cancel
            </a>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="flex flex-col gap-2.5 rounded-md border border-border-default bg-surface p-4">
            <h2 className="m-0 text-label uppercase text-secondary">Who this is for</h2>
            <p className="m-0 text-body-sm">{whoFor(combination)}</p>
            <span className="text-body-sm font-semibold">
              {plural(combination.member_count, 'member')} in {year}
            </span>
          </section>
          <nav aria-label={`Other ${year} defaults`} className="overflow-hidden rounded-md border border-border-default bg-surface">
            <h2 className="m-0 border-b border-border-default px-4 py-3 text-label uppercase text-secondary">
              Other {year} defaults
            </h2>
            <ul className="m-0 list-none p-0">
              {data.overview.combinations.map(c => {
                const current = c.slug === combination.slug
                return (
                  <li key={c.slug} className="border-b border-page last:border-b-0">
                    <a
                      href={editPath(c.slug)}
                      aria-current={current ? 'page' : undefined}
                      className={`flex items-center gap-2 px-4 py-2 text-body-sm no-underline hover:bg-sunken ${current ? 'bg-ocean-lightest/10 font-bold text-accent-primary' : 'font-medium text-primary'}`}
                    >
                      <span className="flex-1">{c.label}</span>
                      <span className={`font-mono text-caption ${c.set_up ? 'text-secondary' : 'text-warning-fg'}`}>
                        {c.set_up ? dollars(c.total_cents) : 'Not set up'}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  )
}

export default EditDefault
