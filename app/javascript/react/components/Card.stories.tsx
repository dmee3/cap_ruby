import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import Card from './Card'
import Button from './Button'

const meta = {
  title: 'Components/Card',
  component: Card,
  args: { title: 'Dues progress', children: <p className="m-0 text-body-sm text-secondary">Card body.</p> },
  argTypes: {
    variant: { control: 'inline-radio', options: ['panel', 'section', 'list'] },
    tone: { control: 'inline-radio', options: ['neutral', 'success', 'warning', 'danger'] },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Panel: Story = {}

export const Section: Story = {
  args: { variant: 'section', title: 'Contact', action: <Button variant="link">Edit</Button> },
}

export const List: Story = {
  args: {
    variant: 'list',
    title: 'Behind on dues',
    count: '3 members',
    children: (
      <div className="flex flex-col">
        {['Rae Quinn', 'Theo Marsh', 'Ava Lindqvist'].map((name) => (
          <div key={name} className="border-b border-border-default px-4 py-3 last:border-0">{name}</div>
        ))}
      </div>
    ),
  },
}

export const Tones: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {(['neutral', 'success', 'warning', 'danger'] as const).map((tone) => (
        <Card key={tone} tone={tone} title={tone}>
          <p className="m-0 text-body-sm text-secondary">A {tone} card.</p>
        </Card>
      ))}
    </div>
  ),
}
