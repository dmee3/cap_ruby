import type { Meta, StoryObj } from '@storybook/react-vite'

import DuesTimeline from './DuesTimeline'

const meta = {
  title: 'Members/Dues/Timeline',
  component: DuesTimeline,
  args: {
    paid: [
      { kind: 'paid', date: '2025-10-14', amount_cents: 20_000, method: 'Stripe', installment_chip: '1 of 5' },
      { kind: 'paid', date: '2025-11-16', amount_cents: 20_000, method: 'Venmo', installment_chip: '2 of 5' },
    ],
    upcoming: [
      { kind: 'past-due', date: '2025-12-15', amount_cents: 30_000, subline: '61 days late', installment_chip: '3 of 5' },
      { kind: 'upcoming', date: '2026-02-15', amount_cents: 35_000, installment_chip: '4 of 5' },
      { kind: 'upcoming', date: '2026-03-15', amount_cents: 35_000, installment_chip: '5 of 5' },
    ],
  },
} satisfies Meta<typeof DuesTimeline>

export default meta
type Story = StoryObj<typeof meta>

export const BehindOnePayment: Story = {}

export const NothingPaidYet: Story = {
  args: {
    paid: [],
    upcoming: [
      { kind: 'upcoming', date: '2026-02-15', amount_cents: 35_000 },
      { kind: 'upcoming', date: '2026-03-15', amount_cents: 35_000 },
    ],
  },
}

export const PaidInFull: Story = {
  args: {
    upcoming: [],
    paid: [
      { kind: 'paid', date: '2025-10-14', amount_cents: 70_000, method: 'Stripe' },
      { kind: 'paid', date: '2026-01-02', amount_cents: 70_000, method: 'Check' },
    ],
  },
}
