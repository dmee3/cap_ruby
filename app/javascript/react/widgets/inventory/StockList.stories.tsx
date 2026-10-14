import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse, delay } from 'msw'

import StockList from './StockList'
import type { StockAlert, StockCategory, StockItem, StockPayload } from './types'

const statusFor = (quantity: number, alert: StockAlert | null): StockItem['status'] => {
  if (quantity === 0) return 'out'
  return alert && quantity <= alert.threshold ? 'low' : 'ok'
}

let itemId = 1
const item = (category_id: number, name: string, quantity: number, threshold?: number): StockItem => {
  const alert = threshold == null ? null : { id: itemId, operator: 'lt_eq', threshold }
  return { id: itemId++, category_id, name, quantity, alert, status: statusFor(quantity, alert) }
}

const category = (id: number, name: string, items: StockItem[]): StockCategory => ({
  id,
  name,
  item_count: items.length,
  items,
})

const seed = (): StockCategory[] => [
  category(1, 'Sticks', [
    item(1, 'Vic Firth SD1 (pairs)', 18, 10),
    item(1, 'Innovative FS-TS1 tenor sticks', 4, 6),
    item(1, 'Promark TX2BW bass mallets', 0, 4),
  ]),
  category(2, 'Heads', [
    item(2, 'Remo Max snare 14"', 7, 4),
    item(2, 'Evans MX white tenor 13"', 11),
  ]),
  category(3, 'Uniforms', [
    item(3, 'Jacket: M', 3, 2),
    item(3, 'Jacket: L', 9),
    item(3, 'Gloves (pairs)', 22, 10),
  ]),
  category(4, 'Cables', []),
]

const payloadFor = (categories: StockCategory[], canManageAlerts: boolean): StockPayload => {
  const items = categories.flatMap((c) => c.items)
  return {
    categories,
    stats: {
      tracked: items.length,
      under_alert: items.filter((i) => i.status === 'low').length,
      out_of_stock: items.filter((i) => i.status === 'out').length,
      no_alert: items.filter((i) => !i.alert).length,
    },
    last_change: { performed_on: new Date().toISOString().slice(0, 10), user_name: 'Chris Alvarez' },
    can_manage_alerts: canManageAlerts,
  }
}

const handlers = (canManageAlerts = true, categories = seed()) => {
  let state = categories

  return [
    http.get('/api/inventory/categories', async () => {
      await delay(250)
      return HttpResponse.json(payloadFor(state, canManageAlerts))
    }),
    http.put('/api/inventory/categories/:categoryId/items/:id', async ({ params, request }) => {
      const body = (await request.json()) as { item: { quantity: number } }
      const quantity = Math.max(0, body.item.quantity)
      state = state.map((c) => ({
        ...c,
        items: c.items.map((i) =>
          i.id === Number(params.id) ? { ...i, quantity, status: statusFor(quantity, i.alert) } : i
        ),
      }))
      return HttpResponse.json({ quantity })
    }),
    http.delete('/api/inventory/categories/:id', ({ params }) => {
      state = state.filter((c) => c.id !== Number(params.id))
      return HttpResponse.json({})
    }),
  ]
}

const meta = {
  title: 'Inventory/Stock list',
  component: StockList,
  parameters: { msw: { handlers: handlers() } },
} satisfies Meta<typeof StockList>

export default meta
type Story = StoryObj<typeof meta>

export const Coordinator: Story = {}

export const QuartermasterWithoutAlerts: Story = {
  name: 'Quartermaster (no alert management)',
  parameters: { msw: { handlers: handlers(false) } },
}

export const NothingTracked: Story = { parameters: { msw: { handlers: handlers(true, []) } } }

export const LoadFailed: Story = {
  parameters: {
    msw: { handlers: [http.get('/api/inventory/categories', () => new HttpResponse(null, { status: 500 }))] },
  },
}
