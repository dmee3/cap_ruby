// The fundraiser talks about dates ordinally and never by month: "the 3rd",
// "the 17th". No donor-facing copy says March, because the tiles are prices
// rather than appointments.

/** 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 11 -> "11th", 21 -> "21st". */
export const ordinal = (n: number): string => {
  // 11th, 12th, 13th are the exceptions that a bare last-digit rule gets wrong.
  const teens = n % 100
  if (teens >= 11 && teens <= 13) return `${n}th`

  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

/** "the 3rd" — the phrasing the fundraiser copy uses for a single date. */
export const theOrdinal = (n: number): string => `the ${ordinal(n)}`

/**
 * "the 3rd", "the 3rd and 12th", "the 3rd, 12th and 17th".
 *
 * Only the first date takes "the", so the list reads the way someone would say
 * it out loud. No serial comma before "and", matching the canvas copy.
 */
export const dateList = (dates: number[]): string => {
  const sorted = [...dates].sort((a, b) => a - b).map(ordinal)
  if (sorted.length === 0) return ''
  if (sorted.length === 1) return `the ${sorted[0]}`

  const last = sorted[sorted.length - 1]
  const rest = sorted.slice(0, -1)
  return `the ${rest.join(', ')} and ${last}`
}
