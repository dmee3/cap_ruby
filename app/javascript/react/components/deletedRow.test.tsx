import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { deletedRowClass, DeletedPill, RestoreAction } from './deletedRow'

describe('deletedRow treatment', () => {
  it('applies strike-through + tint classes only when deleted', () => {
    expect(deletedRowClass(true)).toContain('line-through')
    expect(deletedRowClass(false)).toBe('')
  })

  it('renders a neutral Deleted pill', () => {
    render(<DeletedPill />)
    const pill = screen.getByText('Deleted')
    expect(pill).toHaveClass('bg-neutral-bg', 'text-neutral-fg')
  })

  it('renders a Restore action that fires onRestore', async () => {
    const onRestore = vi.fn()
    render(<RestoreAction onRestore={onRestore} />)
    await userEvent.click(screen.getByRole('button', { name: 'Restore' }))
    expect(onRestore).toHaveBeenCalledOnce()
  })

  it('disables Restore while a restore is pending', () => {
    render(<RestoreAction onRestore={() => {}} pending />)
    expect(screen.getByRole('button', { name: 'Restore' })).toBeDisabled()
  })
})
