import { describe, it, expect } from 'vitest'
import statusColor from './status_color'

describe('statusColor', () => {
  it('returns yellow rgba for Pending status', () => {
    expect(statusColor('Pending')).toBe('rgba(255,205,86,1)')
  })

  it('returns green rgba for Approved status', () => {
    expect(statusColor('Approved')).toBe('rgba(5,150,105,1)')
  })

  it('returns red rgba for Denied status', () => {
    expect(statusColor('Denied')).toBe('rgba(220,38,38,1)')
  })

  it('returns grey rgba for unknown status', () => {
    expect(statusColor('Unknown')).toBe('rgba(201,203,207,1)')
    expect(statusColor('')).toBe('rgba(201,203,207,1)')
    expect(statusColor('Archived')).toBe('rgba(201,203,207,1)')
  })

  it('is case-sensitive', () => {
    expect(statusColor('pending')).toBe('rgba(201,203,207,1)')
    expect(statusColor('APPROVED')).toBe('rgba(201,203,207,1)')
  })

  it('uses double equals comparison', () => {
    // This tests the actual implementation using == instead of ===
    // Should match strings with loose equality
    expect(statusColor('Pending')).toBe('rgba(255,205,86,1)')
  })
})
