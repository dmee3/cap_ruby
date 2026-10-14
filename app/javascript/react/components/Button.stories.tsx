import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import Button from './Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Save changes' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'success', 'danger', 'secondary', 'ghost', 'link', 'dashed'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    tone: { control: 'select', options: [undefined, 'default', 'accent', 'danger', 'muted'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Loading: Story = { args: { loading: true } }

export const LoadingWithLabel: Story = { args: { loading: true, loadingLabel: 'Processing…' } }

export const AllVariants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="primary">Primary</Button>
      <Button {...args} variant="success">Approve</Button>
      <Button {...args} variant="danger">Deny</Button>
      <Button {...args} variant="secondary">Cancel</Button>
      <Button {...args} variant="secondary" tone="danger">Delete</Button>
      <Button {...args} variant="ghost">Ghost</Button>
      <Button {...args} variant="link">Link</Button>
      <Button {...args} variant="dashed">+ Add entry</Button>
    </div>
  ),
}
