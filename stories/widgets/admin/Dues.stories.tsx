import type { Meta, StoryObj } from '@storybook/react';

import Dues from '../../../app/javascript/react/widgets/admin/Dues';

const meta: Meta<typeof Dues> = {
  component: Dues,
};

export default meta;
type Story = StoryObj<typeof Dues>

export const Primary: Story = {
  args: {
    expectedDues: 15000,
    actualDues: 14575,
  }
}
