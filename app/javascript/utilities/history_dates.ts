// An audit trail is read two ways: "when in the last couple of weeks did this
// happen" and "roughly when, historically". A weekday answers the first and is
// useless for the second, so the format switches at 14 days.

import { monthDayYear, parseDateOnly, weekdayMonthDay } from './dates'

const DAY_MS = 24 * 60 * 60 * 1000
export const RECENT_DAYS = 14


export const historyDate = (value: string, today: Date = new Date()): string => {
  const date = parseDateOnly(value)
  const midday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12)
  const daysAgo = Math.round((midday.getTime() - date.getTime()) / DAY_MS)

  return daysAgo >= 0 && daysAgo < RECENT_DAYS ? weekdayMonthDay(value) : monthDayYear(value)
}
