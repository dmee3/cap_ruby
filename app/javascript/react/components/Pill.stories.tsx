import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import Pill from './Pill'
import StatusPill from './StatusPill'

const meta = {
  title: 'Components/Pill',
  component: Pill,
  args: { children: 'Due next', tone: 'warning' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'success', 'warning', 'danger'] },
    casing: { control: 'inline-radio', options: ['upper', 'sentence'] },
  },
} satisfies Meta<typeof Pill>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const ConflictAndDuesStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {['Pending', 'Approved', 'Denied', 'Resolved', 'Current', 'Behind', 'Due soon', 'Complete', 'Draft'].map((s) => (
        <StatusPill key={s} status={s} />
      ))}
    </div>
  ),
}

export const SentenceCase: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Pill tone="success" casing="sentence">Paid Oct 14</Pill>
      <Pill tone="danger" casing="sentence">61 days late</Pill>
      <Pill tone="neutral" casing="sentence">Front Ensemble</Pill>
    </div>
  ),
}
