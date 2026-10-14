import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import AlertBanner from './AlertBanner'
import EmptyState from './EmptyState'
import Button from './Button'
import { toast } from './Toast'

const meta = {
  title: 'Components/Feedback',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const AlertWarning: Story = {
  render: () => (
    <AlertBanner
      tone="warning"
      headline="2 members have no payment schedule"
      body="They won't see what they owe until one is set up."
      actions={[
        { label: 'Marcus Vale', meta: 'New member · World / Snare', href: '#marcus' },
        { label: 'Theo Marsh', meta: 'Vet · Open / Tenors', href: '#theo' },
      ]}
      onDismiss={() => undefined}
    />
  ),
}

export const AlertDanger: Story = {
  render: () => (
    <AlertBanner
      tone="danger"
      headline="Nobody can receive whistleblower reports"
      body="Reports cannot be submitted until someone is flagged as a recipient."
    />
  ),
}

export const Empty: Story = {
  render: () => (
    <EmptyState
      title="Nothing on the books"
      body="You haven't told anyone you'll miss a rehearsal this season."
      action={<Button>Submit a conflict</Button>}
    />
  ),
}

export const LoadFailed: Story = {
  render: () => (
    <EmptyState tone="danger" title="Couldn't load payments" body="Check your connection." action={<Button variant="secondary">Try again</Button>} />
  ),
}

export const Toasts: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="success" onClick={() => toast('Saved. Sticks: 18, logged to you.', { variant: 'success' })}>Success toast</Button>
      <Button variant="danger" onClick={() => toast("Couldn't save the schedule", { variant: 'error' })}>Error toast</Button>
      <Button variant="secondary" onClick={() => toast('Copied the link', { variant: 'info' })}>Info toast</Button>
    </div>
  ),
}
