import { describe, it, expect } from 'vitest'
import { totalCents, feeCents } from './stripe_fees'

describe('stripe_fees', () => {
  it('grosses the fee up on top of the dues amount', () => {
    // 12000 / 0.97 + 30 = 12401.03... -> 12401
    expect(totalCents(12_000)).toBe(12_401)
  })

  it('rounds rather than truncates', () => {
    // matches the Ruby StripeFees spec: 12401 -> 12815
    expect(totalCents(12_401)).toBe(12_815)
  })

  it('returns the flat fee for a zero amount', () => {
    expect(totalCents(0)).toBe(30)
  })

  it('feeCents is total minus amount', () => {
    expect(feeCents(12_000)).toBe(totalCents(12_000) - 12_000)
    expect(feeCents(12_000)).toBe(401)
  })
})
