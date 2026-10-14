import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'

import Member360, { Member360Data } from './Member360'

const data: Member360Data = {
  season_label: '2026 Season',
  identity: {
    id: 1,
    name: 'Rae Quinn',
    first_name: 'Rae',
    username: 'rquinn',
    email: 'rae@example.com',
    phone: '(614) 555-0142',
    ensemble: 'World',
    section: 'Snare',
    role: 'member',
    vet: true,
    removed: false,
    member_type: 'vet',
  },
  dues: { state: 'behind', paid: 40_000, total: 140_000, expected: 70_000, past_due: 30_000 },
  roles_by_season: [
    { year: '2026', ensemble: 'World', section: 'Snare', role: 'member', current: true },
    { year: '2025', ensemble: 'Open', section: 'Snare', role: 'member', current: false },
  ],
  schedule: {
    id: 9,
    total_cents: 140_000,
    entries: [
      { id: 1, pay_date: '2025-10-15', amount_cents: 20_000, covered: true, status: 'paid', status_label: 'Paid' },
      { id: 2, pay_date: '2025-11-15', amount_cents: 20_000, covered: true, status: 'paid', status_label: 'Paid' },
      { id: 3, pay_date: '2025-12-15', amount_cents: 30_000, covered: false, status: 'late', status_label: 'Late' },
      { id: 4, pay_date: '2026-02-15', amount_cents: 35_000, covered: false, status: 'due-next', status_label: 'Due next' },
      { id: 5, pay_date: '2026-03-15', amount_cents: 35_000, covered: false, status: 'not-due', status_label: 'Not due' },
    ],
  },
  schedule_setup_href: '#',
  payment_rows: [
    { id: 21, amount_cents: 20_000, date_paid: '2025-10-14', payment_type: 'Stripe', notes: null, deleted: false, edit_href: '#', restore_href: '/admin/payments/21/restore' },
    { id: 22, amount_cents: 20_000, date_paid: '2025-11-16', payment_type: 'Venmo', notes: 'Sent from a parent’s account', deleted: false, edit_href: '#', restore_href: '/admin/payments/22/restore' },
    { id: 23, amount_cents: 5_000, date_paid: '2025-11-20', payment_type: 'Cash', notes: 'Entered twice', deleted: true, edit_href: '#', restore_href: '/admin/payments/23/restore' },
  ],
  payments_summary: { count: 2, total_cents: 40_000 },
  conflict_rows: [
    { id: 31, date_range_label: 'Sat 3/14', time_range_label: '9:00 AM–5:00 PM', status: 'Approved', relative_subline: 'in 4 weeks' },
  ],
  conflicts_count: 1,
  fundraiser: { raised_cents: 42_000, dates_covered: 14, dates_target: 25 },
}

const meta = {
  title: 'Admin/Users/Member 360',
  component: Member360,
  args: { data, csrfToken: 'storybook' },
  parameters: {
    msw: {
      handlers: [
        http.delete('/admin/payments/:id', () => HttpResponse.json({})),
        http.put('/admin/payments/:id/restore', () => HttpResponse.json({})),
      ],
    },
  },
} satisfies Meta<typeof Member360>

export default meta
type Story = StoryObj<typeof meta>

export const BehindOnDues: Story = {}

export const PaidInFull: Story = {
  args: {
    data: {
      ...data,
      dues: { state: 'paid_in_full', paid: 140_000, total: 140_000, expected: 70_000, past_due: 0 },
      schedule: {
        ...data.schedule,
        entries: data.schedule.entries.map((e) => ({ ...e, covered: true, status: 'paid' as const, status_label: 'Paid' })),
      },
    },
  },
}

export const NoSchedule: Story = {
  args: {
    data: {
      ...data,
      identity: { ...data.identity, vet: false, member_type: 'new' },
      dues: { state: 'no_schedule', paid: 0, total: 0, expected: 0, past_due: 0 },
      schedule: { id: null, total_cents: 0, entries: [] },
      payment_rows: [],
      payments_summary: { count: 0, total_cents: 0 },
      conflict_rows: [],
      conflicts_count: 0,
    },
  },
}
