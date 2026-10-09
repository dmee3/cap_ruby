import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Field, { Select, TextInput } from './Field'
import MoneyField from './MoneyField'

describe('Field', () => {
  it('names its control and describes it with the description and hint', () => {
    render(
      <Field label="Your email" description="Anonymous is fine." hint="Only admins see it.">
        <TextInput type="email" />
      </Field>
    )
    const input = screen.getByRole('textbox', { name: 'Your email' })
    expect(input).toHaveAccessibleDescription('Anonymous is fine. Only admins see it.')
  })

  it('swaps the hint for the error and marks the control invalid', () => {
    render(
      <Field label="Payment type" hint="Cash · Check" error="Choose how the payment was made.">
        <Select>
          <option value="">Select a type…</option>
        </Select>
      </Field>
    )
    const select = screen.getByRole('combobox', { name: 'Payment type' })
    expect(select).toBeInvalid()
    expect(select).toHaveAccessibleDescription('Choose how the payment was made.')
    expect(screen.queryByText('Cash · Check')).toBeNull()
  })

  it('keeps an explicit id so validation summaries can link to the control', () => {
    render(
      <Field label="Date paid" id="payment_date_paid">
        <TextInput type="date" />
      </Field>
    )
    expect(screen.getByLabelText('Date paid')).toHaveAttribute('id', 'payment_date_paid')
  })

  it('labels a bare MoneyField placed inside it', () => {
    render(
      <Field label="Amount for payment 2" hideLabel>
        <MoneyField label="" valueCents={null} onChangeCents={() => {}} />
      </Field>
    )
    expect(screen.getByRole('textbox', { name: 'Amount for payment 2' })).toBeInTheDocument()
  })
})
