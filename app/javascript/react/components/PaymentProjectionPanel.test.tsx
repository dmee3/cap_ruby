import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PaymentProjectionPanel from './PaymentProjectionPanel'

const member = {
  id: 12,
  name: 'Rae Quinn',
  paidBeforeCents: 20_000,
  seasonTotalCents: 60_000,
  expectedCents: 30_000,
}

describe('PaymentProjectionPanel', () => {
  it('shows a placeholder when no member is selected', () => {
    render(<PaymentProjectionPanel member={null} thisPaymentCents={0} />)
    expect(screen.getByText('Pick a member to see how this payment moves their dues.')).toBeInTheDocument()
  })

  it('shows the three-row ledger for the selected member', () => {
    render(<PaymentProjectionPanel member={member} thisPaymentCents={10_000} />)
    expect(screen.getByText('Paid before').nextSibling).toHaveTextContent('$200.00')
    expect(screen.getByText('This payment').nextSibling).toHaveTextContent('+$100.00')
    expect(screen.getByText('Still owed').nextSibling).toHaveTextContent('$300.00')
  })

  it('verdicts "fully paid up" when the payment clears the season total', () => {
    render(<PaymentProjectionPanel member={member} thisPaymentCents={40_000} />)
    expect(screen.getByText('Fully paid up for the season after this.')).toBeInTheDocument()
  })

  it('verdicts a shortfall against what is expected by today', () => {
    render(<PaymentProjectionPanel member={member} thisPaymentCents={5_000} />)
    // paid after = $250, expected $300 → $50 short
    expect(screen.getByText(/Still \$50\.00 short of what’s expected by today\./)).toBeInTheDocument()
  })

  it('links to the member 360', () => {
    render(<PaymentProjectionPanel member={member} thisPaymentCents={0} />)
    expect(screen.getByRole('link', { name: /Member 360/ })).toHaveAttribute('href', '/admin/users/12')
  })
})
