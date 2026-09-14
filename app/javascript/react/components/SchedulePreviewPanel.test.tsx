import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SchedulePreviewPanel from './SchedulePreviewPanel'

describe('SchedulePreviewPanel', () => {
  it('waits for a section before forecasting anything', () => {
    render(<SchedulePreviewPanel forecast={null} waiting seasonYear="2026" />)

    expect(screen.getByText(/Waiting on a section for 2026/)).toBeTruthy()
  })

  // Live state for any season past 2026, not an edge case.
  it('says plainly when no default exists', () => {
    render(<SchedulePreviewPanel forecast={{ no_default: true }} waiting={false} seasonYear="2026" />)

    expect(screen.getByText(/No default schedule exists for 2026/)).toBeTruthy()
    expect(screen.getByText(/missing-schedule alert/i)).toBeTruthy()
  })

  // The panel describes the schedule and nothing else. What the save does to
  // the account and the welcome email differs per screen, and the
  // "What happens when you save" panel above owns that.
  it('says nothing about the account or the welcome email', () => {
    render(<SchedulePreviewPanel forecast={{ no_default: true }} waiting={false} seasonYear="2026" />)

    const card = screen.getByTestId('preview-no-default')
    expect(card.textContent).not.toMatch(/welcome email/i)
    expect(card.textContent).not.toMatch(/account/i)
  })

  it('renders the entries, the total and the lookup key', () => {
    render(
      <SchedulePreviewPanel
        waiting={false}
        seasonYear="2026"
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

  // The amber block and the header/total rows fill the card edge to edge, so
  // without overflow-hidden their square corners paint over the radius.
  it('clips its full-bleed children to the card radius', () => {
    const { rerender } = render(<SchedulePreviewPanel forecast={{ no_default: true }} waiting={false} seasonYear="2026" />)
    expect(screen.getByTestId('preview-no-default').className).toContain('overflow-hidden')

    rerender(
      <SchedulePreviewPanel
        waiting={false}
        seasonYear="2026"
        forecast={{
          entries: [{ pay_date: '2025-10-17', amount_cents: 50_000 }],
          total_cents: 50_000,
          past_due: { count: 0, amount_cents: 0 },
        }}
      />
    )
    expect(screen.getByTestId('preview-populated').className).toContain('overflow-hidden')
  })

  // On edit the previewed season is often NOT the current one, and the person
  // can be on several at once, so every state names which season it's for.
  it('names the season in the populated header', () => {
    render(
      <SchedulePreviewPanel
        waiting={false}
        seasonYear="2026"
        forecast={{
          entries: [{ pay_date: '2025-10-17', amount_cents: 50_000 }],
          total_cents: 50_000,
          lookup_key: 'World · Music · Vet',
          past_due: { count: 0, amount_cents: 0 },
        }}
      />
    )

    expect(screen.getByText('2026 schedule preview')).toBeTruthy()
  })

  it('warns when dates are already past', () => {
    render(
      <SchedulePreviewPanel
        waiting={false}
        seasonYear="2026"
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
