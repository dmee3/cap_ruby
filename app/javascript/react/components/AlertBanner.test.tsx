import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import AlertBanner from './AlertBanner'

describe('AlertBanner', () => {
  it('renders a headline and body', () => {
    render(<AlertBanner headline="2 members have no payment schedule" body="They're missing from the burndown." />)
    expect(screen.getByText('2 members have no payment schedule')).toBeInTheDocument()
    expect(screen.getByText("They're missing from the burndown.")).toBeInTheDocument()
  })

  it('keeps the headline in primary text — the rail carries the tone', () => {
    render(<AlertBanner headline="2 members have no payment schedule" />)
    const headline = screen.getByText('2 members have no payment schedule')
    expect(headline).toHaveClass('text-body-sm', 'font-semibold', 'text-primary')
    expect(headline.className).not.toMatch(/text-warning-fg/)
  })

  it('renders the embedded action list with a name, a meta column and a link', () => {
    render(
      <AlertBanner
        headline="x"
        actions={[
          {
            label: 'Marcus Vale',
            meta: 'New member · Battery / Snare',
            href: '/admin/payment_schedules/7/edit',
          },
          { label: 'Dana Lee', href: '/admin/payment_schedules/9/edit', linkLabel: 'Fix it' },
        ]}
      />,
    )
    expect(screen.getByText('Marcus Vale')).toHaveClass('font-semibold')
    expect(screen.getByText('New member · Battery / Snare')).toHaveClass('text-caption', 'text-secondary')
    expect(screen.getByRole('link', { name: 'Set up schedule' })).toHaveAttribute(
      'href',
      '/admin/payment_schedules/7/edit',
    )
    expect(screen.getByRole('link', { name: 'Fix it' })).toBeInTheDocument()
  })

  it('calls onDismiss when the dismiss control is clicked', async () => {
    const onDismiss = vi.fn()
    render(<AlertBanner headline="x" onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss ✕' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('has no dismiss control when onDismiss is omitted', () => {
    render(<AlertBanner headline="x" />)
    expect(screen.queryByRole('button', { name: /Dismiss/ })).not.toBeInTheDocument()
  })
})
