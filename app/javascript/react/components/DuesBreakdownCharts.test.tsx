import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AheadBehindChart, DuesBreakdownRow, ScheduleComparisonChart } from './DuesBreakdownCharts'

const row = (overrides: Partial<DuesBreakdownRow>): DuesBreakdownRow => ({
  ensemble: 'World',
  member_count: 10,
  behind_count: 0,
  behind_cents: 0,
  ahead_count: 0,
  ahead_cents: 0,
  custom_count: 0,
  no_default_count: 0,
  default_due_cents: 0,
  due_cents: 0,
  collected_cents: 0,
  ...overrides,
})

const world = row({ behind_count: 3, behind_cents: 90_000, ahead_count: 1, ahead_cents: 20_000 })
const cc2 = row({ ensemble: 'CC2', behind_count: 1, behind_cents: 10_000, ahead_count: 2, ahead_cents: 50_000 })

describe('AheadBehindChart', () => {
  it('nets what members ahead have paid early against what members behind owe', () => {
    render(<AheadBehindChart rows={[world, cc2]} />)
    // owed $1,000, ahead $700 → $300 short
    expect(screen.getByText('$300 short')).toBeInTheDocument()
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/net -\$300/)
  })

  it('adds an all-members row only when there is more than one ensemble', () => {
    const { rerender } = render(<AheadBehindChart rows={[world, cc2]} />)
    expect(screen.getByTestId('ahead-behind-All members')).toBeInTheDocument()

    rerender(<AheadBehindChart rows={[world]} />)
    expect(screen.queryByTestId('ahead-behind-All members')).not.toBeInTheDocument()
  })

  it('says so when there is nobody to chart', () => {
    render(<AheadBehindChart rows={[]} />)
    expect(screen.getByText('No members on the roster yet')).toBeInTheDocument()
  })
})

describe('ScheduleComparisonChart', () => {
  it('names how much custom plans have moved past today', () => {
    render(
      <ScheduleComparisonChart
        rows={[
          row({ custom_count: 2, default_due_cents: 300_000, due_cents: 250_000 }),
          row({ ensemble: 'CC2', custom_count: 1, default_due_cents: 200_000, due_cents: 190_000 }),
        ]}
      />,
    )
    expect(screen.getByText('3 members are on a custom plan.', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('$600')).toBeInTheDocument()
  })

  it('owns up to members whose group has no default to compare with', () => {
    render(<ScheduleComparisonChart rows={[row({ no_default_count: 2 })]} />)
    expect(
      screen.getByText(/2 members have no default schedule for their group/),
    ).toBeInTheDocument()
  })
})
