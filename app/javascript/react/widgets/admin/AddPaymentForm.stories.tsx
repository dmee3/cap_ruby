import type { Meta, StoryObj } from '@storybook/react-vite'

import AddPaymentForm, { AddPaymentMember } from './AddPaymentForm'
import { paymentTypes } from '../../../stories/payments'

const members: AddPaymentMember[] = [
  {
    id: 1,
    name: 'Rae Quinn',
    section: 'World / Snare',
    paid_before_cents: 40_000,
    season_total_cents: 140_000,
    expected_cents: 70_000,
    applies_to: ['2025-12-15', '2026-02-15'],
    schedule_id: 9,
    installments: [
      { pay_date: '2025-10-15', amount_cents: 20_000, paid: true },
      { pay_date: '2025-11-15', amount_cents: 20_000, paid: true },
      { pay_date: '2025-12-15', amount_cents: 30_000, paid: false },
      { pay_date: '2026-02-15', amount_cents: 35_000, paid: false },
      { pay_date: '2026-03-15', amount_cents: 35_000, paid: false },
    ],
  },
  {
    id: 2,
    name: 'Theo Marsh',
    section: 'Open / Tenors',
    paid_before_cents: 0,
    season_total_cents: 0,
    expected_cents: 0,
    applies_to: [],
    schedule_id: null,
    installments: [],
  },
]

const meta = {
  title: 'Admin/Payments/Record a payment',
  component: AddPaymentForm,
  args: { members, paymentTypes, csrfToken: 'storybook', serverErrors: [], initial: {} },
} satisfies Meta<typeof AddPaymentForm>

export default meta
type Story = StoryObj<typeof meta>

export const Blank: Story = {}

export const FromMember360: Story = { args: { preselectedUserId: 1, initial: { amountCents: 30_000 } } }

export const MemberWithoutSchedule: Story = { args: { preselectedUserId: 2 } }

export const CorrectingAPayment: Story = {
  args: {
    preselectedUserId: 1,
    initial: { userId: 1, paymentTypeId: 2, amountCents: 25_000, datePaid: '2026-01-10', notes: 'Venmo' },
    editing: { id: 22, originalAmountCents: 20_000 },
  },
}

export const ServerRejected: Story = {
  args: { initial: { userId: 1, amountCents: 0 }, serverErrors: ['Amount must be greater than 0'] },
}
