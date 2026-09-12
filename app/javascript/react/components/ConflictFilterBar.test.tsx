import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConflictFilterBar, { DEFAULT_CONFLICT_FILTERS } from './ConflictFilterBar'

describe('ConflictFilterBar', () => {
  it('uses a native select for the ensemble, not clickable spans', () => {
    render(
      <ConflictFilterBar
        filters={DEFAULT_CONFLICT_FILTERS}
        onChange={vi.fn()}
        ensembles={['Battery']}
      />
    )

    expect(screen.getByLabelText('Ensemble')).toHaveProperty('tagName', 'SELECT')
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

  it('reports an ensemble change', async () => {
    const onChange = vi.fn()
    render(
      <ConflictFilterBar
        filters={DEFAULT_CONFLICT_FILTERS}
        onChange={onChange}
        ensembles={['Battery']}
      />
    )

    await userEvent.selectOptions(screen.getByLabelText('Ensemble'), 'Battery')

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ ensemble: 'Battery' }))
  })

  // The calendar shows every status; the only thing worth hiding is what has
  // already been decided.
  it('carries no status or date filters', () => {
    render(
      <ConflictFilterBar
        filters={DEFAULT_CONFLICT_FILTERS}
        onChange={vi.fn()}
        ensembles={['Battery']}
        showDecided={false}
        onShowDecidedChange={vi.fn()}
      />
    )

    expect(screen.queryByLabelText('Status')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('When')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('From')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('To')).not.toBeInTheDocument()
  })

  it('puts the decided switch on the same line as the filters', async () => {
    const onShowDecidedChange = vi.fn()
    render(
      <ConflictFilterBar
        filters={DEFAULT_CONFLICT_FILTERS}
        onChange={vi.fn()}
        ensembles={['Battery']}
        showDecided={false}
        onShowDecidedChange={onShowDecidedChange}
      />
    )

    const toggle = screen.getByRole('switch', { name: 'Show denied and resolved' })
    await userEvent.click(toggle)

    expect(onShowDecidedChange).toHaveBeenCalledWith(true)
  })

  it('renders nothing when there is neither an ensemble nor a toggle', () => {
    const { container } = render(
      <ConflictFilterBar filters={DEFAULT_CONFLICT_FILTERS} onChange={vi.fn()} />
    )

    expect(container).toBeEmptyDOMElement()
  })
})
