import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PaymentRow from './PaymentRow'

describe('PaymentRow', () => {
  it('renders a paid row with method initials and a moss amount', () => {
    const { container } = render(
      <PaymentRow variant="paid" date="Thu 1/15/26" amountCents={12_000} method="Card" subline="Card · $4.01 fee on top" />
    )
    expect(screen.getByText('CD')).toBeInTheDocument()
    expect(screen.getByText('$120.00')).toHaveClass('text-success-fg')
    expect(screen.getByText(/fee on top/)).toBeInTheDocument()
  })

  it('renders an upcoming row with a day chip and a secondary amount', () => {
    render(
      <PaymentRow variant="upcoming" date="Wed 4/15/26" amountCents={12_000} installmentChip="15" subline="Final installment" />
    )
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('$120.00')).toHaveClass('text-secondary')
  })

  it('gives past-due rows a raspberry accent and danger amount', () => {
    const { container } = render(
      <PaymentRow variant="past-due" date="Fri 2/14/26" amountCents={12_000} installmentChip="14" />
    )
    expect(container.firstElementChild?.className).toMatch(/border-l-danger-fg/)
    expect(screen.getByText('$120.00')).toHaveClass('text-danger-fg')
  })

  it('shows a spinner for a pending row', () => {
    const { container } = render(
      <PaymentRow variant="pending" date="Today" amountCents={12_000} />
    )
    expect(container.querySelector('.animate-spin')).not.toBeNull()
  })
})
