import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'

import ItemHistory, { ItemHistoryPayload } from './ItemHistory'

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const payload: ItemHistoryPayload = {
  item: { id: 2, category_id: 1, category_name: 'Sticks', name: 'Innovative FS-TS1 tenor sticks', quantity: 4 },
  alert: { id: 2, operator: 'lt_eq', threshold: 6, user_name: 'Chris Alvarez' },
  entries: [
    { id: 5, change: -2, previous_quantity: 6, performed_on: daysAgo(0), user_name: 'Chris Alvarez' },
    { id: 4, change: -4, previous_quantity: 10, performed_on: daysAgo(6), user_name: 'Morgan Lee' },
    { id: 3, change: 12, previous_quantity: -2, performed_on: daysAgo(30), user_name: 'Dana Reyes' },
    { id: 2, change: -2, previous_quantity: 0, performed_on: daysAgo(90), user_name: 'Morgan Lee' },
    { id: 1, change: 0, previous_quantity: 0, performed_on: daysAgo(400), user_name: 'Dana Reyes' },
  ],
  can_manage_alerts: true,
}

const meta = {
  title: 'Inventory/Item history',
  component: ItemHistory,
  args: { payload },
  parameters: {
    // Deleting succeeds by leaving for /inventory/categories, which isn't
    // there in Storybook, so the story shows the failure path instead.
    msw: {
      handlers: [
        http.delete('/api/inventory/categories/:categoryId/items/:id', () => new HttpResponse(null, { status: 500 })),
      ],
    },
  },
} satisfies Meta<typeof ItemHistory>

export default meta
type Story = StoryObj<typeof meta>

export const WithAlert: Story = {}

export const NoAlert: Story = { args: { payload: { ...payload, alert: null } } }

export const NeverChanged: Story = {
  args: {
    payload: {
      ...payload,
      item: { ...payload.item, name: 'Jacket: XL', quantity: 0 },
      alert: null,
      entries: [],
      can_manage_alerts: false,
    },
  },
}
