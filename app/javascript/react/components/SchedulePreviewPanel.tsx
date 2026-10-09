import React from 'react'
import { dollars } from '../../utilities/money'
import { monthDayYear } from '../../utilities/dates'

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
  /** The season being forecast. Named in every state, because on the edit
   *  screen this is often NOT the current season and the person can be on
   *  several at once. */
  seasonYear: string
  /** Where to set this season's defaults up. Only given when the season being
   *  forecast is the admin's current one, since that page edits the current
   *  season and would otherwise set up the wrong year. */
  setUpDefaultsHref?: string
}

// §4.33. Read-only, and honest that it is a forecast: these rows don't exist
// yet. Three states — waiting, populated, and "no default exists", which is
// live for any season whose defaults an admin hasn't set up yet.
//
// The populated and no-default cards carry `overflow-hidden`: their children
// (the amber fill, the header strip, the total row) run edge to edge with no
// padding between, so without it those square corners paint straight over the
// card's radius.
//
// Neither state describes what else the save does — the "What happens when you
// save" panel directly above owns that, and says the right thing per screen.
const SchedulePreviewPanel = ({ forecast, waiting, seasonYear, setUpDefaultsHref }: SchedulePreviewPanelProps) => {
  if (waiting) {
    return (
      <div className="rounded-md border border-dashed border-border-strong p-4" data-testid="preview-waiting">
        <p className="m-0 text-body-sm font-semibold text-primary">
          Waiting on a section for {seasonYear}
        </p>
        <p className="m-0 mt-1 text-body-sm text-secondary">
          The default schedule depends on ensemble, section and whether they&rsquo;re a vet.
        </p>
      </div>
    )
  }

  if (forecast?.no_default) {
    return (
      <div className="overflow-hidden rounded-md border border-warning-fg" data-testid="preview-no-default">
        {/* Still clipped: the amber fill runs edge to edge. */}
        <div className="flex flex-col gap-1 bg-warning-bg p-4">
          <p className="m-0 text-body-sm font-semibold text-warning-fg">
            No default schedule exists for {seasonYear}
          </p>
          <p className="m-0 text-body-sm text-warning-fg">
            Nothing will be created, so they start with no due dates and no total, and they&rsquo;ll show up
            in the dashboard&rsquo;s missing-schedule alert until someone builds one.
          </p>
          {/* A new tab, so the half-filled form isn't lost; the form re-checks
              the forecast when the admin comes back to it. */}
          {setUpDefaultsHref && (
            <a
              href={setUpDefaultsHref}
              target="_blank"
              rel="noopener"
              className="mt-1 text-body-sm font-semibold text-accent-primary"
            >
              Set up {seasonYear} defaults →
            </a>
          )}
        </div>
      </div>
    )
  }

  if (!forecast?.entries?.length) return null

  return (
    <div className="overflow-hidden rounded-md border border-border-default" data-testid="preview-populated">
      <div className="flex flex-wrap items-baseline gap-2 border-b border-border-default px-4 py-2">
        <span className="text-label text-secondary">{seasonYear} schedule preview</span>
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
            <span className="font-mono text-secondary">{monthDayYear(entry.pay_date)}</span>
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
    </div>
  )
}

export default SchedulePreviewPanel
