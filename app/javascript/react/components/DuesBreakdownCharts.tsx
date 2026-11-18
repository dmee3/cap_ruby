import React, { useState } from 'react'
import { dollars, signedDollars } from '../../utilities/money'

/** One ensemble's dues as of today, from DuesBreakdown. All amounts in cents. */
export type DuesBreakdownRow = {
  ensemble: string
  member_count: number
  behind_count: number
  behind_cents: number
  ahead_count: number
  ahead_cents: number
  custom_count: number
  no_default_count: number
  default_due_cents: number
  due_cents: number
  collected_cents: number
}

const SUMMED: (keyof Omit<DuesBreakdownRow, 'ensemble'>)[] = [
  'member_count',
  'behind_count',
  'behind_cents',
  'ahead_count',
  'ahead_cents',
  'custom_count',
  'no_default_count',
  'default_due_cents',
  'due_cents',
  'collected_cents',
]

export const totalRow = (rows: DuesBreakdownRow[]): DuesBreakdownRow => {
  const total = { ensemble: 'All members' } as DuesBreakdownRow
  SUMMED.forEach((key) => {
    total[key] = rows.reduce((sum, row) => sum + row[key], 0)
  })
  return total
}

const net = (row: DuesBreakdownRow) => row.ahead_cents - row.behind_cents

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const VB_W = 720
const LABEL_W = 128
const VALUE_W = 72

const Empty = () => (
  <div className="flex min-h-[200px] items-center justify-center rounded-md border border-dashed border-border-strong px-6 py-10 text-center">
    <p className="text-h3 text-primary">No members on the roster yet</p>
  </div>
)

const Legend = ({ items }: { items: { className: string; label: string }[] }) => (
  <div className="flex flex-wrap items-center gap-4 text-body-sm">
    {items.map((item) => (
      <span key={item.label} className="inline-flex items-center gap-1.5 text-primary">
        <span className={item.className} aria-hidden="true" />
        {item.label}
      </span>
    ))}
  </div>
)

const Tooltip = ({ top, lines }: { top: string; lines: [string, string][] }) => (
  <div
    role="status"
    className="pointer-events-none absolute right-0 z-10 flex min-w-[180px] flex-col gap-1 rounded-md border border-border-default bg-surface px-3 py-2 text-body-sm shadow-lg"
    style={{ top }}
  >
    {lines.map(([value, label], i) =>
      i === 0 ? (
        <span key={label} className="font-semibold text-primary">
          {label}
        </span>
      ) : (
        <span key={label} className="flex items-baseline gap-2">
          <span className="font-mono font-bold text-primary">{value}</span>
          <span className="text-secondary">{label}</span>
        </span>
      ),
    )}
  </div>
)

/**
 * What members who are behind owe, against what members who are ahead have
 * paid early, per ensemble and in total. The net is the cash position against
 * everyone's own schedule; the amount owed is what there is to chase.
 */
export const AheadBehindChart = ({ rows }: { rows: DuesBreakdownRow[] }) => {
  const [hovered, setHovered] = useState<number | null>(null)
  if (rows.length === 0) return <Empty />

  const all = totalRow(rows)
  const series = rows.length > 1 ? [...rows, all] : rows
  const ROW_H = 60
  const BAR_H = 20
  const TOP = 6
  const VB_H = TOP + series.length * ROW_H
  const half = (VB_W - LABEL_W) / 2 - VALUE_W
  const center = LABEL_W + VALUE_W + half
  const max = Math.max(1, ...series.map((r) => Math.max(r.behind_cents, r.ahead_cents)))
  const w = (cents: number) => (Math.abs(cents) / max) * half
  const allNet = net(all)

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-body-sm text-secondary">
        {plural(all.behind_count, 'member owes', 'members owe')}{' '}
        <span className="font-semibold text-danger-fg">{dollars(all.behind_cents)}</span>;{' '}
        {plural(all.ahead_count, 'member has', 'members have')} paid{' '}
        <span className="font-semibold text-success-fg">{dollars(all.ahead_cents)}</span> ahead. Against
        everyone's own schedule that nets to{' '}
        <span className={`font-semibold ${allNet < 0 ? 'text-danger-fg' : 'text-success-fg'}`}>
          {allNet < 0 ? `${dollars(-allNet)} short` : `${dollars(allNet)} ahead`}
        </span>
        .
      </p>

      <Legend
        items={[
          { className: 'h-2.5 w-4 rounded-sm bg-viz-gap', label: 'Owed by members behind' },
          { className: 'h-2.5 w-4 rounded-sm bg-viz-actual', label: 'Paid ahead of schedule' },
          { className: 'h-1.5 w-4 rounded-sm bg-current text-primary', label: 'Net' },
        ]}
      />

      <div className="relative">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-auto w-full overflow-visible"
          onPointerLeave={() => setHovered(null)}
          role="img"
          aria-label={`Members behind owe ${dollars(all.behind_cents)}; members ahead have paid ${dollars(
            all.ahead_cents,
          )} early; net ${signedDollars(allNet)}.`}
        >
          <line
            x1={center}
            x2={center}
            y1={0}
            y2={VB_H}
            className="stroke-border-strong"
            strokeWidth="1"
          />
          {series.map((row, i) => {
            const y = TOP + i * ROW_H
            const rowNet = net(row)
            const isTotal = row === all && series.length > 1
            return (
              <g
                key={row.ensemble}
                data-testid={`ahead-behind-${row.ensemble}`}
                onPointerMove={() => setHovered(i)}
              >
                <rect x={0} y={y} width={VB_W} height={ROW_H} fill="transparent" />
                {isTotal && (
                  <line
                    x1={0}
                    x2={VB_W}
                    y1={y - 2}
                    y2={y - 2}
                    className="stroke-border-default"
                    strokeWidth="1"
                  />
                )}
                <text x={0} y={y + 18} className="fill-primary" style={{ fontSize: 13, fontWeight: 600 }}>
                  {row.ensemble}
                </text>
                <text
                  x={0}
                  y={y + 36}
                  className={rowNet < 0 ? 'fill-danger-fg font-mono' : 'fill-success-fg font-mono'}
                  style={{ fontSize: 12 }}
                >
                  net {signedDollars(rowNet)}
                </text>
                <rect
                  x={center - w(row.behind_cents)}
                  y={y + 6}
                  width={w(row.behind_cents)}
                  height={BAR_H}
                  rx="2"
                  className="fill-viz-gap"
                />
                <rect
                  x={center}
                  y={y + 6}
                  width={w(row.ahead_cents)}
                  height={BAR_H}
                  rx="2"
                  className="fill-viz-actual"
                />
                <rect
                  x={rowNet < 0 ? center - w(rowNet) : center}
                  y={y + BAR_H + 10}
                  width={Math.max(2, w(rowNet))}
                  height={6}
                  rx="1"
                  className="fill-primary"
                />
                <text
                  x={center - w(row.behind_cents) - 6}
                  y={y + 6 + BAR_H / 2 + 4}
                  textAnchor="end"
                  className="fill-secondary font-mono"
                  style={{ fontSize: 12 }}
                >
                  {dollars(row.behind_cents)}
                </text>
                <text
                  x={center + w(row.ahead_cents) + 6}
                  y={y + 6 + BAR_H / 2 + 4}
                  className="fill-secondary font-mono"
                  style={{ fontSize: 12 }}
                >
                  {dollars(row.ahead_cents)}
                </text>
              </g>
            )
          })}
        </svg>

        {hovered !== null && (
          <Tooltip
            top={`${((TOP + (hovered + 1) * ROW_H) / VB_H) * 100}%`}
            lines={[
              ['', series[hovered].ensemble],
              [
                dollars(series[hovered].behind_cents),
                `owed by ${plural(series[hovered].behind_count, 'member', 'members')} behind`,
              ],
              [
                dollars(series[hovered].ahead_cents),
                `paid early by ${plural(series[hovered].ahead_count, 'member', 'members')}`,
              ],
              [signedDollars(net(series[hovered])), 'net'],
            ]}
          />
        )}
      </div>
    </div>
  )
}

const MEASURES = [
  { key: 'default_due_cents', label: 'Due if all on default', className: 'fill-viz-scheduled opacity-40', swatch: 'bg-viz-scheduled opacity-40' },
  { key: 'due_cents', label: 'Due on current schedules', className: 'fill-viz-scheduled', swatch: 'bg-viz-scheduled' },
  { key: 'collected_cents', label: 'Collected', className: 'fill-viz-actual', swatch: 'bg-viz-actual' },
] as const

/**
 * Three yardsticks per ensemble: what would be due by today if everyone were
 * on their group's default schedule, what's due on the schedules they have,
 * and what has come in. The first gap is what custom plans have pushed later.
 */
export const ScheduleComparisonChart = ({ rows }: { rows: DuesBreakdownRow[] }) => {
  const [hovered, setHovered] = useState<number | null>(null)
  if (rows.length === 0) return <Empty />

  const all = totalRow(rows)
  const BAR_H = 18
  const GAP = 4
  const GROUP_GAP = 24
  const GROUP_H = MEASURES.length * BAR_H + (MEASURES.length - 1) * GAP
  const VB_H = rows.length * GROUP_H + (rows.length - 1) * GROUP_GAP + 4
  const span = VB_W - LABEL_W - VALUE_W - 16
  const max = Math.max(1, ...rows.flatMap((r) => MEASURES.map((m) => r[m.key])))
  const w = (cents: number) => (cents / max) * span
  const pushedLater = all.default_due_cents - all.due_cents

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-body-sm text-secondary">
        {plural(all.custom_count, 'member is', 'members are')} on a custom plan.{' '}
        {pushedLater > 0 ? (
          <>
            Those plans move{' '}
            <span className="font-semibold text-primary">{dollars(pushedLater)}</span> that the
            defaults would have due by today to later in the season.
          </>
        ) : pushedLater < 0 ? (
          <>
            Those plans bring{' '}
            <span className="font-semibold text-primary">{dollars(-pushedLater)}</span> forward
            from later in the season.
          </>
        ) : (
          <>They don't change what's due by today.</>
        )}
      </p>

      <Legend items={MEASURES.map((m) => ({ className: `h-2.5 w-4 rounded-sm ${m.swatch}`, label: m.label }))} />

      <div className="relative">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-auto w-full overflow-visible"
          onPointerLeave={() => setHovered(null)}
          role="img"
          aria-label={`Due by today if everyone were on the default schedule: ${dollars(
            all.default_due_cents,
          )}. Due on current schedules: ${dollars(all.due_cents)}. Collected: ${dollars(
            all.collected_cents,
          )}.`}
        >
          {rows.map((row, gi) => {
            const y0 = gi * (GROUP_H + GROUP_GAP)
            return (
              <g key={row.ensemble} onPointerMove={() => setHovered(gi)}>
                <rect x={0} y={y0} width={VB_W} height={GROUP_H} fill="transparent" />
                <text
                  x={0}
                  y={y0 + GROUP_H / 2 + 5}
                  className="fill-primary"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  {row.ensemble}
                </text>
                {MEASURES.map((m, i) => {
                  const y = y0 + i * (BAR_H + GAP)
                  return (
                    <g key={m.key}>
                      <rect
                        x={LABEL_W}
                        y={y}
                        width={w(row[m.key])}
                        height={BAR_H}
                        rx="2"
                        className={m.className}
                      />
                      <text
                        x={LABEL_W + w(row[m.key]) + 6}
                        y={y + BAR_H / 2 + 4}
                        className="fill-secondary font-mono"
                        style={{ fontSize: 12 }}
                      >
                        {dollars(row[m.key])}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>

        {hovered !== null && (
          <Tooltip
            top={`${(((hovered + 1) * (GROUP_H + GROUP_GAP) - GROUP_GAP) / VB_H) * 100}%`}
            lines={[
              ['', rows[hovered].ensemble],
              ...MEASURES.map((m): [string, string] => [dollars(rows[hovered][m.key]), m.label]),
              [String(rows[hovered].custom_count), 'on a custom plan'],
            ]}
          />
        )}
      </div>

      {all.no_default_count > 0 && (
        <p className="m-0 text-body-sm text-secondary">
          {plural(all.no_default_count, 'member has', 'members have')} no default schedule for
          their group, so their own schedule counts toward the default figure.
        </p>
      )}
    </div>
  )
}
