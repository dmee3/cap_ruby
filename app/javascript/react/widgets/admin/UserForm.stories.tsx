import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse, delay } from 'msw'

import UserForm, { UserFormData } from './UserForm'

const newPerson: UserFormData = {
  user: {
    id: null,
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: null,
    inventory_access: false,
    whistleblower_recipient: false,
    reset_sent_at: null,
    initials: null,
    summary: [],
    seasons_users: [],
  },
  seasons: [
    { id: 2, year: '2026', current: true, vet: false },
    { id: 1, year: '2025', current: false, vet: false },
  ],
  errors: [],
  current_season_id: 2,
  sections: ['Snare', 'Tenors', 'Bass', 'Cymbals', 'Front Ensemble', 'Visual'],
  ensembles: ['World', 'Open'],
  roles: ['member', 'staff', 'coordinator', 'admin'],
}

const existing: UserFormData = {
  ...newPerson,
  seasons: [
    { id: 2, year: '2026', current: true, vet: true },
    { id: 1, year: '2025', current: false, vet: false },
  ],
  user: {
    ...newPerson.user,
    id: 42,
    first_name: 'Iris',
    last_name: 'Nakamura',
    username: 'inakamura',
    email: 'iris@example.com',
    phone: '(614) 555-0199',
    initials: 'IN',
    summary: ['2nd season', 'World · Snare'],
    seasons_users: [
      { id: 7, season_id: 2, role: 'member', ensemble: 'World', section: 'Snare', has_schedule: true },
      { id: 6, season_id: 1, role: 'member', ensemble: 'Open', section: 'Snare', has_schedule: true },
    ],
  },
}

const forecast = {
  lookup_key: 'World · Snare · vet',
  total_cents: 140_000,
  entries: [
    { pay_date: '2025-10-15', amount_cents: 20_000 },
    { pay_date: '2025-11-15', amount_cents: 30_000 },
    { pay_date: '2025-12-15', amount_cents: 30_000 },
    { pay_date: '2026-01-15', amount_cents: 30_000 },
    { pay_date: '2026-02-15', amount_cents: 30_000 },
  ],
  past_due: { count: 2, amount_cents: 50_000 },
}

const forecastHandler = (body: object) =>
  http.get('/api/admin/schedule-forecast', async () => {
    await delay(200)
    return HttpResponse.json(body)
  })

const meta = {
  title: 'Admin/Users/User form',
  component: UserForm,
  args: { data: newPerson, csrfToken: 'storybook' },
  parameters: { msw: { handlers: [forecastHandler(forecast)] } },
} satisfies Meta<typeof UserForm>

export default meta
type Story = StoryObj<typeof meta>

export const NewPerson: Story = {}

export const EditingMember: Story = { args: { data: existing } }

export const NoDefaultScheduleForSection: Story = {
  args: { data: existing },
  parameters: { msw: { handlers: [forecastHandler({ no_default: true })] } },
}

export const ServerRejected: Story = {
  args: {
    data: {
      ...newPerson,
      user: { ...newPerson.user, first_name: 'Iris', email: 'taken@example.com' },
      errors: [
        { field: 'last_name', message: 'Last name can’t be blank' },
        { field: 'email', message: 'Email has already been taken' },
      ],
    },
  },
}
