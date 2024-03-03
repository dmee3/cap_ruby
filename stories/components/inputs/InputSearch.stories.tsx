import type { Meta, StoryObj } from '@storybook/react';

import InputSearch from '../../../app/javascript/react/components/inputs/InputSearch';

const meta: Meta<typeof InputSearch> = {
  component: InputSearch,
};

export default meta;
type Story = StoryObj<typeof InputSearch>

export const Primary: Story = {
  args: {
    name: "test",
    onChange: () => { },
    options: ["Snare", "Tenors", "Bass", "Cymbals"],
    value: "Snare"
  }
}
