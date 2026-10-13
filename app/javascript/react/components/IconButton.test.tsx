import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import IconButton from './IconButton'

describe('IconButton', () => {
  it('is named by its label, since the glyph says nothing', async () => {
    const onClick = vi.fn()
    render(<IconButton label="Remove payment 2" onClick={onClick} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove payment 2' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("doesn't submit the form it sits in", async () => {
    const onSubmit = vi.fn((e: Event) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <IconButton label="Clear selected member" />
      </form>
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
