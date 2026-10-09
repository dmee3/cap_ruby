import { describe, it, expect } from 'vitest'
import { historyDate } from './history_dates'

const TODAY = new Date(2026, 2, 10) // 3/10/26

describe('historyDate', () => {
  it('uses a weekday inside 14 days', () => {
    expect(historyDate('2026-03-07', TODAY)).toBe('Sat, 3/7')
    expect(historyDate('2026-03-03', TODAY)).toBe('Tue, 3/3')
  })

  it('uses a bare date beyond 14 days', () => {
    expect(historyDate('2026-02-14', TODAY)).toBe('2/14/26')
    expect(historyDate('2026-01-20', TODAY)).toBe('1/20/26')
  })

  it('switches format exactly at the 14-day boundary', () => {
    expect(historyDate('2026-02-25', TODAY)).toBe('Wed, 2/25') // 13 days
    expect(historyDate('2026-02-24', TODAY)).toBe('2/24/26') // 14 days
  })

  it('treats today as recent', () => {
    expect(historyDate('2026-03-10', TODAY)).toBe('Tue, 3/10')
  })
})
