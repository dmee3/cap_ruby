import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConflictFilterBar, { DEFAULT_CONFLICT_FILTERS } from './ConflictFilterBar'

describe('ConflictFilterBar', () => {
  // Flow 4 chose native controls over custom pills because they are keyboard-
  // and screen-reader-accessible for free; the Flow 5 canvas drew pills again.
  it('uses native selects, not clickable spans', () => {
    render(<ConflictFilterBar filters={DEFAULT_CONFLICT_FILTERS} onChange={vi.fn()} />)

    expect(screen.getByLabelText('Status')).toHaveProperty('tagName', 'SELECT')
    expect(screen.getByLabelText('When')).toHaveProperty('tagName', 'SELECT')
  })

  it('reports a status change', async () => {
    const onChange = vi.fn()
    render(<ConflictFilterBar filters={DEFAULT_CONFLICT_FILTERS} onChange={onChange} />)

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'Approved')

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'Approved' }))
  })

  it('shows the count on each scope, including unselected ones', () => {
    render(
      <ConflictFilterBar
        filters={DEFAULT_CONFLICT_FILTERS}
        onChange={vi.fn()}
        counts={{ Pending: 5, Approved: 3, All: 9 }}
      />
    )

    expect(screen.getByRole('option', { name: 'Pending · 5' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Approved · 3' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'All · 9' })).toBeInTheDocument()
  })

  it('offers the ensembles the season actually uses', () => {
    render(
      <ConflictFilterBar
        filters={DEFAULT_CONFLICT_FILTERS}
        onChange={vi.fn()}
        ensembles={['Battery', 'Front ensemble']}
      />
    )

    expect(screen.getByRole('option', { name: 'Battery' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Front ensemble' })).toBeInTheDocument()
  })

  it('omits the ensemble filter when the season has none', () => {
    render(<ConflictFilterBar filters={DEFAULT_CONFLICT_FILTERS} onChange={vi.fn()} />)

    expect(screen.queryByLabelText('Ensemble')).not.toBeInTheDocument()
  })

  it('offers a clear only once something is filtered', async () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <ConflictFilterBar filters={DEFAULT_CONFLICT_FILTERS} onChange={onChange} />
    )
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()

    rerender(
      <ConflictFilterBar
        filters={{ ...DEFAULT_CONFLICT_FILTERS, status: 'Denied' }}
        onChange={onChange}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(onChange).toHaveBeenCalledWith(DEFAULT_CONFLICT_FILTERS)
  })

  it('carries a real date range', async () => {
    const onChange = vi.fn()
    render(<ConflictFilterBar filters={DEFAULT_CONFLICT_FILTERS} onChange={onChange} />)

    const from = screen.getByLabelText('From')
    expect(from).toHaveAttribute('type', 'date')

    await userEvent.type(from, '2026-03-01')
    expect(onChange).toHaveBeenCalled()
  })
})
