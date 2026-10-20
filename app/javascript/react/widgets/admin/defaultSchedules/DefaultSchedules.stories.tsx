import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse, delay } from 'msw'

import DefaultSchedulesOverview from './DefaultSchedulesOverview'
import EditDefault from './EditDefault'
import CopyDefaults, { SourceSeason } from './CopyDefaults'
import MoveDates from './MoveDates'
import { ALL, overview } from './fixtures'

const DATES_2026 = ['2025-10-17', '2025-11-14', '2025-12-12', '2026-01-09', '2026-02-06', '2026-03-06']

const source: SourceSeason = {
  id: 1,
  year: '2026',
  combinations: overview().combinations.map((c) => ({
    slug: c.slug,
    label: c.label,
    entries: c.entries.map((e, i) => ({ ...e, pay_date: DATES_2026[i] })),
    total_cents: c.total_cents,
  })),
}

// Every save on these screens succeeds by navigating back to the overview,
// which isn't there in Storybook, so saves stay pending to show the saving
// state instead.
const pending = async () => {
  await delay('infinite')
  return HttpResponse.json({})
}

const meta = {
  title: 'Admin/Season/Default schedules',
  parameters: {
    msw: {
      handlers: [
        http.post('/api/admin/default-schedules/apply-to-empty', pending),
        http.post('/api/admin/default-schedules/copy', pending),
        http.put('/api/admin/default-schedules/dates', pending),
        http.put('/api/admin/default-schedules/:slug', pending),
      ],
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const AllSetUp: Story = { render: () => <DefaultSchedulesOverview data={overview()} /> }

export const SomeMissing: Story = {
  render: () => <DefaultSchedulesOverview data={overview(['cc2-visual-vet', 'cc2-visual-rookie'])} />,
}

export const NewSeasonNothingSetUp: Story = { render: () => <DefaultSchedulesOverview data={overview(ALL)} /> }

export const EditOneCombination: Story = {
  render: () => <EditDefault data={{ overview: overview(), slug: 'world-music-vet' }} />,
}

export const CopyFromLastSeason: Story = {
  render: () => <CopyDefaults data={{ overview: overview(ALL), sources: [source] }} />,
}

export const MoveDatesForEveryone: Story = { render: () => <MoveDates data={overview()} /> }
