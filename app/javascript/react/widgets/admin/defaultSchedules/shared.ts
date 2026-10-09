
export type DefaultEntry = { pay_date: string; amount_cents: number }

export type Combination = {
  slug: string
  label: string
  ensemble: string
  section_group: 'Music' | 'Visual'
  vet_status: 'Vet' | 'Rookie'
  set_up: boolean
  entries: DefaultEntry[]
  total_cents: number
  last_changed_on: string | null
  member_count: number
  blank_schedule_count: number
}

export type CopySource = {
  id: number
  year: string
  combination_count: number
  min_total_cents: number
  max_total_cents: number
  payment_count: number
  first_date: string
  last_date: string
}

export type Overview = {
  season: { id: number; year: string }
  member_count: number
  blank_schedule_count: number
  set_up_count: number
  dates: string[]
  combinations: Combination[]
  copy_source: CopySource | null
}

export const ENSEMBLE_NAMES: Record<string, string> = { World: 'World', CC2: 'Cap City 2' }

export const editPath = (slug: string) => `/admin/season/default-schedules/${slug}`
export const OVERVIEW_PATH = '/admin/season/default-schedules'
export const COPY_PATH = '/admin/season/default-schedules/copy'
export const DATES_PATH = '/admin/season/default-schedules/dates'

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
