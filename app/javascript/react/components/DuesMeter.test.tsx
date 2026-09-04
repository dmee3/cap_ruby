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
  it('renders the paid / total label', () => {
    const { container } = render(<DuesMeter {...base} />)
    expect(container.textContent).toContain('$360.00')
    expect(container.textContent).toContain('$600.00')
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
