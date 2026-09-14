import React from 'react'
import { dollars } from '../../utilities/money'

export type ForecastEntry = { pay_date: string; amount_cents: number }

export type Forecast = {
  entries?: ForecastEntry[]
  total_cents?: number
  lookup_key?: string
  past_due?: { count: number; amount_cents: number }
  no_default?: boolean
}

type SchedulePreviewPanelProps = {
  forecast: Forecast | null
  /** True before the admin has picked enough to look a default up. */
  waiting: boolean
}

// §4.33. Read-only, and honest that it is a forecast: these rows don't exist
// yet. Three states — waiting, populated, and "no default exists", which is the
// live state for any season past 2026.
const SchedulePreviewPanel = ({ forecast, waiting }: SchedulePreviewPanelProps) => {
  if (waiting) {
    return (
      <div className="rounded-md border border-dashed border-border-strong p-4" data-testid="preview-waiting">
        <p className="m-0 text-body-sm font-semibold text-primary">Waiting on a section</p>
        <p className="m-0 mt-1 text-body-sm text-secondary">
          The default schedule depends on ensemble, section and whether they&rsquo;re a vet.
        </p>
      </div>
    )
  }

  if (forecast?.no_default) {
    return (
      <div className="rounded-md border border-warning-fg" data-testid="preview-no-default">
        <div className="flex flex-col gap-1 bg-warning-bg p-4">
          <p className="m-0 text-body-sm font-semibold text-warning-fg">
            No default schedule exists for this combination
          </p>
          <p className="m-0 text-body-sm text-warning-fg">
            Nothing will be created, so they start with no due dates and no total, and they&rsquo;ll show up
            in the dashboard&rsquo;s missing-schedule alert until someone builds one.
          </p>
        </div>
        <p className="m-0 border-t border-border-default p-4 text-body-sm text-secondary">
          The account is still created and the welcome email still goes out.
        </p>
      </div>
    )
  }

  if (!forecast?.entries?.length) return null

  return (
    <div className="rounded-md border border-border-default" data-testid="preview-populated">
      <div className="flex flex-wrap items-baseline gap-2 border-b border-border-default px-4 py-2">
        <span className="text-label text-secondary">Schedule preview</span>
        {forecast.lookup_key && (
          <span className="ml-auto text-body-sm text-secondary">{forecast.lookup_key}</span>
        )}
      </div>
      <ul className="m-0 list-none p-0">
        {forecast.entries.map(entry => (
          <li
            key={entry.pay_date}
            className="flex items-center justify-between border-b border-border-default px-4 py-1.5 text-body-sm"
          >
            <span className="font-mono text-secondary">{formatDate(entry.pay_date)}</span>
            <span className="font-mono font-semibold text-primary">{dollars(entry.amount_cents)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between bg-sunken px-4 py-2">
        <span className="text-body-sm font-semibold text-primary">Total</span>
        <span className="font-mono text-body font-bold text-primary">
          {dollars(forecast.total_cents ?? 0)}
        </span>
      </div>
      {forecast.past_due && forecast.past_due.count > 0 && (
        <div className="flex flex-col gap-1 border-t border-border-default bg-warning-bg p-3">
          <span className="text-body-sm font-semibold text-warning-fg">
            {forecast.past_due.count === 1 ? 'One date is already past' : `${forecast.past_due.count} dates are already past`}
          </span>
          <span className="text-body-sm text-warning-fg">
            {dollars(forecast.past_due.amount_cents)} reads as due the moment they&rsquo;re created. Adjust the
            schedule after saving if that&rsquo;s wrong.
          </span>
        </div>
      )}
      <p className="m-0 px-4 py-2 text-body-sm text-secondary">
        A forecast, not a record. It&rsquo;s created on save, and the dates can change afterwards.
      </p>
    </div>
  )
}

// The entries arrive as ISO dates; render them the way the rest of the app does.
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${m}/${d}/${String(y).slice(2)}`
}

export default SchedulePreviewPanel
