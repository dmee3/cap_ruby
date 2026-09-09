import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ScheduleDiffPanel, { ScheduleDiffRow } from './ScheduleDiffPanel'

const rows: ScheduleDiffRow[] = [
  { payDate: '2025-10-17', kind: 'unchanged', fromCents: 50_000, toCents: 50_000, locked: true },
  { payDate: '2025-11-14', kind: 'changed', fromCents: 99_900, toCents: 40_000, locked: false },
  { payDate: '2026-03-06', kind: 'added', fromCents: null, toCents: 40_000, locked: false },
]

const setup = (props = {}) => {
  const onApply = vi.fn()
  const onKeep = vi.fn()
  render(
    <ScheduleDiffPanel
      defaultLabel="the vet default"
      rows={rows}
      onApply={onApply}
      onKeep={onKeep}
      {...props}
    />,
  )
  return { onApply, onKeep }
}

describe('ScheduleDiffPanel', () => {
  it('labels a changed row old → new and an added row with a plus', () => {
    setup()
    expect(screen.getByText('$999 → $400')).toBeInTheDocument()
    expect(screen.getByText('+ $400 added')).toBeInTheDocument()
  })

  it('marks a locked row as paid and kept', () => {
    setup()
    expect(screen.getByText('$500 · paid, kept as-is')).toBeInTheDocument()
  })

  it('carries the preserve-paid caveat', () => {
    setup()
    expect(
      screen.getByText(/Resetting only rewrites future due dates/),
    ).toBeInTheDocument()
  })

  it('wires Apply default and Keep mine', async () => {
    const { onApply, onKeep } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Apply default' }))
    await userEvent.click(screen.getByRole('button', { name: 'Keep mine' }))
    expect(onApply).toHaveBeenCalledOnce()
    expect(onKeep).toHaveBeenCalledOnce()
  })

  it('hides the actions when nothing differs', () => {
    render(
      <ScheduleDiffPanel
        defaultLabel="the vet default"
        rows={[{ payDate: '2025-10-17', kind: 'unchanged', fromCents: 50_000, toCents: 50_000, locked: false }]}
        onApply={() => {}}
        onKeep={() => {}}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Apply default' })).not.toBeInTheDocument()
    expect(screen.getByText('Matches the vet default')).toBeInTheDocument()
  })
})
