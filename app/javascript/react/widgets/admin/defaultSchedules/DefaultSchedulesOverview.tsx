import React, { useState } from 'react'
import Button from '../../../components/Button'
import SegmentedControl from '../../../components/SegmentedControl'
import { toast } from '../../../components/Toast'
import { dollars } from '../../../../utilities/money'
import {
  Combination,
  CopySource,
  COPY_PATH,
  DATES_PATH,
  ENSEMBLE_NAMES,
  Overview,
  editPath,
  jsonHeaders,
  plural,
  shortDate,
} from './shared'

const linkButton =
  'inline-flex items-center justify-center rounded-md px-3 h-9 text-body-sm font-semibold no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
const primaryLink = `${linkButton} bg-ocean text-on-brand hover:bg-ocean-light`
const secondaryLink = `${linkButton} border border-border-strong bg-surface text-primary hover:bg-sunken`

const ensembles = (combinations: Combination[]) => [...new Set(combinations.map(c => c.ensemble))]

const priceRange = (combinations: Combination[]) => {
  const totals = combinations.filter(c => c.set_up).map(c => c.total_cents)
  return `${dollars(Math.min(...totals))} to ${dollars(Math.max(...totals))}`
}

const subtitle = (data: Overview) => {
  const setUp = data.combinations.filter(c => c.set_up)
  const covered = setUp.reduce((sum, c) => sum + c.member_count, 0)
  const parts = [`${data.set_up_count} of ${data.combinations.length} set up`]
  if (setUp.length === 0) return parts[0]

  parts.push(
    covered === data.member_count ? `cover all ${data.member_count} members` : `cover ${covered} of ${data.member_count} members`
  )
  parts.push(`${priceRange(data.combinations)} per member`)
  return parts.join(' · ')
}

// One ensemble's combinations as a dates-down, combinations-across table. The
// desktop matrix shows every ensemble side by side; mobile shows one.
const Matrix = ({
  combinations,
  dates,
  compact = false,
}: {
  combinations: Combination[]
  dates: string[]
  compact?: boolean
}) => {
  const groups = ensembles(combinations).map(ensemble => ({
    ensemble,
    sections: ['Music', 'Visual'].map(section => ({
      section,
      combos: combinations.filter(c => c.ensemble === ensemble && c.section_group === section),
    })),
  }))
  const columns = groups.flatMap(g => g.sections.flatMap(s => s.combos))
  const edgeClass = (c: Combination) => {
    const i = columns.indexOf(c)
    if (i === 0) return ''
    if (i % 4 === 0) return 'border-l border-l-border-strong'
    return 'border-l border-l-border-default'
  }
  const missingTint = (c: Combination) => (c.set_up ? '' : 'bg-warning-bg text-warning-fg')
  const cell = compact ? 'px-2 py-2' : 'px-3 py-2.5'
  const amountOn = (c: Combination, date: string) =>
    c.entries.find(e => e.pay_date === date)?.amount_cents

  return (
    <div className="overflow-hidden rounded-md border border-border-default bg-surface">
      <table className="w-full table-fixed border-collapse text-body-sm">
        <thead>
          {!compact && (
            <tr className="border-b border-border-default bg-page">
              <th scope="col" className="w-[120px]" />
              {groups.map((g, i) => (
                <th
                  key={g.ensemble}
                  scope="colgroup"
                  colSpan={4}
                  className={`px-2.5 pb-1.5 pt-2.5 text-center font-bold text-primary ${i > 0 ? 'border-l border-l-border-strong' : ''}`}
                >
                  {ENSEMBLE_NAMES[g.ensemble] ?? g.ensemble}
                </th>
              ))}
            </tr>
          )}
          <tr className="border-b border-border-default bg-sunken text-caption font-semibold uppercase tracking-wide text-secondary">
            <th scope="col" className={`${compact ? 'w-[74px] px-2.5' : 'w-[120px] px-4'} py-2 text-left font-semibold`}>
              Due
            </th>
            {groups.flatMap(g =>
              g.sections.map(s => {
                const missing = s.combos.every(c => !c.set_up)
                return (
                  <th
                    key={`${g.ensemble}-${s.section}`}
                    scope="colgroup"
                    colSpan={2}
                    className={`px-2.5 py-2 text-center font-semibold ${edgeClass(s.combos[0])} ${missing ? 'text-warning-fg' : ''}`}
                  >
                    {s.section}
                    {missing && !compact ? ' · not set up' : ''}
                  </th>
                )
              })
            )}
          </tr>
          <tr className="border-b border-border-default">
            <td />
            {columns.map(c => (
              <th
                key={c.slug}
                scope="col"
                className={`${cell} text-right align-top font-normal ${edgeClass(c)} ${missingTint(c)}`}
              >
                <span className="block font-bold text-primary">{c.vet_status}</span>
                <span className={`block text-caption ${c.set_up ? 'text-secondary' : 'text-warning-fg'}`}>
                  {compact
                    ? `${c.member_count} · ${c.set_up ? 'mbrs' : 'none'}`
                    : c.set_up
                      ? plural(c.member_count, 'member')
                      : `${c.member_count} with nothing due`}
                </span>
                {!compact && (
                  <a
                    href={editPath(c.slug)}
                    className={`text-caption font-semibold ${c.set_up ? 'text-accent-primary' : 'text-warning-fg'}`}
                    aria-label={`${c.set_up ? 'Edit' : 'Set up'} ${c.label}`}
                  >
                    {c.set_up ? 'Edit' : 'Set up'}
                  </a>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dates.map(date => (
            <tr key={date} className="border-b border-page hover:bg-sunken">
              <th
                scope="row"
                className={`${compact ? 'px-2.5' : 'px-4'} py-2 text-left font-mono font-normal text-secondary`}
              >
                {shortDate(date)}
              </th>
              {columns.map(c => {
                const amount = amountOn(c, date)
                return (
                  <td
                    key={c.slug}
                    className={`${cell} text-right font-mono font-medium ${edgeClass(c)} ${missingTint(c) || 'text-primary'}`}
                  >
                    {amount == null ? '–' : dollars(amount)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-sunken">
            <th scope="row" className={`${compact ? 'px-2.5' : 'px-4'} py-2.5 text-left font-semibold`}>
              Total
            </th>
            {columns.map(c => (
              <td
                key={c.slug}
                className={`${cell} text-right font-mono font-bold ${edgeClass(c)} ${c.set_up ? 'text-primary' : 'text-warning-fg'}`}
              >
                {dollars(c.total_cents)}
              </td>
            ))}
          </tr>
          {compact && (
            <tr className="border-t border-border-default">
              <td />
              {columns.map(c => (
                <td key={c.slug} className={`${edgeClass(c)} p-0`}>
                  <a
                    href={editPath(c.slug)}
                    aria-label={`${c.set_up ? 'Edit' : 'Set up'} ${c.label}`}
                    className={`flex h-11 items-center justify-end px-2 text-body-sm font-semibold ${c.set_up ? 'text-accent-primary' : 'text-warning-fg'}`}
                  >
                    {c.set_up ? 'Edit' : 'Set up'}
                  </a>
                </td>
              ))}
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  )
}

const SourceFacts = ({ source }: { source: CopySource }) => (
  <dl className="m-0 grid w-full max-w-[640px] grid-cols-1 gap-3 rounded-md border border-border-default bg-sunken px-4 py-3.5 text-left sm:grid-cols-3">
    <div className="flex justify-between gap-2 sm:flex-col sm:justify-start sm:gap-0.5">
      <dt className="text-caption font-semibold uppercase tracking-wide text-secondary">{source.year} has</dt>
      <dd className="m-0 font-semibold">{plural(source.combination_count, 'default')}</dd>
    </div>
    <div className="flex justify-between gap-2 sm:flex-col sm:justify-start sm:gap-0.5">
      <dt className="text-caption font-semibold uppercase tracking-wide text-secondary">Per member</dt>
      <dd className="m-0 font-mono font-semibold">
        {dollars(source.min_total_cents)} – {dollars(source.max_total_cents)}
      </dd>
    </div>
    <div className="flex justify-between gap-2 sm:flex-col sm:justify-start sm:gap-0.5">
      <dt className="text-caption font-semibold uppercase tracking-wide text-secondary">
        {plural(source.payment_count, 'payment')}
      </dt>
      <dd className="m-0 font-mono font-semibold">
        {shortDate(source.first_date)} – {shortDate(source.last_date)}
      </dd>
    </div>
  </dl>
)

const EmptyOverview = ({ data }: { data: Overview }) => {
  const year = data.season.year
  const blank = data.blank_schedule_count
  const source = data.copy_source
  const firstSlug = data.combinations[0].slug
  return (
    <div className="flex flex-col items-center gap-5 rounded-md border border-border-default bg-surface px-5 py-7 text-center sm:px-10 sm:py-12">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg font-mono text-h3 font-bold text-danger-fg"
      >
        $0
      </span>
      <div className="flex max-w-[560px] flex-col gap-2">
        <h2 className="m-0 text-h2 font-bold">
          {blank > 0 ? `${plural(blank, 'member')} ${blank === 1 ? 'has' : 'have'} no payment schedule` : `No ${year} defaults yet`}
        </h2>
        <p className="m-0 text-body text-secondary">
          {year} has no defaults set up yet, meaning any new member added will get an empty payment schedule. You can
          create a new schedule from scratch or copy the previous season&rsquo;s default and edit it here.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        {source && (
          <a href={COPY_PATH} className={`${primaryLink} h-11 px-5`}>
            Copy from {source.year} season
          </a>
        )}
        <a href={editPath(firstSlug)} className={`${source ? secondaryLink : primaryLink} h-11 px-5`}>
          Start blank
        </a>
      </div>
      {source && <SourceFacts source={source} />}
      {blank > 0 && (
        <p className="m-0 max-w-[560px] text-caption text-secondary">
          Once defaults exist, you can fill the {plural(blank, 'empty schedule')} from them here.
        </p>
      )}
    </div>
  )
}

// Fills only schedules with no entries, so it never needs the destructive
// confirm — but it does create dues, so it still asks once.
const ApplyToEmpty = ({ data }: { data: Overview }) => {
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const blank = data.blank_schedule_count

  const apply = () => {
    setSaving(true)
    fetch('/api/admin/default-schedules/apply-to-empty', { method: 'POST', headers: jsonHeaders() })
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then((body: { filled: number; still_empty: number }) => {
        const rest = body.still_empty > 0 ? ` ${body.still_empty} still have no default to copy.` : ''
        toast(`Filled ${plural(body.filled, 'schedule')}.${rest}`, { variant: 'success' })
        window.location.reload()
      })
      .catch(() => {
        setSaving(false)
        toast("Couldn't fill the schedules. Nothing was changed — try again.", { variant: 'error' })
      })
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border-default border-l-[3px] border-l-warning-fg bg-surface px-4 py-3.5 sm:flex-row sm:items-center">
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-body-sm font-semibold text-primary">
          {plural(blank, 'member')} {blank === 1 ? 'has' : 'have'} an empty schedule
        </span>
        <span className="text-body-sm text-secondary">
          {confirming
            ? 'Each gets a copy of their default. Anyone whose schedule already has a payment on it is left alone.'
            : 'They were added before their default existed, so they owe nothing on paper.'}
        </span>
      </div>
      <div className="flex gap-2">
        {confirming ? (
          <>
            <Button variant="primary" loading={saving} onClick={apply} fullWidthBelow={false}>
              Fill {plural(blank, 'schedule')}
            </Button>
            <Button variant="secondary" disabled={saving} onClick={() => setConfirming(false)} fullWidthBelow={false}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setConfirming(true)}>
            Fill empty schedules
          </Button>
        )}
      </div>
    </div>
  )
}

const MissingBanner = ({ data, missing }: { data: Overview; missing: Combination[] }) => {
  const pairs = [...new Set(missing.map(c => `${c.ensemble} · ${c.section_group}`))]
  const name = missing.length === 1 ? missing[0].label : pairs.length === 1 ? pairs[0] : `${missing.length} combinations`
  const affected = missing.reduce((sum, c) => sum + c.member_count, 0)
  const source = data.copy_source
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border-default border-l-[3px] border-l-warning-fg bg-surface px-4 py-3.5 sm:flex-row sm:items-center">
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-body-sm font-semibold text-primary">
          {name} {missing.length === 1 || pairs.length === 1 ? 'has' : 'have'} no {data.season.year} defaults
        </span>
        <span className="text-body-sm text-secondary">
          {affected > 0
            ? `${plural(affected, 'member')} ${affected === 1 ? 'is' : 'are'} in ${missing.length === 1 ? 'it' : 'them'}. Anyone added there next gets an empty schedule too.`
            : 'Nobody is in them yet, but anyone added there gets an empty schedule.'}
        </span>
      </div>
      {source && (
        <a href={COPY_PATH} className={secondaryLink}>
          Copy the {missing.length} missing from {source.year}
        </a>
      )}
    </div>
  )
}

const DefaultSchedulesOverview = ({ data }: { data: Overview }) => {
  const year = data.season.year
  const allEnsembles = ensembles(data.combinations)
  const [tab, setTab] = useState(allEnsembles[0])
  const missing = data.combinations.filter(c => !c.set_up)
  const empty = data.set_up_count === 0
  const source = data.copy_source

  return (
    <div className="flex flex-col gap-4">
      <a href="/admin/season/edit" className="text-body-sm font-medium text-accent-primary no-underline hover:underline">
        ‹ Season
      </a>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="m-0">{year} default payment schedules</h1>
          <span className="text-body-sm text-secondary">{subtitle(data)}</span>
        </div>
        {!empty && (
          <div className="hidden gap-2 sm:ml-auto sm:flex">
            {missing.length > 0 && source && (
              <a href={COPY_PATH} className={secondaryLink}>
                Copy from {source.year} season
              </a>
            )}
            <a href={DATES_PATH} className={primaryLink}>
              Edit all dates
            </a>
          </div>
        )}
      </div>

      {empty ? (
        <EmptyOverview data={data} />
      ) : (
        <>
          <p className="m-0 max-w-[760px] text-body-sm text-secondary">
            A new member gets a copy of their combination when they&rsquo;re added to {year}. Changing a default here
            doesn&rsquo;t touch anyone&rsquo;s existing schedule.
          </p>
          {missing.length > 0 && <MissingBanner data={data} missing={missing} />}
          {data.blank_schedule_count > 0 && <ApplyToEmpty data={data} />}

          <div className="hidden sm:block">
            <Matrix combinations={data.combinations} dates={data.dates} />
          </div>

          <div className="flex flex-col gap-3 sm:hidden">
            <SegmentedControl
              tone="brand"
              fill="below-sm"
              value={tab}
              onChange={setTab}
              label="Ensemble"
              options={allEnsembles.map(e => ({
                value: e,
                label: `${ENSEMBLE_NAMES[e] ?? e} · ${data.combinations
                  .filter(c => c.ensemble === e)
                  .reduce((sum, c) => sum + c.member_count, 0)}`,
              }))}
            />
            <Matrix compact combinations={data.combinations.filter(c => c.ensemble === tab)} dates={data.dates} />
            <a href={DATES_PATH} className={`${primaryLink} h-11`}>
              Edit all dates
            </a>
            {missing.length > 0 && source && (
              <a href={COPY_PATH} className={`${secondaryLink} h-11`}>
                Copy from {source.year} season
              </a>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default DefaultSchedulesOverview
