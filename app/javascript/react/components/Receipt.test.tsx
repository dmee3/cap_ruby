import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Receipt from './Receipt'

describe('Receipt', () => {
  it('lists one row per date with the total charged', () => {
    render(<Receipt dates={[3, 12, 17]} totalCents={3200} />)

    expect(screen.getByText('The 3rd')).toBeInTheDocument()
    expect(screen.getByText('The 12th')).toBeInTheDocument()
    expect(screen.getByText('The 17th')).toBeInTheDocument()
    expect(screen.getByText('Total charged')).toBeInTheDocument()
    expect(screen.getByText('$32')).toBeInTheDocument()
  })

  it('shows each date at its own amount, since the date is the price', () => {
    render(<Receipt dates={[3, 17]} totalCents={2000} />)

    expect(screen.getByText('$3')).toBeInTheDocument()
    expect(screen.getByText('$17')).toBeInTheDocument()
  })

  it('attributes the donation when a name was given', () => {
    render(<Receipt dates={[3]} totalCents={300} donorName="The Sokol Family" />)

    expect(screen.getByText('The Sokol Family')).toBeInTheDocument()
  })

  // Anonymous is a choice the donor made, not missing data.
  it('reads Anonymous when the donor left the name blank', () => {
    render(<Receipt dates={[3]} totalCents={300} donorName="" />)

    expect(screen.getByText('Anonymous')).toBeInTheDocument()
  })

  it('shows the card when Stripe gave us one', () => {
    render(<Receipt dates={[3]} totalCents={300} cardBrand="visa" cardLast4="4242" />)

    expect(screen.getByText(/4242/)).toBeInTheDocument()
  })

  it('omits the receipt-sent-to line rather than faking an address', () => {
    render(<Receipt dates={[3]} totalCents={300} />)

    expect(screen.queryByText('Receipt sent to')).toBeNull()
  })

  it('shows the email when Stripe supplied one', () => {
    render(<Receipt dates={[3]} totalCents={300} email="j.sokol@example.com" />)

    expect(screen.getByText('Receipt sent to')).toBeInTheDocument()
    expect(screen.getByText('j.sokol@example.com')).toBeInTheDocument()
  })

  // The mockup's #CC-4192 had no source in the app.
  it('carries no invented receipt number', () => {
    const { container } = render(<Receipt dates={[3]} totalCents={300} chargedOn="3/14/26" />)

    expect(container.textContent).not.toMatch(/#CC-/)
    expect(screen.getByText('3/14/26')).toBeInTheDocument()
  })
})
