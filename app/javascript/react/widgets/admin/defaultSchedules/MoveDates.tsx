import React, { useState } from 'react'
import Button from '../../../components/Button'
import Pill from '../../../components/Pill'
import { Combination, OVERVIEW_PATH, Overview, jsonHeaders, plural, shortDate, weekday } from './shared'

// "All 8 defaults", or for a date only some pay on, "4 of 8 · Visual".
const usedBy = (users: Combination[], all: Combination[]) => {
  if (users.length === all.length) return `All ${all.length} defaults`
  const shared = (key: 'section_group' | 'ensemble' | 'vet_status') =>
    new Set(users.map(c => c[key])).size === 1 ? users[0][key] : null
  const common = [shared('ensemble'), shared('section_group'), shared('vet_status')].filter(Boolean).join(' · ')
  return `${users.length} of ${all.length}${common ? ` · ${common}` : ''}`
}

const MoveDates = ({ data }: { data: Overview }) => {
  const year = data.season.year
  const setUp = data.combinations.filter(c => c.set_up)
  const [targets, setTargets] = useState<Record<string, string>>(() =>
    Object.fromEntries(data.dates.map(d => [d, d]))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const users = (date: string) => setUp.filter(c => c.entries.some(e => e.pay_date === date))
  const moves = data.dates.filter(d => targets[d] && targets[d] !== d)
  const affected = new Set(moves.flatMap(d => users(d).map(c => c.slug)))
  const allShared = data.dates.every(d => users(d).length === setUp.length)

  const submit = () => {
    setSaving(true)
    setError(null)
    fetch('/api/admin/default-schedules/dates', {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify({ moves: moves.map(d => ({ from: d, to: targets[d] })) }),
    })
      .then(async r => {
        if (r.ok) {
          window.location.assign(OVERVIEW_PATH)
          return
        }
        const body = await r.json().catch(() => ({}))
        setError(body.error ?? "Couldn't move the dates. Nothing changed — try again.")
        setSaving(false)
      })
      .catch(() => {
        setError("Couldn't move the dates. Nothing changed — try again.")
        setSaving(false)
      })
  }

  const label = `Move ${plural(moves.length, 'date')} in ${plural(affected.size, 'default')}`

  return (
    <div className="flex flex-col gap-4">
      <a href={OVERVIEW_PATH} className="text-body-sm font-medium text-accent-primary no-underline hover:underline">
        ‹ Default schedules
      </a>
      <div className="flex flex-col gap-1">
        <h1 className="m-0">Move {year} due dates</h1>
        <span className="text-body-sm text-secondary">
          {allShared
            ? `${plural(data.dates.length, 'date')}, each used by all ${setUp.length} defaults.`
            : `${plural(data.dates.length, 'date')} across ${plural(setUp.length, 'default')}.`}{' '}
          Amounts and member schedules don&rsquo;t change.
        </span>
      </div>

      {data.dates.length === 0 ? (
        <p className="m-0 rounded-md border border-border-default bg-surface p-5 text-body-sm text-secondary">
          {year} has no defaults yet, so there are no dates to move. <a href={OVERVIEW_PATH}>Set them up first.</a>
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border-default bg-surface">
          <table className="w-full border-collapse text-body-sm">
            <thead className="hidden sm:table-header-group">
              <tr className="border-b border-border-default bg-page text-left text-label uppercase text-secondary">
                <th scope="col" className="w-10 px-5 py-2.5 font-semibold">#</th>
                <th scope="col" className="w-40 py-2.5 font-semibold">Now</th>
                <th scope="col" className="w-60 py-2.5 font-semibold">Move to</th>
                <th scope="col" className="py-2.5 pr-5 font-semibold">Used by</th>
              </tr>
            </thead>
            <tbody>
              {data.dates.map((date, i) => {
                const to = targets[date]
                const changed = to !== date
                const who = users(date)
                return (
                  <tr
                    key={date}
                    className={`flex flex-col gap-1.5 border-b border-page px-4 py-2.5 sm:table-row sm:px-0 ${changed ? 'bg-warning-bg/30' : ''}`}
                  >
                    <td className="font-mono text-caption font-semibold text-secondary sm:px-5 sm:text-body-sm">
                      <span className="sm:hidden">Payment </span>
                      {i + 1}
                      {changed && (
                        <span className="font-normal text-warning-fg sm:hidden">
                          {' '}
                          · was <s className="font-mono">{shortDate(date)}</s>
                        </span>
                      )}
                    </td>
                    <td className={`hidden font-mono sm:table-cell ${changed ? 'text-secondary line-through' : ''}`}>
                      {shortDate(date)} {weekday(date)}
                    </td>
                    <td className="sm:py-2.5 sm:pr-4">
                      <input
                        type="date"
                        aria-label={`Move payment ${i + 1}, now ${shortDate(date)}, to`}
                        value={to}
                        onChange={e => setTargets(t => ({ ...t, [date]: e.target.value || date }))}
                        className={`h-11 w-full rounded-sm bg-surface px-3 font-mono text-body focus-visible:outline-none focus-visible:ring-2 sm:max-w-[240px] ${changed ? 'border-2 border-ocean' : 'border border-border-strong'}`}
                      />
                    </td>
                    <td className="hidden pr-5 text-secondary sm:table-cell">
                      <span className="flex flex-wrap items-center gap-2">
                        {usedBy(who, setUp)}
                        {changed && (
                          <Pill tone="warning" casing="sentence">
                            Moves in {who.length === setUp.length ? `all ${who.length}` : who.length}
                          </Pill>
                        )}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-5">
            {error && (
              <p role="alert" className="m-0 basis-full text-body-sm text-danger-fg">
                {error}
              </p>
            )}
            <Button size="lg" loading={saving} disabled={moves.length === 0} onClick={submit}>
              {moves.length === 0 ? 'Move dates' : label}
            </Button>
            <a
              href={OVERVIEW_PATH}
              className="inline-flex h-11 items-center justify-center rounded-md border border-border-strong bg-surface px-4 text-body font-semibold text-primary no-underline hover:bg-sunken"
            >
              Cancel
            </a>
            <span className="text-caption text-secondary sm:hidden">Nobody already on a schedule moves.</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default MoveDates
