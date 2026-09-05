import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MemberConflictList from './MemberConflictList'

const conflict = {
  id: 1,
  date_range_label: 'Fri 3/14',
  time_range_label: '6:30–9:30 PM',
  status: 'Pending' as const,
  relative_subline: 'In 4 days · submitted 3 days ago',
}

describe('MemberConflictList', () => {
  it('renders a row per conflict', () => {
    render(
      <MemberConflictList
        conflicts={[conflict, { ...conflict, id: 2, status: 'Approved', date_range_label: 'Sat 3/22' }]}
      />
    )
    expect(screen.getByText(/Fri 3\/14/)).toBeInTheDocument()
    expect(screen.getByText(/Sat 3\/22/)).toBeInTheDocument()
  })

  it('shows the default empty state when there are no conflicts', () => {
    render(<MemberConflictList conflicts={[]} />)
    expect(screen.getByText("You're clear for every rehearsal.", { exact: false })).toBeInTheDocument()
  })

  it('accepts custom empty-state copy per screen', () => {
    render(<MemberConflictList conflicts={[]} emptyTitle="Nothing on the books" emptyBody="Custom copy here" />)
    expect(screen.getByText('Nothing on the books')).toBeInTheDocument()
    expect(screen.getByText('Custom copy here')).toBeInTheDocument()
  })

  it('passes reason through only for rows that have one', () => {
    render(
      <MemberConflictList
        conflicts={[
          { ...conflict, reason: 'Driving my sister back to school.' },
          { ...conflict, id: 2, date_range_label: 'Sat 3/22' },
        ]}
      />
    )
    expect(screen.getByText('Driving my sister back to school.')).toBeInTheDocument()
  })
})
