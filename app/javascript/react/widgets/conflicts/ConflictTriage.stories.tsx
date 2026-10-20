import type { Meta, StoryObj } from '@storybook/react-vite'

import ConflictTriage from './ConflictTriage'
import { conflictHandlers, failingConflictHandlers } from '../../../stories/conflicts'

// The widget remembers Queue vs Calendar in localStorage; each story pins
// the view it's about so they don't leak into one another.
const withView = (view: 'queue' | 'calendar') => () => {
  try {
    window.localStorage.setItem('capcity.conflicts.view', view)
  } catch {
    // Storage blocked: the widget falls back to the queue anyway.
  }
}

const meta = {
  title: 'Shared/Conflict triage',
  component: ConflictTriage,
  args: { basePath: '/coordinators/conflicts', ensembles: ['World', 'Open'] },
  parameters: { msw: { handlers: conflictHandlers() } },
} satisfies Meta<typeof ConflictTriage>

export default meta
type Story = StoryObj<typeof meta>

export const Queue: Story = { beforeEach: withView('queue') }

export const Calendar: Story = { beforeEach: withView('calendar') }

export const EmptyQueue: Story = {
  beforeEach: withView('queue'),
  parameters: { msw: { handlers: conflictHandlers([]) } },
}

export const LoadFailed: Story = {
  beforeEach: withView('queue'),
  parameters: { msw: { handlers: failingConflictHandlers } },
}
