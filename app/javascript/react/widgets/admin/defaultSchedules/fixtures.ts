import { Combination, Overview } from './shared'

const DATES = ['2026-10-16', '2026-11-13', '2026-12-11', '2027-01-08', '2027-02-05', '2027-03-05']

const INSTALMENTS: [string, 'Music' | 'Visual', 'Vet' | 'Rookie', number, number][] = [
  ['World', 'Music', 'Vet', 360, 11],
  ['World', 'Music', 'Rookie', 400, 5],
  ['World', 'Visual', 'Vet', 300, 4],
  ['World', 'Visual', 'Rookie', 340, 3],
  ['CC2', 'Music', 'Vet', 300, 6],
  ['CC2', 'Music', 'Rookie', 340, 7],
  ['CC2', 'Visual', 'Vet', 240, 3],
  ['CC2', 'Visual', 'Rookie', 280, 3],
]

export const combinations = (missing: string[] = []): Combination[] =>
  INSTALMENTS.map(([ensemble, group, vet, each, members]) => {
    const slug = `${ensemble}-${group}-${vet}`.toLowerCase()
    const setUp = !missing.includes(slug)
    const entries = setUp
      ? DATES.map((d, i) => ({ pay_date: d, amount_cents: (i === 0 ? 500 : each) * 100 }))
      : []
    return {
      slug,
      label: `${ensemble} · ${group} · ${vet}`,
      ensemble,
      section_group: group,
      vet_status: vet,
      set_up: setUp,
      entries,
      total_cents: entries.reduce((s, e) => s + e.amount_cents, 0),
      last_changed_on: setUp ? '2026-09-28' : null,
      member_count: members,
      blank_schedule_count: setUp ? 0 : members,
    }
  })

export const overview = (missing: string[] = [], blank = 0): Overview => {
  const combos = combinations(missing)
  return {
    season: { id: 2, year: '2027' },
    member_count: 42,
    blank_schedule_count: blank || combos.reduce((s, c) => s + c.blank_schedule_count, 0),
    set_up_count: combos.filter(c => c.set_up).length,
    dates: missing.length === 8 ? [] : DATES,
    combinations: combos,
    copy_source: {
      id: 1,
      year: '2026',
      combination_count: 8,
      min_total_cents: 170_000,
      max_total_cents: 250_000,
      payment_count: 6,
      first_date: '2025-10-17',
      last_date: '2026-03-06',
    },
  }
}

export const ALL = combinations().map(c => c.slug)
