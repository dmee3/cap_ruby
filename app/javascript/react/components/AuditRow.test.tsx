import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AuditRow, { AuditEntry } from './AuditRow'

const entry = (overrides: Partial<AuditEntry> = {}): AuditEntry => ({
  id: 1,
  change: -6,
  previousQuantity: 24,
  performedOn: '2026-03-03',
  userName: 'Marcus Webb',
  ...overrides,
})

const TODAY = new Date(2026, 2, 10) // 3/10/26

describe('AuditRow', () => {
  // The whole point of the screen: four years of user_id that was stored and
  // never shown.
  it('leads with who made the change', () => {
    render(<AuditRow entry={entry()} today={TODAY} />)

    expect(screen.getByText('Marcus Webb')).toBeInTheDocument()
    expect(screen.getByText('MW')).toBeInTheDocument()
  })

  it('always shows the sign, with a real minus', () => {
    render(<AuditRow entry={entry()} today={TODAY} />)
    expect(screen.getByText('−6')).toBeInTheDocument()
  })

  it('shows a plus on an increase', () => {
    render(<AuditRow entry={entry({ change: 24 })} today={TODAY} />)
    expect(screen.getByText('+24')).toBeInTheDocument()
  })

  it('names the opening balance a first count', () => {
    render(<AuditRow entry={entry({ change: 24, previousQuantity: 0 })} today={TODAY} />)
    expect(screen.getByText('First count')).toBeInTheDocument()
  })

  it('distinguishes stock going in from stock going out', () => {
    const { rerender } = render(<AuditRow entry={entry({ change: 12, previousQuantity: 4 })} today={TODAY} />)
    expect(screen.getByText('Added stock')).toBeInTheDocument()

    rerender(<AuditRow entry={entry()} today={TODAY} />)
    expect(screen.getByText('Took stock out')).toBeInTheDocument()
  })

  // jsdom has no viewport, so both the desktop and phone lines render; the
  // run appears in each.
  it('shows the count before and after', () => {
    render(<AuditRow entry={entry()} today={TODAY} />)
    expect(screen.getAllByText(/24 →/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('18').length).toBeGreaterThan(0)
  })

  it('gives the same person the same avatar colour every time', () => {
    const { container: first } = render(<AuditRow entry={entry()} today={TODAY} />)
    const { container: second } = render(
      <AuditRow entry={entry({ id: 2, change: 3, performedOn: '2026-01-02' })} today={TODAY} />,
    )

    const tone = (c: HTMLElement) => c.querySelector('span[aria-hidden="true"]')?.className
    expect(tone(first)).toEqual(tone(second))
  })
})
