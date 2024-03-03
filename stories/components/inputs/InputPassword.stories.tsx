import type { Meta, StoryObj } from '@storybook/react';


import InputPassword from '../../../app/javascript/react/components/inputs/InputPassword';

const meta: Meta<typeof InputPassword> = {
  component: InputPassword,
};

export default meta;
type Story = StoryObj<typeof InputPassword>

export const Primary: Story = {
  args: {
    name: "test",
    value: "Str0ngP@ssw0rd"
  }
}
