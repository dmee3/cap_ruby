import type { Meta, StoryObj } from '@storybook/react';

import InputSelect from '../../../app/javascript/react/components/inputs/InputSelect';

const meta: Meta<typeof InputSelect> = {
  component: InputSelect,
};

export default meta;
type Story = StoryObj<typeof InputSelect>

export const Primary: Story = {
  argTypes: {
    value: { control: "select", options: ["Pizza", "Fries", "Burger"] }
  },
  args: {
    name: "test",
    onChange: () => { },
    options: ["Pizza", "Fries", "Burger"],
    value: "Fries"
  }
}
