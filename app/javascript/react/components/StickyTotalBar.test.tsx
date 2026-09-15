import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import StickyTotalBar from './StickyTotalBar'

describe('StickyTotalBar', () => {
  it('totals the picked dates and lists them in plain English', () => {
    render(<StickyTotalBar selected={[3, 12, 17]} actionLabel="Continue" onAction={() => {}} />)

    // 3 + 12 + 17
    expect(screen.getByText('$32')).toBeInTheDocument()
    expect(screen.getByText('the 3rd, 12th and 17th')).toBeInTheDocument()
  })

  it('disables the action until something is picked', () => {
    render(<StickyTotalBar selected={[]} actionLabel="Continue" onAction={() => {}} />)

    expect(screen.getByText('$0')).toBeInTheDocument()
    expect(screen.getByText('no dates yet')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  // The $0 is content rather than a control, so it can't take the disabled
  // grey the canvas drew (~2.6:1 on white).
  it('keeps the empty total in a contrast-passing colour', () => {
    render(<StickyTotalBar selected={[]} actionLabel="Continue" onAction={() => {}} />)

    expect(screen.getByText('$0')).toHaveClass('text-secondary')
  })

  it('fires the action when something is picked', async () => {
    const onAction = vi.fn()
    render(<StickyTotalBar selected={[9]} actionLabel="Continue" onAction={onAction} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onAction).toHaveBeenCalled()
  })

  it('blocks a second submit while one is in flight', () => {
    render(<StickyTotalBar selected={[9]} actionLabel="Sending…" onAction={() => {}} busy />)

    expect(screen.getByRole('button')).toBeDisabled()
  })
})
