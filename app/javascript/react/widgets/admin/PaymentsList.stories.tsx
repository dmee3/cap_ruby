import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'

import PaymentsList from './PaymentsList'
import { paymentHandlers, paymentTypes } from '../../../stories/payments'

const meta = {
  title: 'Admin/Payments/Payments list',
  component: PaymentsList,
  args: { paymentTypes, justCreatedId: null, seasonLabel: '2026 Season' },
  parameters: { msw: { handlers: paymentHandlers() } },
} satisfies Meta<typeof PaymentsList>

export default meta
type Story = StoryObj<typeof meta>

export const AllPayments: Story = {}

export const JustRecordedOne: Story = { args: { justCreatedId: 100 } }

export const NoPaymentsYet: Story = { parameters: { msw: { handlers: paymentHandlers([]) } } }

export const LoadFailed: Story = {
  parameters: { msw: { handlers: [http.get('/admin/payments.json', () => new HttpResponse(null, { status: 500 }))] } },
}
