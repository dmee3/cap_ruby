import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import PerformerPicker from './PerformerPicker'
import { Performer } from '../../components/PerformerCard'

const performer = (overrides: Partial<Performer> = {}): Performer => ({
  token: 'tok1',
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

const roster = [
  performer(),
  performer({ token: 'tok2', name: 'Marcus Webb', initials: 'MW', section: 'Snare', raised_cents: 4600, claimed_count: 4 }),
  performer({ token: 'tok3', name: 'Nia Fletcher', initials: 'NF', section: 'Marimba', raised_cents: 49_600, claimed_count: 31, complete: true }),
]

describe('PerformerPicker', () => {
  it('lists everyone with a count', () => {
    render(<PerformerPicker performers={roster} />)

    expect(screen.getByText('Elena Sokol')).toBeInTheDocument()
    expect(screen.getByText('Marcus Webb')).toBeInTheDocument()
    expect(screen.getByText(/3 performers raising money this season/)).toBeInTheDocument()
  })

  // Deliberate: a finished calendar reads as good news, not a dead end, and
  // filtering them out would hide almost nobody anyway.
  it('keeps a fully funded performer in the list, untappable', () => {
    render(<PerformerPicker performers={roster} />)

    expect(screen.getByText('Nia Fletcher')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('has a real labelled search input', () => {
    render(<PerformerPicker performers={roster} />)

    expect(
      screen.getByRole('searchbox', { name: /search performers by name or section/i }),
    ).toBeInTheDocument()
  })

  it('filters by name', async () => {
    render(<PerformerPicker performers={roster} />)

    await userEvent.type(screen.getByRole('searchbox'), 'marcus')

    expect(screen.getByText('Marcus Webb')).toBeInTheDocument()
    expect(screen.queryByText('Elena Sokol')).toBeNull()
  })

  it('filters by section, since a donor may only remember the instrument', async () => {
    render(<PerformerPicker performers={roster} />)

    await userEvent.type(screen.getByRole('searchbox'), 'snare')

    expect(screen.getByText('Marcus Webb')).toBeInTheDocument()
    expect(screen.queryByText('Nia Fletcher')).toBeNull()
  })

  // The canvas drew a search box but never a no-results state.
  it('offers a way out when nothing matches', async () => {
    render(<PerformerPicker performers={roster} />)

    await userEvent.type(screen.getByRole('searchbox'), 'zzzz')

    expect(screen.getByText(/No performers match/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Show everyone' }))

    expect(screen.getByText('Elena Sokol')).toBeInTheDocument()
  })

  it('says the $496 rule once, where a donor can see it', () => {
    render(<PerformerPicker performers={roster} />)

    expect(screen.getByText(/a finished calendar adds up to \$496/)).toBeInTheDocument()
  })
})
