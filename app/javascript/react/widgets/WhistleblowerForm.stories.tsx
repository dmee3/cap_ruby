import type { Meta, StoryObj } from '@storybook/react-vite'

import WhistleblowerForm from './WhistleblowerForm'

const recipients = [
  { id: 1, name: 'Dana Reyes', initials: 'DR', detail: 'Director' },
  { id: 2, name: 'Chris Alvarez', initials: 'CA', detail: 'Coordinator' },
  { id: 3, name: 'Morgan Lee', initials: 'ML', detail: 'Battery caption head' },
  { id: 4, name: 'Pat Okoye', initials: 'PO', detail: 'Front ensemble caption head' },
  { id: 5, name: 'Sky Harper', initials: 'SH', detail: null },
]

const meta = {
  title: 'Shared/Whistleblower report',
  component: WhistleblowerForm,
  args: { data: { recipients, minimum: 3 }, csrfToken: 'storybook' },
} satisfies Meta<typeof WhistleblowerForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const FewerRecipientsThanTarget: Story = { args: { data: { recipients: recipients.slice(0, 2), minimum: 2 } } }

export const NoRecipients: Story = { args: { data: { recipients: [], minimum: 3 } } }
