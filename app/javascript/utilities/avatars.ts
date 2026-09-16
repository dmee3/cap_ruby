// Avatars for people who have no photo: initials on a coloured disc.
//
// The colour is derived from the name rather than stored or randomised, so the
// same person is the same colour on every screen and across a reload. That is
// the whole point — a reader recognises a row by its colour before they read
// the name — so avoid Math.random() or an index-in-list scheme here.

const AVATAR_TONES = [
  'bg-ocean',
  'bg-moss',
  'bg-raspberry',
  'bg-ocean-light',
  'bg-moss-dark',
] as const

/**
 * Up to two initials: "Marcus Webb" → MW, "Mary Anne Smith" → MA.
 *
 * Capped at two because three letters don't fit a 30px disc at the label size
 * the design uses.
 */
export const initialsFor = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

/** A Tailwind background class, stable for a given name. */
export const avatarTone = (name: string): string => {
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0)
  return AVATAR_TONES[sum % AVATAR_TONES.length]
}

export { AVATAR_TONES }
