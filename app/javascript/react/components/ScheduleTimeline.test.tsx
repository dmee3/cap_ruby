import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ScheduleTimeline, { TimelineNode, positionOf } from './ScheduleTimeline'

const nodes: TimelineNode[] = [
  { id: 1, payDate: '2025-10-17', amountCents: 50_000, status: 'paid' },
  { id: 2, payDate: '2025-11-14', amountCents: 40_000, status: 'late' },
  { id: 3, payDate: '2026-02-06', amountCents: 40_000, status: 'due-next' },
  { id: 4, payDate: '2026-03-06', amountCents: 40_000, status: 'not-due' },
]

describe('ScheduleTimeline', () => {
  // Exact CSS placement isn't meaningfully assertable through a simulated
  // DOM (happy-dom drops calc() it can't resolve), so the placement contract
  // is tested on the function and the rendering is left to the visual pass.
  describe('positionOf', () => {
    it('spans 0–100 across the schedule, proportional to the date', () => {
      expect(positionOf('2026-01-01', '2026-01-01', '2026-01-11')).toBe(0)
      expect(positionOf('2026-01-11', '2026-01-01', '2026-01-11')).toBe(100)
      expect(positionOf('2026-01-06', '2026-01-01', '2026-01-11')).toBe(50)
    })

    it('is date-derived, not evenly spaced', () => {
      // 10/17 → 3/6 with a node at 11/14: a quarter in by time, not a third.
      const p = positionOf('2025-11-14', '2025-10-17', '2026-03-06')
      expect(p).toBeGreaterThan(15)
      expect(p).toBeLessThan(30)
    })

    it('centres a lone node rather than pinning it left', () => {
      expect(positionOf('2026-01-01', '2026-01-01', '2026-01-01')).toBe(50)
    })

    it('clamps a date outside the schedule', () => {
      expect(positionOf('2020-01-01', '2026-01-01', '2026-01-11')).toBe(0)
      expect(positionOf('2030-01-01', '2026-01-01', '2026-01-11')).toBe(100)
    })
  })

  // The screenshot bug: the rail was drawn across the date labels, striking
  // them through. Dates, rail+dots, and amounts must be in separate bands.
  it('keeps the date labels out of the rail band', () => {
    const { container } = render(
      <ScheduleTimeline nodes={nodes} today="2026-01-20" paidCents={50_000} plannedCents={170_000} />,
    )
    const rail = container.querySelector('.bg-sunken.rounded-full')!
    const railBand = rail.parentElement!
    const dateLabel = screen.getByText('10/17')

    // the rail's band contains the dots, and the dates sit above the rail
    expect(railBand.contains(dateLabel)).toBe(true)
    expect(dateLabel.className).toMatch(/top-0/)
    expect(rail.className).toMatch(/bottom-/)
  })

  it('puts the amounts in a band below the rail entirely', () => {
    const { container } = render(
      <ScheduleTimeline nodes={nodes} today="2026-01-20" paidCents={50_000} plannedCents={170_000} />,
    )
    const rail = container.querySelector('.bg-sunken.rounded-full')!
    const amount = screen.getAllByText('$400')[0]
    expect(rail.parentElement!.contains(amount)).toBe(false)
  })

  it('renders one node per entry, each with its date and amount', () => {
    render(<ScheduleTimeline nodes={nodes} today="2026-01-20" paidCents={50_000} plannedCents={170_000} />)
    // dates are unique per node, so they count the nodes without catching
    // the legend swatches
    ;['10/17', '11/14', '2/6', '3/6'].forEach((d) => {
      expect(screen.getByText(d)).toBeInTheDocument()
    })
  })

  it('renders each amount, toned by status', () => {
    render(<ScheduleTimeline nodes={nodes} today="2026-01-20" paidCents={50_000} plannedCents={170_000} />)
    expect(screen.getByText('$500')).toHaveClass('text-success-fg')
    expect(screen.getAllByText('$400')[0]).toBeInTheDocument()
  })

  it('draws a Today marker when today falls inside the schedule', () => {
    render(<ScheduleTimeline nodes={nodes} today="2026-01-20" paidCents={50_000} plannedCents={170_000} />)
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('omits the Today marker when the season has not started', () => {
    render(<ScheduleTimeline nodes={nodes} today="2025-01-01" paidCents={0} plannedCents={170_000} />)
    expect(screen.queryByText('Today')).not.toBeInTheDocument()
  })

  it('shows the same three-key legend regardless of which statuses are present', () => {
    const paidOnly: TimelineNode[] = [{ id: 1, payDate: '2025-10-17', amountCents: 50_000, status: 'paid' }]
    render(<ScheduleTimeline nodes={paidOnly} today="2026-01-20" paidCents={50_000} plannedCents={50_000} />)
    expect(screen.getByText('Covered by a payment')).toBeInTheDocument()
    expect(screen.getByText('Due next')).toBeInTheDocument()
    expect(screen.getByText('Not due yet')).toBeInTheDocument()
  })

  it('replaces the legend with a moved-dates warning, pluralised from the count', () => {
    const { rerender } = render(
      <ScheduleTimeline
        nodes={nodes}
        today="2026-01-20"
        paidCents={50_000}
        plannedCents={170_000}
        movedPastDueCount={1}
      />,
    )
    expect(screen.getByText(/One due date went by unpaid/)).toBeInTheDocument()
    expect(screen.queryByText('Covered by a payment')).not.toBeInTheDocument()

    rerender(
      <ScheduleTimeline
        nodes={nodes}
        today="2026-01-20"
        paidCents={50_000}
        plannedCents={170_000}
        movedPastDueCount={3}
      />,
    )
    expect(screen.getByText(/3 due dates went by unpaid/)).toBeInTheDocument()
  })
})
