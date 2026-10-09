import { describe, it, expect } from 'vitest'
import { monthDay, monthDayYear, parseDateOnly, weekdayMonthDay } from './dates'

describe('dates', () => {
  // A date-only string parsed as UTC midnight renders as the previous day for
  // anyone west of Greenwich; this app's users are in the US.
  it('does not slip a day', () => {
    expect(parseDateOnly('2026-03-01').getDate()).toBe(1)
    expect(parseDateOnly('2026-01-01').getMonth()).toBe(0)
    expect(monthDay('2026-03-01')).toBe('3/1')
  })

  it('shows a dash for a missing date', () => {
    expect(monthDayYear(null)).toBe('—')
    expect(weekdayMonthDay(undefined)).toBe('—')
  })
})
