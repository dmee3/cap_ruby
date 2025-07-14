import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import SearchBar from '../molecules/SearchBar'

const meta: Meta<typeof SearchBar> = {
  title: 'Design System/Molecules/SearchBar',
  component: SearchBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default search bar
export const Default: Story = {
  args: {
    placeholder: 'Search...',
  },
}

// With value
export const WithValue: Story = {
  args: {
    placeholder: 'Search...',
    value: 'Search term',
  },
}

// Different sizes
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <SearchBar size="sm" placeholder="Small search..." />
      <SearchBar size="md" placeholder="Medium search..." />
      <SearchBar size="lg" placeholder="Large search..." />
    </div>
  ),
}

// Disabled state
export const Disabled: Story = {
  args: {
    placeholder: 'Disabled search...',
    disabled: true,
  },
}

// With handlers
export const WithHandlers: Story = {
  args: {
    placeholder: 'Search with handlers...',
  },
  parameters: {
    docs: {
      description: {
        story: 'This search bar has console.log handlers for onChange, onSearch, and onClear events. Check the browser console to see the events.',
      },
    },
  },
}
