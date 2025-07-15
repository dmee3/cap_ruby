import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { Select } from '../atoms';
import type { SelectProps } from '../atoms';

export default {
  title: 'Design System/Atoms/Select',
  component: Select,
  argTypes: {
    variant: {
      control: { type: 'select', options: ['default', 'error', 'success'] },
    },
    selectSize: {
      control: { type: 'select', options: ['sm', 'md', 'lg'] },
    },
    disabled: { control: 'boolean' },
  },
} as Meta;

const options = [
  { label: 'Option 1', value: 1 },
  { label: 'Option 2', value: 2 },
  { label: 'Option 3', value: 3 },
  { label: 'Disabled Option', value: 4, disabled: true },
];

const Template: StoryFn<SelectProps> = (args) => <Select {...args} />;

export const Default = Template.bind({});
Default.args = {
  options,
};

export const Error = Template.bind({});
Error.args = {
  ...Default.args,
  variant: 'error',
};

export const Success = Template.bind({});
Success.args = {
  ...Default.args,
  variant: 'success',
};

export const Disabled = Template.bind({});
Disabled.args = {
  ...Default.args,
  disabled: true,
};
