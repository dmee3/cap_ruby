import React from 'react'

type ProgressMeterProps = {
  raisedCents: number
  goalCents: number
  /** 7px on the phone layout, 8px on desktop. */
  compact?: boolean
  /** Sitting on the dark hero rather than on a card. */
  onDark?: boolean
  className?: string
}

/**
 * How full a performer's calendar is. A track with a moss fill, except when
 * it's finished, where the whole bar is solid moss with no track left showing:
 * a complete calendar should read as done, not as a bar that happens to be at
 * the end.
 *
 * Takes cents, like every other money-shaped prop in the app, even though the
 * underlying `donation_date` sums to dollars — the conversion happens once, at
 * the API boundary.
 */
const ProgressMeter = ({
  raisedCents,
  goalCents,
  compact = false,
  onDark = false,
  className = '',
}: ProgressMeterProps) => {
  const pct = goalCents > 0 ? Math.min(100, Math.round((raisedCents / goalCents) * 100)) : 0
  const complete = raisedCents >= goalCents && goalCents > 0

  return (
    <div
      className={`w-full overflow-hidden rounded-full ${compact ? 'h-[7px]' : 'h-2'} ${
        // On the dark hero the page background would vanish, so the track is
        // the hero's own deeper tone.
        onDark ? 'bg-ocean-dark' : 'bg-page'
      } ${className}`.trim()}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Calendar progress"
    >
      {/* `bg-moss` in both themes, matching DuesMeter (§4.14) rather than
          introducing a second money-positive green. */}
      <div
        className="h-full rounded-full bg-moss transition-[width]"
        style={{ width: `${complete ? 100 : pct}%` }}
      />
    </div>
  )
}

export default ProgressMeter
