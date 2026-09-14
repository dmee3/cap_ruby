import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SchedulePreviewPanel from './SchedulePreviewPanel'

describe('SchedulePreviewPanel', () => {
  it('waits for a section before forecasting anything', () => {
    render(<SchedulePreviewPanel forecast={null} waiting />)

    expect(screen.getByText('Waiting on a section')).toBeTruthy()
  })

  // Live state for any season past 2026, not an edge case.
  it('says plainly when no default exists', () => {
    render(<SchedulePreviewPanel forecast={{ no_default: true }} waiting={false} />)

    expect(screen.getByText(/no default schedule exists/i)).toBeTruthy()
    expect(screen.getByText(/account is still created/i)).toBeTruthy()
  })

  it('renders the entries, the total and the lookup key', () => {
    render(
      <SchedulePreviewPanel
        waiting={false}
        forecast={{
          entries: [
            { pay_date: '2025-10-17', amount_cents: 50_000 },
            { pay_date: '2025-11-14', amount_cents: 40_000 },
          ],
          total_cents: 90_000,
          lookup_key: 'World · Music · Rookie',
          past_due: { count: 0, amount_cents: 0 },
        }}
      />
    )

    expect(screen.getByText('10/17/25')).toBeTruthy()
    expect(screen.getByText('$500')).toBeTruthy()
    expect(screen.getByText('$900')).toBeTruthy()
    // Visual/Music — never "Battery", whatever the canvas says.
    expect(screen.getByText('World · Music · Rookie')).toBeTruthy()
  })

  it('warns when dates are already past', () => {
    render(
      <SchedulePreviewPanel
        waiting={false}
        forecast={{
          entries: [{ pay_date: '2025-10-17', amount_cents: 50_000 }],
          total_cents: 50_000,
          past_due: { count: 2, amount_cents: 97_500 },
        }}
      />
    )

    expect(screen.getByText('2 dates are already past')).toBeTruthy()
    expect(screen.getByText(/\$975 reads as due/)).toBeTruthy()
  })
})
