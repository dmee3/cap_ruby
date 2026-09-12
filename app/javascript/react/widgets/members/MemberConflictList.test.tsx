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
    expect(screen.getByText('Nothing on the books')).toBeInTheDocument()
    expect(screen.getByText(/say so early/)).toBeInTheDocument()
  })

  it('accepts custom empty-state copy per screen', () => {
    render(<MemberConflictList conflicts={[]} emptyTitle="Nothing submitted yet" emptyBody="Custom copy here" />)
    expect(screen.getByText('Nothing submitted yet')).toBeInTheDocument()
    expect(screen.getByText('Custom copy here')).toBeInTheDocument()
  })

  it('wraps the rows in a list card with a sentence-case title and a count', () => {
    render(<MemberConflictList conflicts={[conflict]} cardTitle="Already submitted" cardCount="2026 Season · 1" />)
    // text-h3, not the uppercase `card-title` kicker the hand-rolled card used.
    const title = screen.getByText('Already submitted')
    expect(title).toBeInTheDocument()
    expect(title.className).toMatch(/text-h3/)
    expect(screen.getByText('2026 Season · 1')).toBeInTheDocument()
  })

  it('renders rows bare when no card title is given', () => {
    render(<MemberConflictList conflicts={[conflict]} />)
    expect(screen.queryByText('Already submitted')).not.toBeInTheDocument()
  })

  // Regression: the rows used to sit in a `divide-y` wrapper, which insets the
  // divider by the card's padding instead of running to its edges.
  it('puts padding and the divider on the row so the line is full-bleed', () => {
    const { container } = render(
      <MemberConflictList conflicts={[conflict, { ...conflict, id: 2 }]} cardTitle="Already submitted" />
    )
    expect(container.querySelector('.divide-y')).toBeNull()
    // `py-3` distinguishes a row from the card's own header strip.
    const rows = container.querySelectorAll('.border-b.px-4.py-3')
    expect(rows.length).toBe(2)
    // ...and the last row drops its border so the card edge isn't doubled.
    expect(rows[1].className).toMatch(/last:border-0/)
  })

  // The dashboard opts into Edit links but brings its own card, so the two
  // options have to be independent of each other.
  it('offers Edit links without a list card (the dashboard shape)', () => {
    render(
      <MemberConflictList
        showEditLinks
        conflicts={[{ ...conflict, editable: true, edit_path: '/members/conflicts/1/edit' }]}
      />
    )
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/members/conflicts/1/edit')
    expect(screen.queryByText('All conflicts')).not.toBeInTheDocument()
  })

  // Every caller mounts this in a flush card, so the rows carry their own
  // horizontal padding whether or not this widget draws the card itself.
  it('pads the rows even when the caller brings its own card', () => {
    const { container } = render(<MemberConflictList conflicts={[conflict]} />)
    expect(container.querySelector('.border-b.px-4.py-3')).not.toBeNull()
  })

  it('shows Edit only on editable rows when the screen opts in', () => {
    render(
      <MemberConflictList
        showEditLinks
        conflicts={[
          { ...conflict, editable: true, edit_path: '/members/conflicts/1/edit' },
          { ...conflict, id: 2, date_range_label: 'Sat 3/22', status: 'Approved', editable: false },
        ]}
      />
    )
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/members/conflicts/1/edit')
    // The decided row still says Edit, just not as a link.
    expect(screen.getAllByText('Edit')).toHaveLength(2)
  })

  // Both member screens opt in now; this keeps the default honest for any
  // future read-only caller.
  it('hides Edit entirely on screens that do not opt in', () => {
    render(
      <MemberConflictList
        conflicts={[{ ...conflict, editable: true, edit_path: '/members/conflicts/1/edit' }]}
      />
    )
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
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
