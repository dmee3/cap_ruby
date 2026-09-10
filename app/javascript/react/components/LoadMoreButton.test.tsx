import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import LoadMoreButton from './LoadMoreButton'

describe('LoadMoreButton', () => {
  it('shows "Load N more" and calls onClick while there is more', async () => {
    const onClick = vi.fn()
    render(<LoadMoreButton increment={10} totalCount={40} hasMore onClick={onClick} />)
    const btn = screen.getByRole('button', { name: 'Load 10 more' })
    await userEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('shows "Showing all N" and is disabled when exhausted', () => {
    render(<LoadMoreButton increment={10} totalCount={12} hasMore={false} onClick={() => {}} />)
    expect(screen.getByRole('button', { name: 'Showing all 12' })).toBeDisabled()
  })

  it('is disabled and busy while loading', () => {
    render(<LoadMoreButton increment={10} totalCount={40} hasMore loading onClick={() => {}} />)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })
})
