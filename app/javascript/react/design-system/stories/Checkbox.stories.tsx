import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { Checkbox, CheckboxProps } from '../atoms';

export default {
  title: 'Design System/Atoms/Checkbox',
  component: Checkbox,
  argTypes: {
    size: {
      control: { type: 'select', options: ['sm', 'md', 'lg'] },
    },
    disabled: { control: 'boolean' },
    checked: { control: 'boolean' },
  },
} as Meta;

const Template: StoryFn<CheckboxProps> = (args) => <Checkbox {...args} />;

export const Default = Template.bind({});
Default.args = {
  label: 'Default Checkbox',
};

export const PreChecked = Template.bind({});
PreChecked.args = {
  ...Default.args,
  label: 'Pre-checked Checkbox',
  checked: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  ...Default.args,
  label: 'Disabled Checkbox',
  disabled: true,
};

export const DisabledChecked = Template.bind({});
DisabledChecked.args = {
  ...Disabled.args,
  label: 'Disabled and Checked',
  checked: true,
};
