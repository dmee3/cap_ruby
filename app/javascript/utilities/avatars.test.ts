import { describe, it, expect } from 'vitest'
import { initialsFor, avatarTone, AVATAR_TONES } from './avatars'

describe('initialsFor', () => {
  it('takes the first letter of the first two words', () => {
    expect(initialsFor('Marcus Webb')).toBe('MW')
    expect(initialsFor('dana reyes')).toBe('DR')
  })

  it('stops at two, so a middle name does not overflow the disc', () => {
    expect(initialsFor('Mary Anne Smith')).toBe('MA')
  })

  it('copes with one name, extra spaces, and nothing at all', () => {
    expect(initialsFor('Prince')).toBe('P')
    expect(initialsFor('  Marcus   Webb  ')).toBe('MW')
    expect(initialsFor('')).toBe('')
  })
})

describe('avatarTone', () => {
  // The point of deriving it: a reader recognises a row by its colour, which
  // only works if the colour doesn't move between screens or reloads.
  it('gives the same name the same tone every time', () => {
    expect(avatarTone('Marcus Webb')).toBe(avatarTone('Marcus Webb'))
  })

  it('distinguishes at least some different names', () => {
    const tones = new Set(
      ['Marcus Webb', 'Dana Reyes', 'Alex Kim', 'Sam Diaz', 'Jo Park'].map(avatarTone),
    )
    expect(tones.size).toBeGreaterThan(1)
  })

  it('only ever returns a tone from the palette', () => {
    ;['Marcus Webb', 'Dana Reyes', '', 'Z'].forEach((name) => {
      expect(AVATAR_TONES).toContain(avatarTone(name) as (typeof AVATAR_TONES)[number])
    })
  })
})
