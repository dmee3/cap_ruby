import type { Meta, StoryObj } from '@storybook/react-vite'

import RhythmConverter from './RhythmConverter'

const meta = {
  title: 'Tools/Rhythm converter',
  component: RhythmConverter,
} satisfies Meta<typeof RhythmConverter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
