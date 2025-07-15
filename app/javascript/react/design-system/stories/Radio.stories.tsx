import React, { useState } from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { Radio, RadioProps } from '../atoms';

export default {
  title: 'Design System/Atoms/Radio',
  component: Radio,
  argTypes: {
    size: {
      control: { type: 'select', options: ['sm', 'md', 'lg'] },
    },
    disabled: { control: 'boolean' },
  },
} as Meta;

const Template: StoryFn<RadioProps> = (args) => {
  const [selectedValue, setSelectedValue] = useState('1');

  return (
    <div>
      <Radio
        {...args}
        label="Option 1"
        value="1"
        checked={selectedValue === '1'}
        onChange={() => setSelectedValue('1')}
      />
      <Radio
        {...args}
        label="Option 2"
        value="2"
        checked={selectedValue === '2'}
        onChange={() => setSelectedValue('2')}
      />
      <Radio
        {...args}
        label="Disabled Option"
        value="3"
        checked={selectedValue === '3'}
        onChange={() => setSelectedValue('3')}
        disabled
      />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {};

const SingleTemplate: StoryFn<RadioProps> = (args) => <Radio {...args} />;

export const Unmanaged = SingleTemplate.bind({});
Unmanaged.args = {
  label: 'Unmanaged Radio',
  name: 'unmanaged',
};
