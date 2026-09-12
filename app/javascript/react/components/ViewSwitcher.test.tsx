import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ViewSwitcher from './ViewSwitcher'

describe('ViewSwitcher', () => {
  it('is a labelled radiogroup, not two clickable spans', () => {
    render(<ViewSwitcher value="queue" onChange={vi.fn()} />)

    expect(screen.getByRole('radiogroup', { name: 'Conflict view' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('announces which view is selected', () => {
    render(<ViewSwitcher value="queue" onChange={vi.fn()} />)

    expect(screen.getByRole('radio', { name: 'Queue' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Calendar' })).toHaveAttribute('aria-checked', 'false')
  })

  it('reports a change', async () => {
    const onChange = vi.fn()
    render(<ViewSwitcher value="queue" onChange={onChange} />)

    await userEvent.click(screen.getByRole('radio', { name: 'Calendar' }))

    expect(onChange).toHaveBeenCalledWith('calendar')
  })

  it('offers exactly two options', () => {
    render(<ViewSwitcher value="calendar" onChange={vi.fn()} />)

    expect(screen.getAllByRole('radio').map(node => node.textContent)).toEqual(['Queue', 'Calendar'])
  })
})
