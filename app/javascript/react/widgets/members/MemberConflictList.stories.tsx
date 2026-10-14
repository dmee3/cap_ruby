import type { Meta, StoryObj } from '@storybook/react-vite'

import MemberConflictList, { ConflictListItem } from './MemberConflictList'

const conflicts: ConflictListItem[] = [
  {
    id: 1,
    date_range_label: 'Fri 3/14',
    time_range_label: '6:30–9:30 PM',
    status: 'Pending',
    relative_subline: 'In 4 days · submitted 3 days ago',
    editable: true,
    edit_path: '#',
  },
  {
    id: 2,
    date_range_label: 'Sat 3/22',
    time_range_label: '9:00 AM–5:00 PM',
    status: 'Approved',
    relative_subline: 'In 12 days · submitted 2 weeks ago',
    reason: 'Sister’s wedding.',
  },
  {
    id: 3,
    date_range_label: 'Sun 2/9',
    status: 'Denied',
    relative_subline: '3 weeks ago',
    reason: 'Run-through weekend; everyone needs to be there.',
  },
]

const meta = {
  title: 'Members/Conflicts/Conflict list',
  component: MemberConflictList,
  args: { conflicts, cardTitle: 'Your conflicts', cardCount: '2026 Season · 3' },
} satisfies Meta<typeof MemberConflictList>

export default meta
type Story = StoryObj<typeof meta>

export const DashboardCard: Story = {}

export const ConflictsIndex: Story = { args: { showEditLinks: true, cardTitle: 'Already submitted' } }

export const Empty: Story = { args: { conflicts: [] } }
