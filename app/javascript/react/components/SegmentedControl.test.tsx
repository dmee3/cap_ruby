import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SegmentedControl from './SegmentedControl'

const OPTIONS = [
  { value: 'season-to-date', label: 'Season to date' },
  { value: 'full-season', label: 'Full season' },
  { value: 'last-30', label: 'Last 30 days' },
]

const renderControl = (value = 'season-to-date', onChange = vi.fn()) =>
  render(<SegmentedControl label="Chart range" options={OPTIONS} value={value} onChange={onChange} />)

describe('SegmentedControl', () => {
  it('is a labelled radiogroup that announces the chosen segment', () => {
    renderControl()

    expect(screen.getByRole('radiogroup', { name: 'Chart range' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Season to date' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Full season' })).toHaveAttribute('aria-checked', 'false')
  })

  it('reports a click', async () => {
    const onChange = vi.fn()
    renderControl('season-to-date', onChange)

    await userEvent.click(screen.getByRole('radio', { name: 'Last 30 days' }))

    expect(onChange).toHaveBeenCalledWith('last-30')
  })

  it('takes one tab stop, on the chosen segment', async () => {
    renderControl('full-season')

    await userEvent.tab()

    expect(screen.getByRole('radio', { name: 'Full season' })).toHaveFocus()
  })

  it('moves the choice with the arrow keys, wrapping at the ends', async () => {
    const onChange = vi.fn()
    renderControl('last-30', onChange)

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')

    expect(onChange).toHaveBeenCalledWith('season-to-date')
    expect(screen.getByRole('radio', { name: 'Season to date' })).toHaveFocus()
  })
})
