import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toggle from './Toggle'

describe('Toggle', () => {
  it('is a labelled switch', () => {
    render(<Toggle checked={false} onChange={vi.fn()} label="Show denied and resolved" />)

    expect(screen.getByRole('switch', { name: 'Show denied and resolved' })).toBeInTheDocument()
  })

  it('reports its state', () => {
    const { rerender } = render(<Toggle checked={false} onChange={vi.fn()} label="Show" />)
    expect(screen.getByRole('switch')).not.toBeChecked()

    rerender(<Toggle checked onChange={vi.fn()} label="Show" />)
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('reports a change', async () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} label="Show" />)

    await userEvent.click(screen.getByRole('switch'))

    expect(onChange).toHaveBeenCalledWith(true)
  })

  // Styled as a switch, but still a real checkbox — so it keeps keyboard
  // behaviour for free.
  it('toggles from the keyboard', async () => {
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} label="Show" />)

    await userEvent.tab()
    await userEvent.keyboard(' ')

    expect(onChange).toHaveBeenCalledWith(true)
  })
})
