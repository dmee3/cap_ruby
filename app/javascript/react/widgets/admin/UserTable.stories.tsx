import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse, delay } from 'msw'

import UserTable from './UserTable'

const member = (id: number, full_name: string, ensemble: string, section: string, extra = {}) => ({
  id,
  full_name,
  email: `${full_name.split(' ')[0].toLowerCase()}@example.com`,
  section,
  ensemble,
  role: 'member',
  vet: id % 3 !== 0,
  removed: false,
  season_count: (id % 4) + 1,
  has_schedule: true,
  ...extra,
})

const roster = [
  member(1, 'Jordan Pike', 'World', 'Snare'),
  member(2, 'Marcus Webb', 'World', 'Snare', { has_schedule: false }),
  member(3, 'Priya Natarajan', 'World', 'Front Ensemble'),
  member(4, 'Jordan Ellis', 'Open', 'Bass'),
  member(5, 'Sam Okafor', 'Open', 'Tenors'),
  member(6, 'Riley Chen', 'World', 'Cymbals'),
  member(7, 'Theo Marsh', 'Open', 'Snare'),
  member(8, 'Sasha Vance', 'World', 'Bass', { role: 'removed', removed: true, season_count: 0 }),
  { ...member(9, 'Dana Reyes', '', ''), section: null, ensemble: null, role: 'admin', season_count: 5, has_schedule: false },
  { ...member(10, 'Chris Alvarez', '', ''), section: null, ensemble: null, role: 'coordinator', season_count: 3, has_schedule: false },
  { ...member(11, 'Morgan Lee', '', ''), section: null, ensemble: null, role: 'staff', season_count: 2, has_schedule: false },
]

const meta = {
  title: 'Admin/Users/Roster',
  component: UserTable,
  args: { seasonYear: '2026' },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/admin/users', async () => {
          await delay(300)
          return HttpResponse.json(roster)
        }),
      ],
    },
  },
} satisfies Meta<typeof UserTable>

export default meta
type Story = StoryObj<typeof meta>

export const Roster: Story = {}

export const LoadFailed: Story = {
  parameters: { msw: { handlers: [http.get('/api/admin/users', () => new HttpResponse(null, { status: 500 }))] } },
}
