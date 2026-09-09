import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import AddPaymentForm, { AddPaymentMember, AddPaymentType } from './AddPaymentForm'

const members: AddPaymentMember[] = [
  {
    id: 9,
    name: 'Rae Quinn',
    paid_before_cents: 20_000,
    season_total_cents: 60_000,
    expected_cents: 30_000,
    applies_to: ['2026-02-06', '2026-03-06'],
  },
]

const paymentTypes: AddPaymentType[] = [
  { id: 3, name: 'Cash' },
  { id: 4, name: 'Venmo' },
]

const setup = (props = {}) =>
  render(
    <AddPaymentForm
      members={members}
      paymentTypes={paymentTypes}
      csrfToken="tok"
      serverErrors={[]}
      initial={{}}
      {...props}
    />,
  )

describe('AddPaymentForm', () => {
  it('is a real POST form to /admin/payments with a CSRF token', () => {
    const { container } = setup()
    const form = container.querySelector('form')!
    expect(form).toHaveAttribute('action', '/admin/payments')
    expect(form).toHaveAttribute('method', 'post')
    expect(container.querySelector('input[name="authenticity_token"]')).toHaveValue('tok')
  })

  it('uses Rails-style nested field names', () => {
    const { container } = setup()
    expect(container.querySelector('[name="payment[user_id]"]')).toBeInTheDocument()
    expect(container.querySelector('[name="payment[amount]"]')).toBeInTheDocument()
    expect(container.querySelector('[name="payment[payment_type_id]"]')).toBeInTheDocument()
    expect(container.querySelector('[name="payment[date_paid]"]')).toBeInTheDocument()
  })

  it('blocks submit and shows a validation summary when required fields are missing', async () => {
    const { container } = setup()
    const form = container.querySelector('form')!
    const submitSpy = vi.fn((e: Event) => e.preventDefault())
    form.addEventListener('submit', submitSpy)

    await userEvent.click(screen.getByRole('button', { name: 'Record payment' }))

    expect(screen.getByText(/things to fix/)).toBeInTheDocument()
    expect(screen.getByText('Pick the member this payment is for.')).toBeInTheDocument()
  })

  it('shows server errors after a failed submit', () => {
    setup({ serverErrors: ['Amount must be greater than 0'] })
    expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument()
  })

  it('updates the projection panel as the member and amount change', async () => {
    const { container } = setup()
    await userEvent.selectOptions(container.querySelector('[name="payment[user_id]"]')!, '9')

    await userEvent.type(screen.getByLabelText('Amount'), '100')

    expect(screen.getByText('Paid before').nextSibling).toHaveTextContent('$200.00')
    expect(screen.getByText('This payment').nextSibling).toHaveTextContent('+$100.00')
  })

  it('shows the read-only "Applies to" line for the selected member', async () => {
    const { container } = setup()
    await userEvent.selectOptions(container.querySelector('[name="payment[user_id]"]')!, '9')
    expect(screen.getByText(/oldest unpaid due date first/)).toBeInTheDocument()
  })

  it('pre-fills sticky values on a re-render after failure', () => {
    const { container } = setup({
      initial: { paymentTypeId: 3, amountCents: 4500, datePaid: '2026-01-15', notes: 'Cash at rehearsal' },
    })
    expect(container.querySelector('[name="payment[payment_type_id]"]')).toHaveValue('3')
    expect(screen.getByLabelText('Amount')).toHaveValue('45.00')
    expect(container.querySelector('[name="payment[notes]"]')).toHaveValue('Cash at rehearsal')
  })
})
