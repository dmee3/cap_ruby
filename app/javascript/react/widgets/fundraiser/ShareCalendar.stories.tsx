import type { Meta, StoryObj } from '@storybook/react-vite'

import ShareCalendar from './ShareCalendar'

const meta = {
  title: 'Public/Fundraiser/Share calendar',
  component: ShareCalendar,
  args: { shareUrl: 'https://example.com/fundraiser/tok1', firstName: 'Elena' },
} satisfies Meta<typeof ShareCalendar>

export default meta
type Story = StoryObj<typeof meta>

export const AfterDonating: Story = {}
