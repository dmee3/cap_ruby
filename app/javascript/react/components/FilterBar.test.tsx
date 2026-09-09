import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import FilterBar, { EMPTY_FILTERS } from './FilterBar'

const types = [
  { id: 1, name: 'Cash' },
  { id: 2, name: 'Venmo' },
]

const setup = (overrides = {}) => {
  const onChange = vi.fn()
  render(
    <FilterBar
      filters={EMPTY_FILTERS}
      onChange={onChange}
      paymentTypes={types}
      totalCount={18}
      totalLabel="$9,420"
      deletedCount={1}
      {...overrides}
    />,
  )
  return onChange
}

describe('FilterBar', () => {
  it('shows the live result summary and the excluded-from-totals note', () => {
    setup()
    expect(screen.getByText('18 payments · $9,420')).toBeInTheDocument()
    expect(
      screen.getByText('Deleted payments are excluded from every total on this page.'),
    ).toBeInTheDocument()
  })

  it('emits a merged filters object when the search changes', async () => {
    const onChange = setup()
    await userEvent.type(screen.getByPlaceholderText('e.g. Alvarez'), 'A')
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, q: 'A' })
  })

  it('emits the scope change', async () => {
    const onChange = setup()
    await userEvent.selectOptions(screen.getByDisplayValue('Active only'), 'deleted_only')
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, scope: 'deleted_only' })
  })

  it('only shows the deleted count when the scope includes deleted rows', () => {
    setup({ filters: { ...EMPTY_FILTERS, scope: 'with_deleted' } })
    expect(screen.getByText('· 1 deleted')).toBeInTheDocument()
  })

  it('offers Clear filters only when something is set, and resets to empty', async () => {
    const onChange = setup({ filters: { ...EMPTY_FILTERS, q: 'x' } })
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(onChange).toHaveBeenCalledWith(EMPTY_FILTERS)
  })

  it('hides Clear filters when nothing is set', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
  })
})
