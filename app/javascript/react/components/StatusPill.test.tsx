import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StatusPill from './StatusPill'

describe('StatusPill', () => {
  it('renders the status text', () => {
    render(<StatusPill status="Approved" />)
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('maps success statuses to the success tone', () => {
    const { container } = render(<StatusPill status="Current" />)
    const pill = container.querySelector('span')
    expect(pill).toHaveClass('bg-success-bg')
    expect(pill).toHaveClass('text-success-fg')
  })

  it('maps danger statuses to the danger tone', () => {
    const { container } = render(<StatusPill status="Behind" />)
    const pill = container.querySelector('span')
    expect(pill).toHaveClass('bg-danger-bg')
    expect(pill).toHaveClass('text-danger-fg')
  })

  it('maps warning statuses to the warning tone', () => {
    const { container } = render(<StatusPill status="Pending" />)
    const pill = container.querySelector('span')
    expect(pill).toHaveClass('bg-warning-bg')
    expect(pill).toHaveClass('text-warning-fg')
  })

  it('falls back to neutral for an unknown status', () => {
    const { container } = render(<StatusPill status="Archived" />)
    const pill = container.querySelector('span')
    expect(pill).toHaveClass('bg-neutral-bg')
    expect(pill).toHaveClass('text-neutral-fg')
  })

  it('is pill-shaped with the label type scale', () => {
    const { container } = render(<StatusPill status="Complete" />)
    const pill = container.querySelector('span')
    expect(pill).toHaveClass('rounded-full')
    expect(pill).toHaveClass('text-label')
  })
})
