import type { Meta, StoryObj } from '@storybook/react-vite'

import TriageDashboard from './TriageDashboard'
import {
  conflictHandlers,
  conflictStatuses,
  failingConflictHandlers,
  loadingConflictHandlers,
} from '../../../stories/conflicts'

const meta = {
  title: 'Coordinators/Dashboard',
  component: TriageDashboard,
  args: {
    statuses: conflictStatuses,
    pendingCount: 3,
    oldestWaitingDays: 6,
    oldestMember: 'Marcus Webb',
    queuePath: '#queue',
    newPath: '#new',
  },
  parameters: { msw: { handlers: conflictHandlers() } },
} satisfies Meta<typeof TriageDashboard>

export default meta
type Story = StoryObj<typeof meta>

export const Backlog: Story = {}

export const CaughtUp: Story = {
  args: { pendingCount: 0, oldestWaitingDays: null, oldestMember: undefined },
}

export const CalendarLoading: Story = { parameters: { msw: { handlers: loadingConflictHandlers } } }

export const CalendarFailed: Story = { parameters: { msw: { handlers: failingConflictHandlers } } }
