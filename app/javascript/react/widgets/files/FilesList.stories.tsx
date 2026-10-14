import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse, delay } from 'msw'

import FilesList from './FilesList'

const folders: Record<string, { id: string; name: string; file_type: string }[]> = {
  '': [
    { id: 'drill', name: 'Drill Charts', file_type: 'folder' },
    { id: 'aux', name: 'Auxiliary', file_type: 'folder' },
    { id: 'm1', name: 'Show Music: Movement 1.pdf', file_type: 'pdf' },
    { id: 'm2', name: 'Show Music: Movement 2.pdf', file_type: 'pdf' },
    { id: 'click', name: 'Click track 132bpm.mp3', file_type: 'audio' },
    { id: 'roster', name: 'Section roster', file_type: 'application/vnd.google-apps.spreadsheet' },
    { id: 'handbook', name: 'Member handbook', file_type: 'document' },
  ],
  drill: [
    { id: 'set1', name: 'Sets 1–24.pdf', file_type: 'pdf' },
    { id: 'set2', name: 'Sets 25–48.pdf', file_type: 'pdf' },
  ],
  aux: [],
}

const meta = {
  title: 'Shared/Season files',
  component: FilesList,
  args: { expanded: true, seasonLabel: '2026 season' },
  decorators: [(Story) => <div className="card max-w-2xl"><Story /></div>],
  parameters: {
    msw: {
      handlers: [
        http.get('/api/files/:folderId?', async ({ params }) => {
          await delay(300)
          return HttpResponse.json(folders[(params.folderId as string) ?? ''] ?? [])
        }),
      ],
    },
  },
} satisfies Meta<typeof FilesList>

export default meta
type Story = StoryObj<typeof meta>

export const FilesPage: Story = {}

export const DashboardPeek: Story = { args: { limit: 3 } }

export const EmptyFolder: Story = { args: { folderId: 'aux' } }

export const NoFolderConfigured: Story = {
  parameters: { msw: { handlers: [http.get('/api/files/:folderId?', () => new HttpResponse(null, { status: 404 }))] } },
}

export const DriveUnavailable: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/files/:folderId?', () => HttpResponse.json({ error: 'drive_unavailable' }, { status: 502 })),
      ],
    },
  },
}
