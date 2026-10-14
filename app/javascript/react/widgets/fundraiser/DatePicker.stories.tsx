import type { Meta, StoryObj } from '@storybook/react-vite'

import DatePicker from './DatePicker'
import { performer } from '../../../stories/performers'

const meta = {
  title: 'Public/Fundraiser/Pick dates',
  component: DatePicker,
  parameters: { layout: 'fullscreen' },
  args: {
    performer: performer(),
    claimedDates: [1, 2, 3, 5, 8, 10, 12, 13, 15, 17, 20, 21, 22, 24, 26, 28, 29, 31],
    checkoutPath: '#checkout',
  },
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

export const PartlyClaimed: Story = {}

export const FreshCalendar: Story = {
  args: { performer: performer({ name: 'Jordan Ellis', raised_cents: 0, claimed_count: 0 }), claimedDates: [] },
}

export const OneDateLeft: Story = {
  args: {
    performer: performer({ claimed_count: 30, raised_cents: 49_600 - 1_100 }),
    claimedDates: Array.from({ length: 31 }, (_, i) => i + 1).filter((d) => d !== 11),
  },
}
