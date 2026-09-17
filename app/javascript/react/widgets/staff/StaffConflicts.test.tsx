import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StaffConflicts, { StaffConflictGroup } from './StaffConflicts'

const group = (overrides: Partial<StaffConflictGroup> = {}): StaffConflictGroup => ({
  date: '2026-03-20',
  date_label: 'Friday, 3/20',
  out_count: 1,
  rows: [
    {
      id: 1,
      date_range_label: 'Fri 3/20',
      time_range_label: '6:30 PM–9:30 PM',
      status: 'Pending',
      relative_subline: 'in 4 days · submitted 2 days ago',
      member: 'Marcus Webb',
      section: 'Snare',
    },
  ],
  ...overrides,
})

describe('StaffConflicts', () => {
  it('leads with the count and the dates it spans', () => {
    render(<StaffConflicts groups={[group()]} outCount={1} windowLabel="Mar 16 – Mar 30" />)

    expect(screen.getByText('1 member out')).toBeInTheDocument()
    expect(screen.getByText(/Across 1 date\./)).toBeInTheDocument()
  })

  it('heads each group with its date and how many are out', () => {
    render(
      <StaffConflicts
        groups={[group(), group({ date: '2026-03-21', date_label: 'Saturday, 3/21', out_count: 2 })]}
        outCount={3}
        windowLabel="Mar 16 – Mar 30"
      />
    )

    expect(screen.getByText('Friday, 3/20')).toBeInTheDocument()
    expect(screen.getByText('Saturday, 3/21')).toBeInTheDocument()
    expect(screen.getByText('2 out')).toBeInTheDocument()
  })

  it('names the member and shows where the decision landed', () => {
    render(<StaffConflicts groups={[group()]} outCount={1} windowLabel="Mar 16 – Mar 30" />)

    expect(screen.getByText('Marcus Webb')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders no control a staff member could not use', () => {
    render(<StaffConflicts groups={[group()]} outCount={1} windowLabel="Mar 16 – Mar 30" />)

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /deny/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /full reason/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /edit/i })).not.toBeInTheDocument()
  })

  it('reads an empty window as good news rather than a blank', () => {
    render(<StaffConflicts groups={[]} outCount={0} windowLabel="Mar 16 – Mar 30" />)

    expect(screen.getByText("Everyone's in")).toBeInTheDocument()
    expect(screen.getByText(/Full roster at every rehearsal/)).toBeInTheDocument()
    expect(screen.getByText(/before a coordinator has decided/)).toBeInTheDocument()
  })
})
