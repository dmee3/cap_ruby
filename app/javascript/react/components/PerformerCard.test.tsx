import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PerformerCard, { Performer } from './PerformerCard'

const performer = (overrides: Partial<Performer> = {}): Performer => ({
  token: 'k7m2xqAB12cd',
  name: 'Elena Sokol',
  initials: 'ES',
  ensemble: 'World',
  section: 'Front Ensemble',
  raised_cents: 31_200,
  goal_cents: 49_600,
  claimed_count: 18,
  total_dates: 31,
  complete: false,
  ...overrides,
})

describe('PerformerCard', () => {
  it('shows the name, section and progress', () => {
    render(<PerformerCard performer={performer()} />)

    expect(screen.getByText('Elena Sokol')).toBeInTheDocument()
    expect(screen.getByText('World · Front Ensemble')).toBeInTheDocument()
    expect(screen.getByText('$312 of $496')).toBeInTheDocument()
    expect(screen.getByText(/18 of 31 dates claimed/)).toBeInTheDocument()
  })

  it('links to the performer by token, never by name or id', () => {
    render(<PerformerCard performer={performer()} />)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/fundraiser/k7m2xqAB12cd')
  })

  it('keeps the count for someone just getting started', () => {
    // The canvas swapped the count for "just getting started" below a
    // threshold it never defined, so the count stays everywhere instead.
    render(<PerformerCard performer={performer({ raised_cents: 4600, claimed_count: 4 })} />)

    expect(screen.getByText('$46 of $496')).toBeInTheDocument()
    expect(screen.getByText(/4 of 31 dates claimed/)).toBeInTheDocument()
  })

  describe('when the calendar is finished', () => {
    const done = performer({ raised_cents: 49_600, claimed_count: 31, complete: true })

    it('reads as good news rather than a dead end', () => {
      render(<PerformerCard performer={done} />)

      expect(screen.getByText(/All 31 dates claimed\. Elena is fully funded\./)).toBeInTheDocument()
    })

    it('stops being tappable', () => {
      render(<PerformerCard performer={done} />)

      expect(screen.queryByRole('link')).toBeNull()
    })
  })

  it('omits the meta line when the roster has no ensemble or section', () => {
    render(<PerformerCard performer={performer({ ensemble: null, section: null })} />)

    // No stray separator where the labels would have been.
    expect(screen.queryByText('·')).toBeNull()
    expect(screen.getByText('Elena Sokol')).toBeInTheDocument()
  })
})
