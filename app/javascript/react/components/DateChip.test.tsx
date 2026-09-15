import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import DateChip from './DateChip'

describe('DateChip', () => {
  it('shows the date and what it costs', () => {
    render(<DateChip date={17} />)

    expect(screen.getByText(/the 17th/)).toBeInTheDocument()
    expect(screen.getByText('$17')).toBeInTheDocument()
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
