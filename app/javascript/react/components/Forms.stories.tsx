import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import Field, { Select, TextInput, Textarea } from './Field'
import MoneyField from './MoneyField'
import Toggle from './Toggle'

const meta = {
  title: 'Components/Forms',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Fields: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      <Field label="Email" hint="We send receipts here.">
        <TextInput type="email" defaultValue="rae@example.com" />
      </Field>
      <Field label="Phone" optional>
        <TextInput type="tel" />
      </Field>
      <Field label="Username" error="Username has already been taken">
        <TextInput defaultValue="rquinn" />
      </Field>
      <Field label="Section">
        <Select defaultValue="Snare">
          {['Snare', 'Tenors', 'Bass', 'Cymbals', 'Front Ensemble'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </Field>
      <Field label="Reason" description="Coordinators see this when they review it.">
        <Textarea rows={3} />
      </Field>
    </div>
  ),
}

const MoneyDemo = (props: Partial<React.ComponentProps<typeof MoneyField>>) => {
  const [cents, setCents] = useState<number | null>(props.valueCents ?? null)
  return <MoneyField label="Amount" {...props} valueCents={cents} onChangeCents={setCents} />
}

export const Money: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      <MoneyDemo />
      <MoneyDemo valueCents={30_000} helper="Covers your 12/15 installment in full." />
      <MoneyDemo valueCents={200_000} maxCents={100_000} />
    </div>
  ),
}

const ToggleDemo = () => {
  const [on, setOn] = useState(false)
  return <Toggle checked={on} onChange={setOn} label="Show decided conflicts" />
}

export const Switch: Story = { render: () => <ToggleDemo /> }
