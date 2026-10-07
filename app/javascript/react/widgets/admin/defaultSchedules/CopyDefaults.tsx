import React, { useMemo, useState } from 'react'
import Button from '../../../components/Button'
import { dollars } from '../../../../utilities/money'
import { DefaultEntry, OVERVIEW_PATH, Overview, jsonHeaders, plural, shortDate, weekday } from './shared'

export type SourceSeason = {
  id: number
  year: string
  combinations: { slug: string; label: string; entries: DefaultEntry[]; total_cents: number }[]
}

export type CopyDefaultsData = { overview: Overview; sources: SourceSeason[] }

const MINUS = '−'
const MAX_WEEKS = 104

const shift = (iso: string, weeks: number) => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + weeks * 7)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const weeksLabel = (weeks: number) =>
  `${weeks >= 0 ? '+' : MINUS}${Math.abs(weeks)} ${Math.abs(weeks) === 1 ? 'week' : 'weeks'}`

// "$500 + 5 × $360" when a default is one payment then equal ones, which is how
// every season so far has been built; otherwise just the count.
const shape = (entries: DefaultEntry[]) => {
  const [first, ...rest] = entries
  if (rest.length > 0 && rest.every(e => e.amount_cents === rest[0].amount_cents)) {
    return `${dollars(first.amount_cents)} + ${rest.length} × ${dollars(rest[0].amount_cents)}`
  }
  return plural(entries.length, 'payment')
}

const FormRow = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
    <div className="flex flex-col gap-0.5 sm:w-[150px] sm:flex-none sm:pt-2.5">
      <span className="text-body-sm font-semibold text-primary">{label}</span>
      {hint && <span className="text-caption text-secondary">{hint}</span>}
    </div>
    <div className="flex flex-1 flex-col gap-2">{children}</div>
  </div>
)

const CopyDefaults = ({ data }: { data: CopyDefaultsData }) => {
  const { overview, sources } = data
  const year = overview.season.year
  const [sourceId, setSourceId] = useState(overview.copy_source?.id ?? sources[0]?.id)
  const [weeks, setWeeks] = useState(52)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const source = sources.find(s => s.id === sourceId)
  const existing = new Set(overview.combinations.filter(c => c.set_up).map(c => c.slug))
  const toCopy = source ? source.combinations.filter(c => !existing.has(c.slug)) : []
  const kept = overview.combinations.filter(c => c.set_up)

  const dates = useMemo(
    () => [...new Set(toCopy.flatMap(c => c.entries.map(e => e.pay_date)))].sort(),
    [toCopy]
  )
  const shared = toCopy.every(c => c.entries.length === dates.length)

  if (!source) {
    return (
      <p className="m-0 rounded-md border border-border-default bg-surface p-5 text-body-sm text-secondary">
        No other season has defaults to copy from. <a href={OVERVIEW_PATH}>Back to {year} defaults</a>
      </p>
    )
  }

  const submit = () => {
    setSaving(true)
    setError(null)
    fetch('/api/admin/default-schedules/copy', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ source_season_id: source.id, shift_weeks: weeks }),
    })
      .then(async r => {
        if (r.ok) {
          window.location.assign(OVERVIEW_PATH)
          return
        }
        const body = await r.json().catch(() => ({}))
        setError(body.error ?? "Couldn't copy the defaults. Nothing was created — try again.")
        setSaving(false)
      })
      .catch(() => {
        setError("Couldn't copy the defaults. Nothing was created — try again.")
        setSaving(false)
      })
  }

  const stepButton =
    'flex w-11 items-center justify-center bg-sunken text-h3 text-secondary hover:bg-page disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset'

  return (
    <div className="flex flex-col gap-4">
      <a href={OVERVIEW_PATH} className="text-body-sm font-medium text-accent-primary no-underline hover:underline">
        ‹ Default schedules
      </a>
      <h1 className="m-0">Copy defaults into {year}</h1>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5 rounded-md border border-border-default bg-surface p-4 sm:p-5">
          <FormRow label="Copy from">
            <select
              aria-label="Copy from"
              className="h-11 rounded-sm border border-border-strong bg-surface px-3 text-body"
              value={sourceId}
              onChange={e => setSourceId(Number(e.target.value))}
            >
              {sources.map(s => (
                <option key={s.id} value={s.id}>
                  {s.year} season · {plural(s.combinations.length, 'default')}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow label="Move dates by" hint="Amounts copy unchanged">
            <div className="flex w-[220px] items-stretch overflow-hidden rounded-sm border border-border-strong">
              <button
                type="button"
                aria-label="One week earlier"
                className={`${stepButton} border-r border-border-default`}
                disabled={weeks <= -MAX_WEEKS}
                onClick={() => setWeeks(w => w - 1)}
              >
                {MINUS}
              </button>
              <output aria-live="polite" className="flex h-11 flex-1 items-center justify-center font-mono text-body">
                {weeksLabel(weeks)}
              </output>
              <button
                type="button"
                aria-label="One week later"
                className={`${stepButton} border-l border-border-default`}
                disabled={weeks >= MAX_WEEKS}
                onClick={() => setWeeks(w => w + 1)}
              >
                +
              </button>
            </div>
            {dates[0] && (
              <span className="text-caption text-success-fg">
                Every due date stays on the same weekday: {weekday(dates[0])} {shortDate(dates[0])} becomes{' '}
                {weekday(shift(dates[0], weeks))} {shortDate(shift(dates[0], weeks))}.
              </span>
            )}
          </FormRow>

          <FormRow label={`Into ${year}`} hint={kept.length > 0 ? `${kept.length} of 8 already set up` : undefined}>
            <span className="text-body-sm text-secondary sm:pt-0.5">
              {kept.length === 0
                ? `Nothing is set up yet, so all ${toCopy.length} are created. You can edit any of them afterwards.`
                : toCopy.length === 0
                  ? `${year} already has every default ${source.year} has. Edit them from the overview.`
                  : `Only the ${plural(toCopy.length, 'missing default')} ${toCopy.length === 1 ? 'is' : 'are'} created. Your ${kept.length} ${year} ${kept.length === 1 ? 'version stays' : 'versions stay'} as they are.`}
            </span>
          </FormRow>

          {error && (
            <p role="alert" className="m-0 text-body-sm text-danger-fg">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 border-t border-border-default pt-4 sm:flex-row">
            <Button size="lg" loading={saving} disabled={toCopy.length === 0} onClick={submit}>
              Create {plural(toCopy.length, 'default')} for {year}
            </Button>
            <a
              href={OVERVIEW_PATH}
              className="inline-flex h-11 items-center justify-center rounded-md border border-border-strong bg-surface px-4 text-body font-semibold text-primary no-underline hover:bg-sunken"
            >
              Cancel
            </a>
          </div>
          <span className="text-caption text-secondary sm:hidden">No member&rsquo;s schedule changes.</span>
        </div>

        <div className="flex flex-col gap-4">
          <section className="overflow-hidden rounded-md border border-border-default bg-surface" aria-label="Dates">
            <div className="flex items-baseline border-b border-border-default px-4 py-3">
              <span className="text-label uppercase text-secondary">Dates</span>
              <span className="ml-auto text-caption text-secondary">
                {shared ? `Same for all ${toCopy.length}` : `Across ${plural(toCopy.length, 'default')}`}
              </span>
            </div>
            <table className="w-full border-collapse font-mono text-body-sm">
              <thead>
                <tr className="border-b border-border-default bg-sunken text-left font-sans text-label uppercase text-secondary">
                  <th scope="col" className="px-4 py-2 font-semibold">{source.year}</th>
                  <th scope="col" className="w-6" aria-label="becomes" />
                  <th scope="col" className="px-4 py-2 font-semibold">{year}</th>
                </tr>
              </thead>
              <tbody>
                {dates.map(d => (
                  <tr key={d} className="border-b border-page">
                    <td className="px-4 py-2 text-secondary">
                      {shortDate(d)} {weekday(d)}
                    </td>
                    <td className="font-sans text-border-strong" aria-hidden="true">→</td>
                    <td className="px-4 py-2 font-semibold">
                      {shortDate(shift(d, weeks))} {weekday(shift(d, weeks))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <details open className="group overflow-hidden rounded-md border border-border-default bg-surface">
            <summary className="flex cursor-pointer list-none items-baseline px-4 py-3">
              <span className="text-label uppercase text-secondary">Amounts</span>
              <span className="ml-auto text-caption text-secondary">Unchanged</span>
            </summary>
            <ul className="m-0 list-none border-t border-border-default p-0">
              {overview.combinations.map(c => {
                const copied = toCopy.find(t => t.slug === c.slug)
                const shown = copied ?? c
                return (
                  <li
                    key={c.slug}
                    className={`flex flex-wrap items-center gap-x-2.5 gap-y-0.5 border-b border-page px-4 py-2 ${copied || kept.length === 0 ? '' : 'text-secondary'}`}
                  >
                    <span className="flex-1 text-body-sm font-medium">{c.label}</span>
                    {kept.length > 0 && (
                      <span className={`text-caption ${copied ? 'text-success-fg' : 'text-secondary'}`}>
                        {copied ? `Copied from ${source.year}` : c.set_up ? `Keeps ${year} version` : 'Not in source'}
                      </span>
                    )}
                    {kept.length === 0 && copied && (
                      <span className="font-mono text-caption text-secondary">{shape(copied.entries)}</span>
                    )}
                    <span className="w-16 text-right font-mono text-body-sm font-semibold">
                      {shown.entries.length ? dollars(shown.total_cents) : '–'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </details>
        </div>
      </div>
    </div>
  )
}

export default CopyDefaults
