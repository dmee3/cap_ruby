import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Text from '../atoms/Text';

const meta: Meta<typeof Text> = {
  title: 'Design System/Atoms/Text',
  component: Text,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body-large', 'body', 'body-small', 'label-large', 'label', 'label-small', 'caption'],
    },
    color: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'disabled', 'inverse', 'success', 'warning', 'error'],
    },
    align: {
      control: { type: 'select' },
      options: ['left', 'center', 'right', 'justify'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default text',
    variant: 'body',
  },
};

export const Headings: Story = {
  render: () => (
    <div className="space-y-4">
      <Text variant="h1">Heading 1</Text>
      <Text variant="h2">Heading 2</Text>
      <Text variant="h3">Heading 3</Text>
      <Text variant="h4">Heading 4</Text>
      <Text variant="h5">Heading 5</Text>
      <Text variant="h6">Heading 6</Text>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const BodyText: Story = {
  render: () => (
    <div className="space-y-4">
      <Text variant="body-large">Large body text</Text>
      <Text variant="body">Regular body text</Text>
      <Text variant="body-small">Small body text</Text>
    </div>
  ),
};

export const Labels: Story = {
  render: () => (
    <div className="space-y-4">
      <Text variant="label-large">Large label</Text>
      <Text variant="label">Regular label</Text>
      <Text variant="label-small">Small label</Text>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="space-y-2">
      <Text color="primary">Primary text</Text>
      <Text color="secondary">Secondary text</Text>
      <Text color="success">Success text</Text>
      <Text color="warning">Warning text</Text>
      <Text color="error">Error text</Text>
      <Text color="disabled">Disabled text</Text>
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <div className="space-y-4">
      <Text align="left">Left aligned text</Text>
      <Text align="center">Center aligned text</Text>
      <Text align="right">Right aligned text</Text>
      <Text align="justify">Justified text with a longer sentence to demonstrate the justification effect.</Text>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const CustomElement: Story = {
  render: () => (
    <div className="space-y-2">
      <Text variant="h3" as="span">Heading as span</Text>
      <Text variant="body" as="p">Body as paragraph</Text>
      <Text variant="label" as="div">Label as div</Text>
    </div>
  ),
};
