import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import QuantityStepper from './QuantityStepper'

const setup = (props: Partial<React.ComponentProps<typeof QuantityStepper>> = {}) => {
  const onCommit = vi.fn()
  render(
    <QuantityStepper quantity={42} itemName="Snare sticks" onCommit={onCommit} {...props} />,
  )
  return { onCommit }
}

describe('QuantityStepper', () => {
  it('names both buttons for the item they adjust', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Remove one Snare sticks' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add one Snare sticks' })).toBeInTheDocument()
  })

  it('shows where the count is heading before anything is saved', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: /Remove one/ }))

    // The big number previews the result; the run beneath keeps the old count
    // visible so the change is checkable at a glance.
    expect(screen.getByRole('button', { name: `Save −1` })).toBeInTheDocument()
    expect(screen.getByText(/42 →/)).toBeInTheDocument()
  })

  // The whole premise: what gets written is the change, not the total, so two
  // people counting the same shelf can't clobber each other's arithmetic.
  it('commits a delta rather than an absolute', async () => {
    const { onCommit } = setup()

    await userEvent.click(screen.getByRole('button', { name: /Remove one/ }))
    await userEvent.click(screen.getByRole('button', { name: /Remove one/ }))
    await userEvent.click(screen.getByRole('button', { name: /^Save/ }))

    expect(onCommit).toHaveBeenCalledWith(-2)
  })

  it('converts a typed recount into a delta', async () => {
    const { onCommit } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Type a total' }))
    const field = screen.getByRole('spinbutton', { name: /Recount/ })
    await userEvent.clear(field)
    await userEvent.type(field, '36')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onCommit).toHaveBeenCalledWith(-6)
  })

  // A count of things on a shelf has no negative.
  it('stops the minus at zero and leaves the plus alone', async () => {
    setup({ quantity: 1 })

    await userEvent.click(screen.getByRole('button', { name: /Remove one/ }))

    expect(screen.getByRole('button', { name: /Remove one/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Add one/ })).toBeEnabled()
  })

  it('never commits a delta that would go below zero', async () => {
    const { onCommit } = setup({ quantity: 2 })

    const minus = screen.getByRole('button', { name: /Remove one/ })
    await userEvent.click(minus)
    await userEvent.click(minus)
    await userEvent.click(screen.getByRole('button', { name: /^Save/ }))

    expect(onCommit).toHaveBeenCalledWith(-2)
  })

  it('disables both buttons while a save is in flight', () => {
    setup({ state: 'committing' })

    expect(screen.getByRole('button', { name: /Remove one/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Add one/ })).toBeDisabled()
    expect(screen.getByText('Saving…')).toBeInTheDocument()
  })

  // 44px is the touch floor; this screen is used one-handed in a storage room.
  it('keeps 44px targets in touch mode', () => {
    setup({ touch: true })

    expect(screen.getByRole('button', { name: /Remove one/ })).toHaveClass('h-[44px]')
    expect(screen.getByRole('button', { name: /Add one/ })).toHaveClass('w-[44px]')
  })

  it('uses a real minus sign, not a hyphen', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: /Remove one/ }))

    expect(screen.getByText('−1')).toBeInTheDocument()
  })
})
