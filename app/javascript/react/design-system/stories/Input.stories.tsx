import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Input from '../atoms/Input';

const meta: Meta<typeof Input> = {
  title: 'Design System/Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time', 'datetime-local'],
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'error', 'success'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    readOnly: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Types: Story = {
  render: () => (
    <div className="space-y-4">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="search" placeholder="Search input" />
      <Input type="date" />
      <Input type="time" />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <Input variant="default" placeholder="Default input" />
      <Input variant="error" placeholder="Error input" />
      <Input variant="success" placeholder="Success input" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Input size="sm" placeholder="Small input" />
      <Input size="md" placeholder="Medium input" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <Input placeholder="Normal input" />
      <Input placeholder="Disabled input" disabled />
      <Input placeholder="Read-only input" readOnly value="Read-only value" />
    </div>
  ),
};

export const WithValue: Story = {
  render: () => (
    <div className="space-y-4">
      <Input value="Pre-filled value" />
      <Input defaultValue="Default value" />
    </div>
  ),
};
