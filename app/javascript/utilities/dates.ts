// Display formats for date-only values (`YYYY-MM-DD`: due dates, paid-on
// dates). Each takes an ISO date, or null for a dash.
//
// The string parses at local noon: `new Date('2026-03-14')` is UTC midnight,
// which renders as 3/13 anywhere west of Greenwich.

const DASH = '—'

export const parseDateOnly = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12)
}

const formatter =
  (options: Intl.DateTimeFormatOptions) =>
  (iso: string | null | undefined): string =>
    iso ? new Intl.DateTimeFormat('en-US', options).format(parseDateOnly(iso)) : DASH

/** 3/14 */
export const monthDay = formatter({ month: 'numeric', day: 'numeric' })

/** 3/14/26 */
export const monthDayYear = formatter({ month: 'numeric', day: 'numeric', year: '2-digit' })

/** Fri, 3/14 */
export const weekdayMonthDay = formatter({ weekday: 'short', month: 'numeric', day: 'numeric' })

/** Fri, 3/14/26 */
export const weekdayMonthDayYear = formatter({
  weekday: 'short',
  month: 'numeric',
  day: 'numeric',
  year: '2-digit',
})

/** Mar 14 */
export const shortMonthDay = formatter({ month: 'short', day: 'numeric' })

/** Fri */
export const weekday = formatter({ weekday: 'short' })
