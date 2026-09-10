import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import AddPaymentForm, { AddPaymentMember, AddPaymentType } from './AddPaymentForm'

const members: AddPaymentMember[] = [
  {
    id: 9,
    name: 'Elena Sokol',
    section: 'Front Ensemble / Vibes',
    paid_before_cents: 240_000,
    season_total_cents: 360_000,
    expected_cents: 240_000,
    applies_to: ['2026-03-15', '2026-04-15'],
    schedule_id: 4,
    installments: [
      { pay_date: '2025-10-17', amount_cents: 120_000, paid: true },
      { pay_date: '2026-03-15', amount_cents: 60_000, paid: false },
      { pay_date: '2026-04-15', amount_cents: 60_000, paid: false },
    ],
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

const pickMember = async () => {
  await userEvent.click(screen.getByRole('combobox', { name: 'Member' }))
  await userEvent.click(screen.getByRole('option', { name: /Elena Sokol/ }))
}

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

  it('searches members by first-last name with their section', async () => {
    setup()
    await userEvent.click(screen.getByRole('combobox', { name: 'Member' }))
    const option = screen.getByRole('option', { name: /Elena Sokol/ })
    expect(option).toHaveTextContent('Elena Sokol')
    expect(option).toHaveTextContent('Front Ensemble / Vibes')
  })

  it('carries a helper line under every field', () => {
    setup()
    expect(screen.getByText(/Current-season members only/)).toBeInTheDocument()
    expect(screen.getByText('Full amount received. No processing fee on manual payments.')).toBeInTheDocument()
    expect(screen.getByText('Defaults to today. Back-date it if the cash sat in the box.')).toBeInTheDocument()
    expect(screen.getByText('Members can see this on their payment history.')).toBeInTheDocument()
  })

  it('blocks submit and shows a led validation summary', async () => {
    const { container } = setup()
    const form = container.querySelector('form')!
    form.addEventListener('submit', (e) => e.preventDefault())

    await userEvent.click(screen.getByRole('button', { name: 'Record payment' }))

    expect(screen.getByText("This payment wasn't saved. Two things need fixing")).toBeInTheDocument()
    expect(screen.getAllByText(/Pick the member this payment is from\./)).not.toHaveLength(0)
  })

  it('marks the offending fields, not just the summary', async () => {
    const { container } = setup()
    container.querySelector('form')!.addEventListener('submit', (e) => e.preventDefault())

    await userEvent.click(screen.getByRole('button', { name: 'Record payment' }))

    // the combobox shell takes the error border; the hidden input carries the id
    expect(container.innerHTML).toMatch(/border-danger-fg/)
  })

  it('shows server errors after a failed submit', () => {
    setup({ serverErrors: ['Amount must be greater than 0'] })
    expect(screen.getByText(/Amount must be greater than 0/)).toBeInTheDocument()
  })

  it('updates the projection panel as the member and amount change', async () => {
    const { container } = setup()
    await pickMember()
    await userEvent.type(screen.getByLabelText('Amount'), '1200')

    expect(screen.getByText('Paid before').nextSibling).toHaveTextContent('$2,400')
    expect(screen.getByText('This payment').nextSibling).toHaveTextContent('+$1,200')
  })

  it('shows the read-only "Applies to" line for the selected member', async () => {
    const { container } = setup()
    await pickMember()
    expect(screen.getByText(/Oldest unpaid due date first: 3\/15, then 4\/15/)).toBeInTheDocument()
  })

  it('prompts to pick a member before any due dates can be shown', () => {
    setup()
    expect(screen.getByText('Pick a member to see their due dates')).toBeInTheDocument()
  })

  it("renders the member's schedule and marks what this payment will cover", async () => {
    const { container } = setup()
    await pickMember()

    expect(screen.getByText('Elena’s schedule')).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
    expect(screen.getByText('Season total')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Amount'), '600')
    expect(screen.getByText('Covers this')).toBeInTheDocument()
  })

  it('offers Cancel', () => {
    setup()
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/admin/payments')
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
