import type { Meta, StoryObj } from '@storybook/react';

import InputNumber from '../../../app/javascript/react/components/inputs/InputNumber';

const meta: Meta<typeof InputNumber> = {
  component: InputNumber,
};

export default meta;
type Story = StoryObj<typeof InputNumber>

export const Primary: Story = {
  args: {
    name: "test",
  }
}
