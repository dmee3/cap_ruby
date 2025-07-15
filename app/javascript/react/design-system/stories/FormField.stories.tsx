import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import FormField from '../molecules/FormField';

const meta: Meta<typeof FormField> = {
  title: 'Design System/Molecules/FormField',
  component: FormField,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    as: {
      control: { type: 'select' },
      options: ['input', 'textarea', 'select', 'checkbox', 'radio'],
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time', 'datetime-local'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    labelSize: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    required: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
  },
};

export const Textarea: Story = {
  args: {
    as: 'textarea',
    label: 'Your Message',
    placeholder: 'Enter your message here...',
    rows: 5,
  },
};

export const Select: Story = {
  args: {
    as: 'select',
    label: 'Choose an option',
    options: [
      { label: 'Option 1', value: '1' },
      { label: 'Option 2', value: '2' },
      { label: 'Option 3', value: '3' },
    ],
  },
};

export const Checkbox: Story = {
  args: {
    as: 'checkbox',
    label: 'I agree to the terms and conditions',
    name: 'terms',
  },
};

export const RadioGroup: Story = {
  render: () => (
    <div className="space-y-2">
      <FormField as="radio" label="Option 1" name="radio-group" value="1" />
      <FormField as="radio" label="Option 2" name="radio-group" value="2" />
      <FormField as="radio" label="Option 3" name="radio-group" value="3" />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};


export const WithValidation: Story = {
  render: () => (
    <div className="space-y-4">
      <FormField
        label="Email"
        type="email"
        placeholder="Enter your email"
        required
        error="Please enter a valid email address"
      />
      <FormField
        label="Password"
        type="password"
        placeholder="Enter your password"
        required
        helpText="Must be at least 8 characters"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const LabelSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <FormField label="Small Label" labelSize="sm" placeholder="Small label" />
      <FormField label="Medium Label" labelSize="md" placeholder="Medium label" />
      <FormField label="Large Label" labelSize="lg" placeholder="Large label" />
    </div>
  ),
};

export const InputTypes: Story = {
  render: () => (
    <div className="space-y-4">
      <FormField label="Text" type="text" placeholder="Text input" />
      <FormField label="Email" type="email" placeholder="Email input" />
      <FormField label="Password" type="password" placeholder="Password input" />
      <FormField label="Number" type="number" placeholder="Number input" />
      <FormField label="Search" type="search" placeholder="Search input" />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <FormField label="Normal" placeholder="Normal field" />
      <FormField label="Disabled" placeholder="Disabled field" disabled />
      <FormField label="Read Only" value="Read-only value" readOnly />
    </div>
  ),
};
