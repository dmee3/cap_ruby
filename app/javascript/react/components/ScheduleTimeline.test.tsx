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
  it('renders the paid-of-planned headline', () => {
    render(<ScheduleTimeline nodes={nodes} today="2026-01-20" paidCents={50_000} plannedCents={170_000} />)
    expect(screen.getByText('$500 paid of $1,700 planned')).toBeInTheDocument()
  })

  it('renders one node per entry with a non-colour status label', () => {
    render(<ScheduleTimeline nodes={nodes} today="2026-01-20" paidCents={50_000} plannedCents={170_000} />)
    expect(screen.getAllByText('Paid')).not.toHaveLength(0)
    expect(screen.getAllByText('Late')).not.toHaveLength(0)
    expect(screen.getAllByText('Not due yet')).not.toHaveLength(0)
  })

  it('shows the moved-dates caption when flagged', () => {
    render(
      <ScheduleTimeline
        nodes={nodes}
        today="2026-01-20"
        paidCents={50_000}
        plannedCents={170_000}
        datesMovedPastDue
      />,
    )
    expect(screen.getByText(/Moving them forward doesn’t erase them/)).toBeInTheDocument()
  })

  it('builds the legend only from the statuses actually present', () => {
    const paidOnly: TimelineNode[] = [{ id: 1, payDate: '2025-10-17', amountCents: 50_000, status: 'paid' }]
    render(<ScheduleTimeline nodes={paidOnly} today="2026-01-20" paidCents={50_000} plannedCents={50_000} />)
    expect(screen.queryByText('Late')).not.toBeInTheDocument()
  })
})
