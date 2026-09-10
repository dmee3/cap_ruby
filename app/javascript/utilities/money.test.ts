import { describe, it, expect } from 'vitest'
import { dollars, exact, signedDollars } from './money'

describe('money', () => {
  describe('dollars', () => {
    it('drops cents from headline figures', () => {
      expect(dollars(57_600_00)).toBe('$57,600')
      expect(dollars(32_500)).toBe('$325')
    })

    it('rounds rather than truncating', () => {
      expect(dollars(32_550)).toBe('$326')
      expect(dollars(32_549)).toBe('$325')
    })

    it('handles zero', () => {
      expect(dollars(0)).toBe('$0')
    })
  })

  describe('exact', () => {
    it('always shows two decimal places', () => {
      expect(exact(32_500)).toBe('$325.00')
      expect(exact(32_530)).toBe('$325.30')
      expect(exact(0)).toBe('$0.00')
    })
  })

  describe('signedDollars', () => {
    it('marks the direction of a delta', () => {
      expect(signedDollars(60_000)).toBe('+$600')
      expect(signedDollars(-60_000)).toBe('-$600')
      expect(signedDollars(0)).toBe('+$0')
    })
  })
})
