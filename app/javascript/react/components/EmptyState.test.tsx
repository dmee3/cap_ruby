import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import EmptyState from './EmptyState'

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No conflicts submitted" />)
    expect(screen.getByText('No conflicts submitted')).toBeInTheDocument()
  })

  it('renders optional body and action', () => {
    render(
      <EmptyState
        title="Nothing here"
        body="You're clear for every rehearsal."
        action={<button type="button">Submit a conflict</button>}
      />
    )
    expect(screen.getByText("You're clear for every rehearsal.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit a conflict' })).toBeInTheDocument()
  })

  it('omits body when not given', () => {
    const { container } = render(<EmptyState title="Empty" />)
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })
})
