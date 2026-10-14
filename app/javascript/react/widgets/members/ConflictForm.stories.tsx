import type { Meta, StoryObj } from '@storybook/react-vite'

import ConflictForm from './ConflictForm'
import { conflictStatuses } from '../../../stories/conflicts'

const today = new Date().toISOString().slice(0, 10)

const meta = {
  title: 'Members/Conflicts/Conflict form',
  component: ConflictForm,
  args: {
    formAction: '/members/conflicts',
    authenticityToken: 'storybook',
    minDate: today,
    defaults: {},
    errors: [],
    cancelHref: '#',
  },
} satisfies Meta<typeof ConflictForm>

export default meta
type Story = StoryObj<typeof meta>

export const NewConflict: Story = {}

export const ServerRejected: Story = {
  args: {
    defaults: { startDate: today, startTime: '18:30', endDate: today, endTime: '21:30', reason: '' },
    errors: [
      { field: 'start_date', message: 'Start date must be in the future.' },
      { field: 'reason', message: 'Reason can’t be blank.' },
    ],
  },
}

export const EditingPending: Story = {
  args: {
    method: 'patch',
    submitLabel: 'Save changes',
    minDate: undefined,
    defaults: { startDate: today, startTime: '18:30', endDate: today, endTime: '21:30', reason: 'Closing shift.' },
  },
}

export const CoordinatorOnBehalf: Story = {
  name: 'Coordinator: filing on someone’s behalf',
  args: {
    formAction: '/coordinators/conflicts',
    minDate: undefined,
    memberVoice: false,
    members: [
      { id: 1, name: 'Marcus Webb' },
      { id: 2, name: 'Priya Natarajan' },
      { id: 3, name: 'Jordan Ellis' },
    ],
    statuses: conflictStatuses,
    defaults: { statusId: '2' },
  },
}
