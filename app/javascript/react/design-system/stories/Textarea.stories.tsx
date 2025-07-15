import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { Textarea } from '../atoms';
import type { TextareaProps } from '../atoms';

export default {
  title: 'Design System/Atoms/Textarea',
  component: Textarea,
  argTypes: {
    variant: {
      control: { type: 'select', options: ['default', 'error', 'success'] },
    },
    size: {
      control: { type: 'select', options: ['sm', 'md', 'lg'] },
    },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    placeholder: { control: 'text' },
    rows: { control: { type: 'number', min: 1, max: 20 } },
  },
} as Meta;

const Template: StoryFn<TextareaProps> = (args) => <Textarea {...args} />;

export const Default = Template.bind({});
Default.args = {
  placeholder: 'This is a textarea',
  rows: 4,
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
