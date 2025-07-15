import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { List } from '../organisms/List';
import Badge from '../atoms/Badge';
import Text from '../atoms/Text';

const meta: Meta<typeof List> = {
  title: 'Design System/Organisms/List',
  component: List,
  parameters: {
    layout: 'padded',
  },
};

export default meta;

// --- Simple List ---
const simpleData = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

export const Simple: StoryObj<typeof List<string>> = {
  args: {
    data: simpleData,
    renderItem: (item) => <Text>{item}</Text>,
    keyExtractor: (item) => item,
  },
};

// --- Complex List ---
interface User {
  id: number;
  name: string;
  email: string;
  status: 'Online' | 'Offline';
}

const complexData: User[] = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', status: 'Online' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', status: 'Offline' },
  { id: 3, name: 'Peter Jones', email: 'peter.jones@example.com', status: 'Online' },
];

export const Complex: StoryObj<typeof List<User>> = {
  args: {
    data: complexData,
    keyExtractor: (item) => item.id,
    renderItem: (item) => (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Text variant="body" as="p">{item.name}</Text>
          <Text variant="caption" color="secondary">{item.email}</Text>
        </div>
        <Badge variant={item.status === 'Online' ? 'success' : 'neutral'}>
          {item.status}
        </Badge>
      </div>
    ),
  },
};


// --- Clickable List ---
export const Clickable: StoryObj<typeof List<User>> = {
  args: {
    ...Complex.args,
    onItemClick: (item) => alert(`Clicked on ${item.name}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'This list has an `onItemClick` handler. Click on an item to see an alert.',
      },
    },
  }
};

// --- Custom Item ClassName ---
export const WithCustomItemClass: StoryObj<typeof List<User>> = {
  args: {
    ...Complex.args,
    itemClassName: (item) => item.status === 'Offline' ? 'opacity-50' : '',
  },
  parameters: {
    docs: {
      description: {
        story: 'This list uses `itemClassName` to style offline users with a lower opacity.',
      },
    },
  }
};
