import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import AdminDashboard from './AdminDashboard'
import type { BurndownPoint } from '../../components/BurndownChart'

// Weekly cumulative dollars from early October to late April, collected
// trailing the plan by a growing margin until "today".
const weeks = (start: string, count: number) =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date(`${start}T12:00:00`)
    d.setDate(d.getDate() + i * 7)
    return d.toISOString().slice(0, 10)
  })

const dates = weeks('2025-10-05', 30)
const todayIndex = 18
const scheduled: BurndownPoint[] = dates.map((d, i) => [d, Math.round(57600 * Math.min(1, i / 26))])
const actual: BurndownPoint[] = dates
  .slice(0, todayIndex + 1)
  .map((d, i) => [d, Math.round(57600 * Math.min(1, i / 26) * (1 - i * 0.006))])

const meta = {
  title: 'Admin/Dashboard',
  component: AdminDashboard,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="p-4 lg:p-6"><Story /></div>],
  args: {
    seasonLabel: '2026 season',
    stats: { expected_cents: 3_987_000, collected_cents: 3_612_000, behind_count: 3, member_count: 42 },
    burndown: { scheduled, actual, today: dates[todayIndex], currency: 'USD' },
    lastVenmo: { name: 'Jordan Pike', amount_cents: 40_000, date_paid: '2026-02-07', entered_days_ago: 3 },
    newVenmoPaymentPath: '#',
    behindMembers: [
      { id: 1, name: 'Rae Quinn', section: 'World / Snare', paid_cents: 20_000, season_total_cents: 140_000, past_due_cents: 30_000 },
      { id: 2, name: 'Theo Marsh', section: 'Open / Tenors', paid_cents: 45_000, season_total_cents: 120_000, past_due_cents: 15_000 },
      { id: 3, name: 'Ava Lindqvist', section: 'World / Front Ensemble', paid_cents: 60_000, season_total_cents: 140_000, past_due_cents: 5_000 },
    ],
    recentPayments: [
      { id: 7, name: 'Sam Reed', user_id: 2, amount_cents: 60_000, date_paid: '2026-02-12', payment_type: 'Venmo' },
      { id: 8, name: 'Nina Park', user_id: 3, amount_cents: 25_000, date_paid: '2026-02-11', payment_type: 'Stripe' },
      { id: 9, name: 'Leo Brandt', user_id: 4, amount_cents: 10_000, date_paid: '2026-02-09', payment_type: 'Cash' },
    ],
    blankScheduleMembers: [
      { name: 'Marcus Vale', meta: 'New member · World / Snare', schedule_edit_path: '#' },
    ],
    conflictsToReview: [
      {
        id: 3,
        member: 'Nina Park',
        date_range_label: 'Sat 3/14',
        time_range_label: '6:30–9:30 PM',
        reason: 'Closing shift.',
        status: 'Pending',
        relative_subline: 'in 5 days · submitted 2 days ago',
      },
    ],
    whistleblowerCoverage: { count: 6, threshold: 3, users_path: '#' },
  },
} satisfies Meta<typeof AdminDashboard>

export default meta
type Story = StoryObj<typeof meta>

export const MidSeason: Story = {}

export const AllCaughtUp: Story = {
  args: {
    stats: { expected_cents: 3_987_000, collected_cents: 4_102_000, behind_count: 0, member_count: 42 },
    behindMembers: [],
    blankScheduleMembers: [],
    conflictsToReview: [],
    lastVenmo: null,
  },
}

export const WhistleblowerCoverageLow: Story = {
  args: { whistleblowerCoverage: { count: 2, threshold: 3, users_path: '#' } },
}
