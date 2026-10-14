import type { Meta, StoryObj } from '@storybook/react-vite'

import PerformerPicker from './PerformerPicker'
import { performers } from '../../../stories/performers'

const meta = {
  title: 'Public/Fundraiser/Pick a performer',
  component: PerformerPicker,
  args: { performers },
} satisfies Meta<typeof PerformerPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Roster: Story = {}

export const NobodyListed: Story = { args: { performers: [] } }
