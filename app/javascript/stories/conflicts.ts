import { http, HttpResponse, delay } from 'msw'

import type { CalendarConflict } from '../react/widgets/conflicts/ConflictCalendarView'
import type { TriageGroup } from '../react/widgets/conflicts/TriageQueue'
import { initialsFor } from '../utilities/avatars'

export const conflictStatuses = [
  { id: 1, name: 'Pending' },
  { id: 2, name: 'Approved' },
  { id: 3, name: 'Denied' },
]

// Days are offsets from today: FullCalendar opens on the current month and
// the queue only shows upcoming conflicts. The API sends wall-clock times
// with no zone, so these are built by hand; toISOString() would shift them
// to UTC.
const pad = (n: number) => String(n).padStart(2, '0')
const at = (daysFromToday: number, hours: number, minutes = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hours)}:${pad(minutes)}:00`
}
const nowLocal = at(0, new Date().getHours(), new Date().getMinutes())

const status = (name: string) => conflictStatuses.find((s) => s.name === name) ?? conflictStatuses[0]

export const calendarConflicts: CalendarConflict[] = [
  { id: 11, title: 'Marcus Webb', ensemble: 'World', section: 'Snare', start: at(-8, 18, 30), end: at(-8, 21, 30), reason: 'Closing shift.', status: status('Approved') },
  { id: 12, title: 'Priya Natarajan', ensemble: 'World', section: 'Front Ensemble', start: at(-7, 9), end: at(-7, 17), reason: 'Sister’s wedding.', status: status('Denied') },
  { id: 13, title: 'Jordan Ellis', ensemble: 'Open', section: 'Bass', start: at(2, 9), end: at(2, 17), reason: 'College visit.', status: status('Pending') },
  { id: 14, title: 'Sam Okafor', ensemble: 'Open', section: 'Tenors', start: at(3, 9), end: at(3, 12), reason: 'Exam.', status: status('Approved') },
  { id: 15, title: 'Riley Chen', ensemble: 'World', section: 'Cymbals', start: at(6, 18, 30), end: at(6, 21, 30), reason: 'Family trip.', status: status('Pending') },
  { id: 16, title: 'Marcus Webb', ensemble: 'World', section: 'Snare', start: at(6, 18, 30), end: at(6, 21, 30), reason: 'Closing shift again.', status: status('Pending') },
]

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

// The server builds these groups; this is a rough stand-in so the queue
// and the calendar agree on what's in a story.
export const triageGroups = (conflicts: CalendarConflict[]): TriageGroup[] => {
  const byDate = new Map<string, CalendarConflict[]>()
  conflicts.forEach((c) => {
    const date = c.start.slice(0, 10)
    byDate.set(date, [...(byDate.get(date) ?? []), c])
  })

  return Array.from(byDate.entries()).sort().map(([date, rows]) => {
    const day = new Date(rows[0].start)
    return {
      date,
      date_label: day.toLocaleDateString('en-US', { weekday: 'long', month: 'numeric', day: 'numeric' }),
      pending_count: rows.filter((r) => r.status.name === 'Pending').length,
      rows: rows.map((c) => ({
        id: c.id,
        member: c.title,
        section: c.section,
        initials: initialsFor(c.title),
        date_range_label: day.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        time_range_label: `${time(c.start)}–${time(c.end)}`,
        status: c.status.name,
        relative_subline: 'Submitted 3 days ago',
        reason: c.reason,
      })),
    }
  })
}

/**
 * The conflicts API over an in-memory copy, so a decision made in a story
 * sticks until the story reloads.
 */
export const conflictHandlers = (seed: CalendarConflict[] = calendarConflicts) => {
  let conflicts = seed.map((c) => ({ ...c }))

  return [
    http.get('/api/conflict_statuses', () => HttpResponse.json(conflictStatuses)),
    http.get('/api/conflicts', async ({ request }) => {
      await delay(300)
      const params = new URL(request.url).searchParams
      const wanted = params.get('status')
      const ensemble = params.get('ensemble')
      const upcoming = params.get('when') === 'upcoming'
      const matching = conflicts.filter(
        (c) =>
          (!wanted || c.status.name === wanted) &&
          (!ensemble || c.ensemble === ensemble) &&
          (!upcoming || c.end >= nowLocal)
      )
      return HttpResponse.json({
        conflicts: matching,
        groups: triageGroups(matching),
        counts: { Pending: conflicts.filter((c) => c.status.name === 'Pending').length, All: conflicts.length },
      })
    }),
    http.put('/api/conflicts/:id', async ({ params, request }) => {
      const body = (await request.json()) as { conflict: { status_id: number } }
      const next = conflictStatuses.find((s) => s.id === body.conflict.status_id)
      conflicts = conflicts.map((c) => (c.id === Number(params.id) && next ? { ...c, status: next } : c))
      return HttpResponse.json({})
    }),
  ]
}

export const failingConflictHandlers = [
  http.get('/api/conflict_statuses', () => HttpResponse.json(conflictStatuses)),
  http.get('/api/conflicts', () => new HttpResponse(null, { status: 500 })),
]

export const loadingConflictHandlers = [
  http.get('/api/conflict_statuses', () => HttpResponse.json(conflictStatuses)),
  http.get('/api/conflicts', async () => {
    await delay('infinite')
    return HttpResponse.json({})
  }),
]
