import { describe, it, expect, beforeEach, vi } from 'vitest'
import Utilities from './utilities'

describe('Utilities', () => {
  describe('formatMoney', () => {
    it('formats cents to dollars with symbol', () => {
      expect(Utilities.formatMoney(1000)).toBe('$10.00')
      expect(Utilities.formatMoney(5000)).toBe('$50.00')
    })

    it('handles zero', () => {
      expect(Utilities.formatMoney(0)).toBe('$0.00')
    })

    it('handles large amounts', () => {
      expect(Utilities.formatMoney(123456)).toBe('$1,234.56')
    })

    it('handles single cents', () => {
      expect(Utilities.formatMoney(1)).toBe('$0.01')
      expect(Utilities.formatMoney(99)).toBe('$0.99')
    })

    it('handles negative values', () => {
      expect(Utilities.formatMoney(-1000)).toBe('-$10.00')
    })
  })

  describe('statusToColor', () => {
    it('returns green for Approved', () => {
      expect(Utilities.statusToColor('Approved')).toBe('green')
    })

    it('returns red for Denied', () => {
      expect(Utilities.statusToColor('Denied')).toBe('red')
    })

    it('returns yellow for Pending', () => {
      expect(Utilities.statusToColor('Pending')).toBe('yellow')
    })

    it('returns gray for unknown status', () => {
      expect(Utilities.statusToColor('Unknown')).toBe('gray')
      expect(Utilities.statusToColor('')).toBe('gray')
    })

    it('is case-sensitive', () => {
      expect(Utilities.statusToColor('approved')).toBe('gray')
      expect(Utilities.statusToColor('APPROVED')).toBe('gray')
    })
  })

  describe('formatMmDdYyyy', () => {
    it('formats date as MM/DD/YYYY', () => {
      const date = new Date(2024, 2, 15) // March 15, 2024 (month is 0-indexed)
      expect(Utilities.formatMmDdYyyy(date)).toBe('3/15/2024')
    })

    it('handles single-digit months and days', () => {
      const date = new Date(2024, 0, 5) // January 5, 2024
      expect(Utilities.formatMmDdYyyy(date)).toBe('1/5/2024')
    })

    it('handles December 31', () => {
      const date = new Date(2024, 11, 31) // December 31, 2024
      expect(Utilities.formatMmDdYyyy(date)).toBe('12/31/2024')
    })
  })

  describe('formatIsoDate', () => {
    it('formats date as YYYY-M-D', () => {
      const date = new Date(2024, 2, 15) // March 15, 2024 (month is 0-indexed)
      expect(Utilities.formatIsoDate(date)).toBe('2024-3-15')
    })

    it('handles single-digit months and days without padding', () => {
      const date = new Date(2024, 0, 5) // January 5, 2024
      expect(Utilities.formatIsoDate(date)).toBe('2024-1-5')
    })
  })

  describe('dateSorter', () => {
    it('returns negative when first date is earlier', () => {
      const result = Utilities.dateSorter('2024-01-01', '2024-12-31')
      expect(result).toBeLessThan(0)
    })

    it('returns positive when first date is later', () => {
      const result = Utilities.dateSorter('2024-12-31', '2024-01-01')
      expect(result).toBeGreaterThan(0)
    })

    it('returns zero for same dates', () => {
      const result = Utilities.dateSorter('2024-06-15', '2024-06-15')
      expect(result).toBe(0)
    })
  })

  describe('compareToToday', () => {
    beforeEach(() => {
      // Mock current date to 2024-11-14
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-11-14T12:00:00Z'))
    })

    it('returns negative for past dates', () => {
      const result = Utilities.compareToToday('2024-11-13')
      expect(result).toBeLessThan(0)
    })

    it('returns positive for future dates', () => {
      const result = Utilities.compareToToday('2024-11-15')
      expect(result).toBeGreaterThan(0)
    })

    it('returns zero for today', () => {
      const result = Utilities.compareToToday('2024-11-14')
      expect(result).toBe(0)
    })
  })

  describe('dateWithTZ', () => {
    it('creates date with EST timezone offset', () => {
      const result = Utilities.dateWithTZ('2024-11-14')
      expect(result).toBeInstanceOf(Date)
      // Verify the date string format is parsed correctly
      expect(result.toISOString()).toContain('2024-11-14')
    })
  })

  describe('readCookie', () => {
    beforeEach(() => {
      // Clear document.cookie
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim()
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })
    })

    it('returns cookie value when cookie exists', () => {
      document.cookie = 'testCookie=testValue'
      expect(Utilities.readCookie('testCookie')).toBe('testValue')
    })

    it('returns null when cookie does not exist', () => {
      expect(Utilities.readCookie('nonExistent')).toBeNull()
    })

    it('handles cookies with spaces in value', () => {
      document.cookie = 'spaceCookie=value with spaces'
      expect(Utilities.readCookie('spaceCookie')).toBe('value with spaces')
    })

    it('trims whitespace around cookie names', () => {
      document.cookie = ' trimCookie=value'
      expect(Utilities.readCookie('trimCookie')).toBe('value')
    })
  })

  describe('getAuthToken', () => {
    it('retrieves CSRF token from meta tag', () => {
      const meta = document.createElement('meta')
      meta.name = 'csrf-token'
      meta.content = 'test-token-123'
      document.head.appendChild(meta)

      expect(Utilities.getAuthToken()).toBe('test-token-123')

      document.head.removeChild(meta)
    })
  })

  describe('fileToDataString', () => {
    it('converts file to data URL string', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const result = await Utilities.fileToDataString(file)

      expect(result).toContain('data:text/plain;base64,')
    })

    it('handles different file types', async () => {
      const file = new File(['{}'], 'test.json', { type: 'application/json' })
      const result = await Utilities.fileToDataString(file)

      expect(result).toContain('data:application/json;base64,')
    })
  })
})
