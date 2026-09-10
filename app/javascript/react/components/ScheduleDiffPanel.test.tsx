import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ScheduleDiffPanel, { ScheduleDiffRow } from './ScheduleDiffPanel'

const rows: ScheduleDiffRow[] = [
  {
    payDate: '2025-10-17',
    fromDate: '2025-10-17',
    toDate: '2025-10-17',
    kind: 'unchanged',
    fromCents: 50_000,
    toCents: 50_000,
    locked: true,
  },
  {
    payDate: '2025-11-20',
    fromDate: '2025-11-20',
    toDate: '2025-11-14',
    kind: 'moved',
    fromCents: 40_000,
    toCents: 40_000,
    locked: false,
  },
  {
    payDate: '2026-03-06',
    fromDate: null,
    toDate: '2026-03-06',
    kind: 'added',
    fromCents: null,
    toCents: 40_000,
    locked: false,
  },
]

const setup = (props = {}) => {
  const onApply = vi.fn()
  const onKeep = vi.fn()
  const onAskReset = vi.fn()
  render(
    <ScheduleDiffPanel
      defaultLabel="the vet default"
      rows={rows}
      lockedCount={4}
      mode="resting"
      onAskReset={onAskReset}
      onApply={onApply}
      onKeep={onKeep}
      {...props}
    />,
  )
  return { onApply, onKeep, onAskReset }
}

describe('ScheduleDiffPanel', () => {
  describe('resting', () => {
    it('offers a reset rather than committing one', async () => {
      const { onAskReset, onApply } = setup()
      expect(screen.getByText('Differs from the vet default')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Apply default' })).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Reset to default' }))
      expect(onAskReset).toHaveBeenCalledOnce()
      expect(onApply).not.toHaveBeenCalled()
    })

    it('says so when the schedule already matches the default', () => {
      setup({
        rows: [{ ...rows[0], locked: false }],
      })
      expect(screen.getByText('Matches the vet default')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Reset to default' })).not.toBeInTheDocument()
    })
  })

  describe('confirming', () => {
    it('leads with the question and both actions', async () => {
      const { onApply, onKeep } = setup({ mode: 'confirming' })
      expect(screen.getByText('Reset to default?')).toBeInTheDocument()
      expect(screen.getByText(/Here’s what the vet default would change/)).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Apply default' }))
      await userEvent.click(screen.getByRole('button', { name: 'Keep mine' }))
      expect(onApply).toHaveBeenCalledOnce()
      expect(onKeep).toHaveBeenCalledOnce()
    })
  })

  it('shows a moved date as one transition, not a removal plus an addition', () => {
    setup()
    expect(screen.getByText('11/20/25')).toHaveClass('line-through')
    expect(screen.getByText('11/14/25')).toHaveClass('font-semibold')
  })

  it('labels an added row with its amount', () => {
    setup()
    expect(screen.getByText('added · $400')).toBeInTheDocument()
  })

  it('marks a locked row as paid and kept', () => {
    setup()
    expect(screen.getByText('paid, kept as-is')).toBeInTheDocument()
  })

  it('spells out how many entries a reset leaves alone', () => {
    setup()
    expect(
      screen.getByText(/The four already covered by payments stay as they are\./),
    ).toBeInTheDocument()
  })

  it('drops the count from the caveat when nothing is covered yet', () => {
    setup({ lockedCount: 0 })
    expect(screen.getByText('Resetting rewrites the future due dates on this schedule.')).toBeInTheDocument()
  })
})
