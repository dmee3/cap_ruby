import { describe, it, expect } from 'vitest'
import { ordinal, theOrdinal, dateList } from './ordinals'

describe('ordinal', () => {
  it('handles the three irregular suffixes', () => {
    expect(ordinal(1)).toBe('1st')
    expect(ordinal(2)).toBe('2nd')
    expect(ordinal(3)).toBe('3rd')
  })

  // The case a bare last-digit rule gets wrong.
  it('handles the teens', () => {
    expect(ordinal(11)).toBe('11th')
    expect(ordinal(12)).toBe('12th')
    expect(ordinal(13)).toBe('13th')
  })

  it('handles the twenties, where the suffixes come back', () => {
    expect(ordinal(21)).toBe('21st')
    expect(ordinal(22)).toBe('22nd')
    expect(ordinal(23)).toBe('23rd')
    expect(ordinal(24)).toBe('24th')
  })

  it('covers every date a donor can sponsor', () => {
    const all = Array.from({ length: 31 }, (_, i) => ordinal(i + 1))

    expect(all[0]).toBe('1st')
    expect(all[30]).toBe('31st')
    expect(all.every((o) => /^\d+(st|nd|rd|th)$/.test(o))).toBe(true)
  })
})

describe('theOrdinal', () => {
  it('phrases a single date the way the copy does', () => {
    expect(theOrdinal(3)).toBe('the 3rd')
  })
})

describe('dateList', () => {
  it('is empty for no dates', () => {
    expect(dateList([])).toBe('')
  })

  it('reads a single date plainly', () => {
    expect(dateList([9])).toBe('the 9th')
  })

  it('joins two with and', () => {
    expect(dateList([3, 12])).toBe('the 3rd and 12th')
  })

  it('joins three the way someone would say it', () => {
    expect(dateList([3, 12, 17])).toBe('the 3rd, 12th and 17th')
  })

  it('sorts, so tap order does not change the sentence', () => {
    expect(dateList([17, 3, 12])).toBe('the 3rd, 12th and 17th')
  })
})
