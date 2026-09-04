import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import DuesMeter from './DuesMeter'

const base = {
  paidCents: 36_000,
  totalCents: 60_000,
  expectedCents: 36_000,
  state: 'on-track' as const,
}

describe('DuesMeter', () => {
  it('renders a hero paid figure with the total alongside it', () => {
    render(<DuesMeter {...base} paidCents={20_000} expectedCents={40_000} />)
    expect(screen.getByText('$200.00')).toHaveClass('text-metric')
    expect(screen.getByText('of $600.00')).toBeInTheDocument()
  })

  it('shows what is left this season, and the expected-by-today figure', () => {
    render(<DuesMeter {...base} />)
    expect(screen.getByText('$240.00 left this season')).toBeInTheDocument()
    expect(screen.getByText('Expected by today:')).toBeInTheDocument()
  })

  it('swaps the left caption for a past-due amount when behind', () => {
    render(
      <DuesMeter {...base} state="behind" paidCents={24_000} committedCents={12_000} committedKind="past-due" />
    )
    expect(screen.getByText('$120.00 past due')).toHaveClass('text-danger-fg')
    expect(screen.queryByText(/left this season/)).not.toBeInTheDocument()
  })

  it('sizes the fill to paid / total', () => {
    const { container } = render(<DuesMeter {...base} paidCents={30_000} />)
    const fill = container.querySelector('.bg-moss') as HTMLElement
    expect(fill.style.width).toBe('50%')
  })

  it('places the expected-by-today tick at expected / total', () => {
    const { container } = render(<DuesMeter {...base} expectedCents={45_000} />)
    const tick = container.querySelector('[aria-hidden="true"].bg-primary') as HTMLElement
    expect(tick.style.left).toBe('75%')
  })

  it('shows a striped committed segment for a past-due gap', () => {
    const { container } = render(
      <DuesMeter {...base} state="behind" paidCents={24_000} committedCents={12_000} committedKind="past-due" />
    )
    const seg = container.querySelector('[data-committed="past-due"]') as HTMLElement
    expect(seg).not.toBeNull()
    expect(seg.style.width).toBe('20%')
    expect(seg.style.left).toBe('40%')
  })

  it('renders a plain message and no bar for the no-schedule state', () => {
    const { container } = render(<DuesMeter {...base} state="no-schedule" />)
    expect(screen.getByText(/No dues schedule set yet/)).toBeInTheDocument()
    expect(container.querySelector('.bg-moss')).toBeNull()
  })

  it('drops the expected tick when paid in full', () => {
    const { container } = render(
      <DuesMeter {...base} state="paid-in-full" paidCents={60_000} />
    )
    expect(container.querySelector('[aria-hidden="true"].bg-primary')).toBeNull()
  })
})
