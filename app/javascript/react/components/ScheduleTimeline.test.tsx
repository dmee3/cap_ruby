import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ScheduleTimeline, { TimelineNode } from './ScheduleTimeline'

const nodes: TimelineNode[] = [
  { id: 1, payDate: '2025-10-17', amountCents: 50_000, status: 'paid' },
  { id: 2, payDate: '2025-11-14', amountCents: 40_000, status: 'late' },
  { id: 3, payDate: '2026-02-06', amountCents: 40_000, status: 'due-next' },
  { id: 4, payDate: '2026-03-06', amountCents: 40_000, status: 'not-due' },
]

describe('ScheduleTimeline', () => {
  it('places a node per entry, positioned by date rather than evenly', () => {
    const { container } = render(
      <ScheduleTimeline nodes={nodes} today="2026-01-20" paidCents={50_000} plannedCents={170_000} />,
    )
    const positioned = Array.from(container.querySelectorAll('[style*="left"]')).map(
      (el) => (el as HTMLElement).style.left,
    )
    // first node pinned at 0%, last at 100%, and the middles are not evenly spaced
    expect(positioned).toContain('0%')
    expect(positioned).toContain('100%')
    expect(new Set(positioned).size).toBeGreaterThan(2)
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
