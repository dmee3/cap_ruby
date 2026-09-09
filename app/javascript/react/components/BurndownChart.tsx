import React, { useRef } from 'react'

// @types/react is still v17 here (no useId); a per-instance counter keeps the
// SVG pattern id unique when more than one chart renders on a page.
let instanceSeq = 0

/** [ISO date, dollars] — cumulative, already summed server-side. */
export type BurndownPoint = [string, number]

type BurndownChartProps = {
  scheduled: BurndownPoint[]
  actual: BurndownPoint[]
  /** ISO date of "today" — where the dashed rule and the collected line end. */
  today: string
  currency?: string
  /** Optional href for the no-data state's "set up schedules" link. */
  setupHref?: string
  /**
   * The "$X short of the plan" line below the chart. Off on the admin
   * dashboard, where the shortfall is already a stat block and the as-of date
   * is already the card subtitle — it only reads as duplication there.
   */
  showCaption?: boolean
  className?: string
}

// Plot geometry (matches the Burndown canvas viewBox).
const VB_W = 720
const VB_H = 250
const PLOT = { left: 56, right: 700, top: 20, bottom: 220 }

const fmtMoney = (n: number, currency: string) =>
  n.toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 0 })

const fmtAxis = (n: number) => {
  if (n === 0) return '$0'
  if (n >= 1000) return `$${Math.round(n / 1000)}k`
  return `$${Math.round(n)}`
}

const fmtTick = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const fmtLong = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })

const BurndownChart = ({
  scheduled,
  actual,
  today,
  currency = 'USD',
  setupHref = '/admin/users',
  showCaption = true,
  className = '',
}: BurndownChartProps) => {
  const hatchId = useRef(`burndown-hatch-${(instanceSeq += 1)}`).current

  if (scheduled.length === 0) {
    return (
      <div
        className={`flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border-strong px-6 py-10 text-center ${className}`.trim()}
      >
        <p className="text-h3 text-primary">No dues scheduled for this season yet</p>
        <p className="max-w-sm text-body-sm text-secondary">
          The burndown appears once members have payment schedules. Set one up and this fills in from
          their first due date.
        </p>
        <a href={setupHref} className="mt-1 text-body-sm font-semibold text-accent-primary">
          Set up payment schedules
        </a>
      </div>
    )
  }

  const allDates = scheduled.map((p) => p[0])
  const minDate = new Date(`${allDates[0]}T00:00:00`).getTime()
  const maxDate = new Date(`${allDates[allDates.length - 1]}T00:00:00`).getTime()
  const maxValue = Math.max(1, ...scheduled.map((p) => p[1]), ...actual.map((p) => p[1]))
  // Round the axis ceiling up to a clean number for the four gridlines.
  const axisMax = niceCeil(maxValue)

  const x = (iso: string) => {
    const t = new Date(`${iso}T00:00:00`).getTime()
    const frac = maxDate === minDate ? 0 : (t - minDate) / (maxDate - minDate)
    return PLOT.left + frac * (PLOT.right - PLOT.left)
  }
  const y = (value: number) =>
    PLOT.bottom - (value / axisMax) * (PLOT.bottom - PLOT.top)

  const schedPts = scheduled.map(([d, v]) => `${x(d)},${y(v)}`).join(' ')
  const actualPts = actual.map(([d, v]) => `${x(d)},${y(v)}`).join(' ')
  const lastActual = actual[actual.length - 1]

  // Behind-schedule band: between the two lines, over the range the collected
  // line covers, only where collected trails scheduled.
  const behindArea = buildBehindArea(scheduled, actual, x, y)
  const behindCents = lastActual
    ? valueAt(scheduled, lastActual[0]) - lastActual[1]
    : 0

  const todayX = x(clampIso(today, allDates[0], allDates[allDates.length - 1]))
  const gridValues = [0, axisMax / 3, (axisMax * 2) / 3, axisMax]

  return (
    <div className={`flex flex-col gap-3 ${className}`.trim()}>
      <div className="flex flex-wrap items-center gap-4 text-body-sm">
        {/* Dashed swatch mirrors the dashed plan line — the legend carries the
            same solid/dashed distinction the chart does. */}
        <LegendSwatch
          className="h-0 w-4 border-t-[3px] border-dashed border-viz-scheduled"
          label="Scheduled"
        />
        <LegendSwatch className="h-[3px] w-4 rounded-sm bg-viz-actual" label="Collected" />
        <LegendSwatch
          className="h-2.5 w-4 rounded-sm bg-viz-gap opacity-40"
          label="Behind schedule"
        />
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`Dues collected against plan. ${
          behindCents > 0
            ? `${fmtMoney(behindCents, currency)} behind schedule as of ${fmtLong(today)}.`
            : 'Collections are keeping pace with the plan.'
        }`}
      >
        <defs>
          <pattern
            id={hatchId}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" className="fill-viz-gap" fillOpacity="0.18" />
            <line x1="0" y1="0" x2="0" y2="6" className="stroke-viz-gap" strokeWidth="1.5" />
          </pattern>
        </defs>

        {gridValues.map((v, i) => (
          <line
            key={v}
            x1={PLOT.left}
            x2={PLOT.right}
            y1={y(v)}
            y2={y(v)}
            className="stroke-border-default"
            strokeWidth="1"
            strokeOpacity={i === 0 ? 1 : 0.4}
          />
        ))}
        {gridValues.map((v) => (
          <text
            key={`t${v}`}
            x={PLOT.left - 10}
            y={y(v) + 4}
            textAnchor="end"
            className="fill-secondary font-mono"
            style={{ fontSize: 11 }}
          >
            {fmtAxis(v)}
          </text>
        ))}

        {behindArea && <polygon points={behindArea} fill={`url(#${hatchId})`} />}

        <polyline
          points={schedPts}
          fill="none"
          className="stroke-viz-scheduled"
          strokeWidth="2.5"
          strokeDasharray="7 5"
          strokeLinejoin="round"
        />
        <polyline
          points={actualPts}
          fill="none"
          className="stroke-viz-actual"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {lastActual && (
          <circle cx={x(lastActual[0])} cy={y(lastActual[1])} r="4.5" className="fill-viz-actual" />
        )}

        <line
          x1={todayX}
          x2={todayX}
          y1={PLOT.top - 6}
          y2={PLOT.bottom}
          className="stroke-secondary"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <text
          x={todayX}
          y={PLOT.top - 12}
          textAnchor="middle"
          className="fill-primary"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          Today
        </text>

        <text x={PLOT.left} y={PLOT.bottom + 18} className="fill-secondary font-mono" style={{ fontSize: 11 }}>
          {fmtTick(allDates[0])}
        </text>
        <text
          x={PLOT.right}
          y={PLOT.bottom + 18}
          textAnchor="end"
          className="fill-secondary font-mono"
          style={{ fontSize: 11 }}
        >
          {fmtTick(allDates[allDates.length - 1])}
        </text>
      </svg>

      <p className={`flex flex-wrap items-baseline gap-2 ${showCaption ? '' : 'hidden'}`}>
        {behindCents > 0 ? (
          <>
            <span className="text-body font-semibold text-danger-fg">
              {fmtMoney(behindCents, currency)} short of the plan
            </span>
            <span className="text-body-sm text-secondary">as of {fmtLong(today)}.</span>
          </>
        ) : (
          <span className="text-body-sm text-secondary">
            Collections are keeping pace with the plan as of {fmtLong(today)}.
          </span>
        )}
      </p>
    </div>
  )
}

const LegendSwatch = ({ className, label }: { className: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5 text-primary">
    <span className={className} aria-hidden="true" />
    {label}
  </span>
)

const niceCeil = (n: number) => {
  const mag = Math.pow(10, Math.floor(Math.log10(n)))
  return Math.ceil(n / mag) * mag
}

const valueAt = (series: BurndownPoint[], iso: string) => {
  let last = 0
  for (const [d, v] of series) {
    if (d <= iso) last = v
    else break
  }
  return last
}

const clampIso = (iso: string, min: string, max: string) => {
  if (iso < min) return min
  if (iso > max) return max
  return iso
}

// Polygon tracing the scheduled line forward then the collected line back,
// clipped to the collected range and to where collected < scheduled.
const buildBehindArea = (
  scheduled: BurndownPoint[],
  actual: BurndownPoint[],
  x: (iso: string) => number,
  y: (v: number) => number,
): string | null => {
  if (actual.length < 2) return null
  const covered = actual.map((p) => p[0])
  const top = scheduled
    .filter((p) => covered.includes(p[0]))
    .map(([d, v]) => `${x(d)},${y(Math.max(v, valueAt(actual, d)))}`)
  const bottom = [...actual].reverse().map(([d, v]) => `${x(d)},${y(v)}`)
  const anyGap = actual.some(([d, v]) => valueAt(scheduled, d) - v > 0)
  if (!anyGap || top.length === 0) return null
  return [...top, ...bottom].join(' ')
}

export default BurndownChart
