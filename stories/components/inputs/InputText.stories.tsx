import type { Meta, StoryObj } from '@storybook/react';

import InputText from '../../../app/javascript/react/components/inputs/InputText';

const meta: Meta<typeof InputText> = {
  component: InputText,
};

export default meta;
type Story = StoryObj<typeof InputText>

export const Primary: Story = {
  args: {
    name: "test",
  }
}
