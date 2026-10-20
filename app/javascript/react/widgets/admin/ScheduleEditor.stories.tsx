import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse, delay } from 'msw'

import ScheduleEditor, { ScheduleEditorData } from './ScheduleEditor'

const data: ScheduleEditorData = {
  schedule_id: 9,
  season_label: '2026 Season',
  member: { id: 1, name: 'Rae Quinn', ensemble: 'World', section: 'Snare', vet: true, member_type: 'vet' },
  paid_cents: 40_000,
  planned_cents: 140_000,
  locked_count: 2,
  matches_default: false,
  entries: [
    { id: 1, pay_date: '2025-10-15', amount_cents: 20_000, status: 'paid', days_late: null, covered_on: 'Oct 14' },
    { id: 2, pay_date: '2025-11-15', amount_cents: 20_000, status: 'paid', days_late: null, covered_on: 'Nov 16' },
    { id: 3, pay_date: '2025-12-15', amount_cents: 30_000, status: 'late', days_late: 61, covered_on: null },
    { id: 4, pay_date: '2026-02-15', amount_cents: 35_000, status: 'due-next', days_late: null, covered_on: null },
    { id: 5, pay_date: '2026-03-15', amount_cents: 35_000, status: 'not-due', days_late: null, covered_on: null },
  ],
}

const defaultDiff = {
  locked_count: 2,
  diff: [
    { pay_date: '2025-12-15', from_date: null, to_date: null, kind: 'changed', from_cents: 30_000, to_cents: 25_000, locked: false },
    { pay_date: '2026-01-15', from_date: null, to_date: null, kind: 'added', from_cents: null, to_cents: 10_000, locked: false },
  ],
}

let nextId = 100

const handlers = (diff: object = defaultDiff) => [
  http.get('/api/admin/payment_schedules/:id/default-preview', () => HttpResponse.json(diff)),
  http.post('/api/admin/payment_schedules/add-entry', () =>
    HttpResponse.json({ id: nextId++, pay_date: '2026-04-15', amount: 0 })
  ),
  http.post('/api/admin/payment_schedules/remove-entry', () => HttpResponse.json({})),
  http.post('/api/admin/payment_schedules/apply-default', () => HttpResponse.json({})),
  // Success makes the widget leave for the member's page, which isn't there
  // in Storybook; the save stays pending so the saving state can be seen.
  http.put('/api/admin/payment_schedules/:id', async () => {
    await delay('infinite')
    return HttpResponse.json({})
  }),
]

const meta = {
  title: 'Admin/Payments/Schedule editor',
  component: ScheduleEditor,
  args: { data },
  parameters: { msw: { handlers: handlers() } },
} satisfies Meta<typeof ScheduleEditor>

export default meta
type Story = StoryObj<typeof meta>

export const DriftedFromDefault: Story = {}

export const MatchesDefault: Story = {
  args: { data: { ...data, matches_default: true } },
  parameters: { msw: { handlers: handlers({ locked_count: 2, diff: [] }) } },
}
