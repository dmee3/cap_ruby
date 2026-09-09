import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import SortableTh from './SortableTh'

const renderTh = (props = {}) => {
  const onSort = vi.fn()
  render(
    <table>
      <thead>
        <tr>
          <SortableTh
            sortKey="amount"
            label="Amount"
            activeKey="date_paid"
            activeDir="desc"
            onSort={onSort}
            {...props}
          />
        </tr>
      </thead>
    </table>,
  )
  return onSort
}

describe('SortableTh', () => {
  it('is a real th with scope=col', () => {
    renderTh()
    expect(screen.getByRole('columnheader')).toHaveAttribute('scope', 'col')
  })

  it('reports aria-sort=none when it is not the active column', () => {
    renderTh()
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'none')
  })

  it('reports the active direction when it is the sorted column', () => {
    renderTh({ activeKey: 'amount', activeDir: 'asc' })
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'ascending')
  })

  it('emits asc first, then flips to desc on the active column', async () => {
    const onSort = renderTh({ activeKey: 'amount', activeDir: 'asc' })
    await userEvent.click(screen.getByRole('button', { name: /Amount/ }))
    expect(onSort).toHaveBeenCalledWith('amount', 'desc')
  })

  it('emits asc when an inactive column is clicked', async () => {
    const onSort = renderTh()
    await userEvent.click(screen.getByRole('button', { name: /Amount/ }))
    expect(onSort).toHaveBeenCalledWith('amount', 'asc')
  })
})
