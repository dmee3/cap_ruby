import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import DateChip from './DateChip'

describe('DateChip', () => {
  it('names the date', () => {
    render(<DateChip date={17} />)

    expect(screen.getByText(/the 17th/)).toBeInTheDocument()
  })

  // The tile the donor tapped already showed the amount, and the total sits
  // right below the chips, so repeating it here said the same number thrice.
  it('does not repeat the amount', () => {
    const { container } = render(<DateChip date={17} />)

    expect(container.textContent).not.toContain('$17')
  })

  it('is static by default, with no remove control', () => {
    render(<DateChip date={3} />)

    expect(screen.queryByRole('button')).toBeNull()
  })

  it('names what it removes, since an ✕ alone says nothing', () => {
    render(<DateChip date={3} onRemove={() => {}} />)

    expect(screen.getByRole('button', { name: 'Remove the 3rd' })).toBeInTheDocument()
  })

  it('reports the date it removed', async () => {
    const onRemove = vi.fn()
    render(<DateChip date={12} onRemove={onRemove} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onRemove).toHaveBeenCalledWith(12)
  })
})
