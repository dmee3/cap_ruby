import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import MoneyField, { FeeBreakdown } from './MoneyField'

describe('MoneyField', () => {
  it('reports the typed value back in integer cents', async () => {
    const onChange = vi.fn()
    render(<MoneyField valueCents={null} onChangeCents={onChange} />)
    await userEvent.type(screen.getByLabelText('Amount'), '120.50')
    expect(onChange).toHaveBeenLastCalledWith(12_050)
  })

  it('reports null when cleared', async () => {
    const onChange = vi.fn()
    render(<MoneyField valueCents={5_000} onChangeCents={onChange} />)
    const input = screen.getByLabelText('Amount')
    await userEvent.clear(input)
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('re-syncs the displayed text when valueCents changes from outside (quick-fill)', () => {
    const { rerender } = render(<MoneyField valueCents={144_000} onChangeCents={() => {}} />)
    expect(screen.getByLabelText('Amount')).toHaveValue('1440.00')

    rerender(<MoneyField valueCents={72_000} onChangeCents={() => {}} />)
    expect(screen.getByLabelText('Amount')).toHaveValue('720.00')
  })

  it('does not clobber an in-progress edit', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<MoneyField valueCents={null} onChangeCents={onChange} />)
    const input = screen.getByLabelText('Amount')
    await userEvent.type(input, '12.')
    // parent re-renders with the emitted value — the field keeps the raw text
    rerender(<MoneyField valueCents={1_200} onChangeCents={onChange} />)
    expect(input).toHaveValue('12.')
  })

  it('shows the over-max error when the value exceeds maxCents', () => {
    render(<MoneyField valueCents={90_000} onChangeCents={() => {}} maxCents={24_000} />)
    expect(screen.getByText(/more than the \$240\.00 left this season/)).toBeInTheDocument()
  })

  it('shows a success helper when within range', () => {
    render(
      <MoneyField valueCents={12_000} onChangeCents={() => {}} helper="Covers your Fri 3/14 installment in full." />
    )
    expect(screen.getByText(/Covers your Fri 3\/14/)).toHaveClass('text-success-fg')
  })

  it('a passed error overrides the helper', () => {
    render(
      <MoneyField valueCents={12_000} onChangeCents={() => {}} helper="ok" error="Something is wrong" />
    )
    expect(screen.getByText('Something is wrong')).toBeInTheDocument()
    expect(screen.queryByText('ok')).not.toBeInTheDocument()
  })
})

describe('FeeBreakdown', () => {
  it('renders dashes before an amount is entered', () => {
    render(<FeeBreakdown amountCents={null} />)
    expect(screen.getAllByText('–')).toHaveLength(3)
  })

  it('renders amount, fee and total once an amount exists', () => {
    render(<FeeBreakdown amountCents={12_000} />)
    expect(screen.getByText('Toward dues').nextSibling).toHaveTextContent('$120.00')
    expect(screen.getByText('Card fee (3% + 30¢)').nextSibling).toHaveTextContent('$4.01')
    expect(screen.getByText('Total charged').nextSibling).toHaveTextContent('$124.01')
  })
})
