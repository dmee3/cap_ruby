import type { Meta, StoryObj } from '@storybook/react';

import Badge from '../../app/javascript/react/components/Badge';

const meta: Meta<typeof Badge> = {
  component: Badge,
};

export default meta;
type Story = StoryObj<typeof Badge>

export const Primary: Story = {
  args: {
    color: 'green',
    text: 'Approved',
  }
}
