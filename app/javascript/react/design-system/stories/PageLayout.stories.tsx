import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PageLayout } from '../templates/PageLayout';
import { Text } from '../atoms';

const meta: Meta<typeof PageLayout> = {
  title: 'Design System/Templates/PageLayout',
  component: PageLayout,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sidebar: (
      <div>
        <Text variant="h3">Sidebar</Text>
        <ul>
          <li>Link 1</li>
          <li>Link 2</li>
          <li>Link 3</li>
        </ul>
      </div>
    ),
    children: (
      <div>
        <Text variant="h1">Page Title</Text>
        <Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. ...
        </Text>
      </div>
    ),
  },
};
