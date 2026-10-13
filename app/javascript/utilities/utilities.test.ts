import { describe, it, expect } from 'vitest'
import Utilities from './utilities'

describe('Utilities', () => {
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
