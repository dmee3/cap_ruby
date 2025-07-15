import React from 'react';
import { Meta, StoryFn } from '@storybook/react';

import { Form, FormProps } from '../organisms/Form';
import { FormField } from '../molecules';
import { Button } from '../atoms';

export default {
  title: 'Design System/Organisms/Form',
  component: Form,
} as Meta;

const Template: StoryFn<FormProps> = (args) => (
  <Form {...args}>
    <FormField
      label="Email"
      helpText="Please enter your email address."
      type="email"
      placeholder="john.doe@example.com"
      name="email"
    />
    <FormField
      label="Password"
      type="password"
      placeholder="********"
      name="password"
    />
    <Button type="submit">Submit</Button>
  </Form>
);

export const Default = Template.bind({});
Default.args = {
  onSubmit: (data) => alert(JSON.stringify(data)),
};
