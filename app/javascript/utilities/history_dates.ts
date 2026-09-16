// An audit trail is read two ways: "when in the last couple of weeks did this
// happen" and "roughly when, historically". A weekday answers the first and is
// useless for the second, so the format switches at 14 days.
//
// performed_on is a DATE with no time, so these parse at local noon to keep a
// UTC-midnight string from rendering as the previous day.

const DAY_MS = 24 * 60 * 60 * 1000
export const RECENT_DAYS = 14

export const parseDateOnly = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12)
}

export const historyDate = (value: string, today: Date = new Date()): string => {
  const date = parseDateOnly(value)
  const midday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12)
  const daysAgo = Math.round((midday.getTime() - date.getTime()) / DAY_MS)

  if (daysAgo >= 0 && daysAgo < RECENT_DAYS) {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
    }).format(date)
  }

  const year = String(date.getFullYear()).slice(-2)
  return `${date.getMonth() + 1}/${date.getDate()}/${year}`
}
