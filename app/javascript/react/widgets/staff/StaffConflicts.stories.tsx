import type { Meta, StoryObj } from '@storybook/react-vite'

import StaffConflicts, { StaffConflictGroup } from './StaffConflicts'

const groups: StaffConflictGroup[] = [
  {
    date: '2026-03-20',
    date_label: 'Friday, 3/20',
    out_count: 2,
    rows: [
      {
        id: 1,
        date_range_label: 'Fri 3/20',
        time_range_label: '6:30 PM–9:30 PM',
        status: 'Pending',
        relative_subline: 'in 4 days · submitted 2 days ago',
        member: 'Marcus Webb',
        section: 'Snare',
      },
      {
        id: 2,
        date_range_label: 'Fri 3/20',
        time_range_label: '6:30 PM–9:30 PM',
        status: 'Approved',
        relative_subline: 'in 4 days · submitted a week ago',
        member: 'Priya Natarajan',
        section: 'Front Ensemble',
      },
    ],
  },
  {
    date: '2026-03-21',
    date_label: 'Saturday, 3/21',
    out_count: 1,
    rows: [
      {
        id: 3,
        date_range_label: 'Sat 3/21',
        time_range_label: '9:00 AM–5:00 PM',
        status: 'Denied',
        relative_subline: 'in 5 days · submitted yesterday',
        member: 'Jordan Ellis',
        section: 'Bass',
      },
    ],
  },
]

const meta = {
  title: 'Staff/Who’s out',
  component: StaffConflicts,
  args: { groups, outCount: 3, windowLabel: 'Mar 16 – Mar 30' },
} satisfies Meta<typeof StaffConflicts>

export default meta
type Story = StoryObj<typeof meta>

export const MembersOut: Story = {}

export const EveryoneIn: Story = { args: { groups: [], outCount: 0 } }
