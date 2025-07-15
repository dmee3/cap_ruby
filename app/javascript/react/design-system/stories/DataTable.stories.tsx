import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DataTable, DataTableColumn } from '../organisms/DataTable';
import Badge from '../atoms/Badge';
import Icon from '../atoms/Icon';

const meta: Meta<typeof DataTable<UserData>> = {
  title: 'Design System/Organisms/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Member' | 'Staff';
  status: 'Active' | 'Inactive';
}

const sampleData: UserData[] = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Member', status: 'Active' },
  { id: 3, name: 'Peter Jones', email: 'peter.jones@example.com', role: 'Member', status: 'Inactive' },
  { id: 4, name: 'Mary Johnson', email: 'mary.johnson@example.com', role: 'Staff', status: 'Active' },
  { id: 5, name: 'David Williams', email: 'david.williams@example.com', role: 'Member', status: 'Active' },
];

const columns: DataTableColumn<UserData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    sortable: true,
  },
  {
    header: 'Email',
    accessor: 'email',
    sortable: true,
  },
  {
    header: 'Role',
    accessor: 'role',
    sortable: true,
  },
  {
    header: 'Status',
    accessor: (row) => (
      <Badge variant={row.status === 'Active' ? 'success' : 'neutral'}>
        {row.status}
      </Badge>
    ),
  },
];

export const Default: Story = {
  args: {
    columns: columns,
    data: sampleData,
  },
};

export const WithRowClick: Story = {
  args: {
    columns: columns,
    data: sampleData,
    onRowClick: (row) => alert(`Clicked on ${row.name}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'This table has a `onRowClick` handler. Click on a row to see an alert.',
      },
    },
  },
};

export const EmptyState: Story = {
  args: {
    columns: columns,
    data: [],
  },
};
