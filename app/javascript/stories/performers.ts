import type { Performer } from '../react/components/PerformerCard'

export const performer = (overrides: Partial<Performer> = {}): Performer => ({
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

export const performers: Performer[] = [
  performer(),
  performer({ token: 'tok2', name: 'Marcus Webb', initials: 'MW', section: 'Snare', raised_cents: 4_600, claimed_count: 4 }),
  performer({ token: 'tok3', name: 'Nia Fletcher', initials: 'NF', section: 'Marimba', raised_cents: 49_600, claimed_count: 31, complete: true }),
  performer({ token: 'tok4', name: 'Jordan Ellis', initials: 'JE', ensemble: 'Open', section: 'Bass', raised_cents: 0, claimed_count: 0 }),
  performer({ token: 'tok5', name: 'Riley Chen', initials: 'RC', section: 'Cymbals', raised_cents: 22_100, claimed_count: 12 }),
]
