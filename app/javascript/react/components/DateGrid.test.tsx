import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import DateGrid from './DateGrid'

const noop = () => {}

describe('DateGrid', () => {
  it('renders exactly 31 dates', () => {
    render(<DateGrid claimed={[]} selected={[]} onToggle={noop} />)

    expect(screen.getAllByRole('button')).toHaveLength(31)
  })

  // The whole point of the redesign: no leading blanks, so tile 1 is top-left
  // and the old hardcoded-offset bug can't come back.
  it('starts at 1 with no leading blank cells', () => {
    render(<DateGrid claimed={[]} selected={[]} onToggle={noop} />)

    const tiles = screen.getAllByRole('button')
    expect(tiles[0]).toHaveAccessibleName('Sponsor the 1st for $1')
    expect(tiles[30]).toHaveAccessibleName('Sponsor the 31st for $31')
  })

  it('names no month, because the tiles are prices and not appointments', () => {
    const { container } = render(<DateGrid claimed={[]} selected={[]} onToggle={noop} />)

    expect(container.textContent).not.toMatch(/March/i)
    expect(container.textContent).not.toMatch(/\b(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\b/i)
  })

  it('keeps seven columns at both sizes, since that shape says calendar', () => {
    const { container: wide } = render(<DateGrid claimed={[]} selected={[]} onToggle={noop} />)
    const { container: narrow } = render(
      <DateGrid claimed={[]} selected={[]} onToggle={noop} compact />,
    )

    expect(wide.querySelector('[role="group"]')).toHaveClass('grid-cols-7')
    expect(narrow.querySelector('[role="group"]')).toHaveClass('grid-cols-7')
  })

  it('marks claimed dates taken and selected dates pressed', () => {
    render(<DateGrid claimed={[5]} selected={[3]} onToggle={noop} />)

    expect(screen.getByRole('button', { name: /5th is already sponsored/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Sponsor the 3rd/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('reports a toggled date', async () => {
    const onToggle = vi.fn()
    render(<DateGrid claimed={[]} selected={[]} onToggle={onToggle} />)

    await userEvent.click(screen.getByRole('button', { name: /Sponsor the 17th/ }))

    expect(onToggle).toHaveBeenCalledWith(17)
  })

  // The grid is the one thing that has to survive a phone: donors arrive from
  // shared links. 44px is the touch floor, and at 390px seven columns only
  // clear it because the card runs a tighter inset there.
  it('keeps every tile at the 44px touch floor when compact', () => {
    render(<DateGrid claimed={[]} selected={[]} onToggle={noop} compact />)

    screen.getAllByRole('button').forEach((tile) => {
      expect(tile).toHaveClass('min-h-[44px]')
    })
  })

  it('shows the legend only when asked, since it is desktop-only', () => {
    const { queryByText } = render(<DateGrid claimed={[]} selected={[]} onToggle={noop} />)
    expect(queryByText('Taken')).toBeNull()

    render(<DateGrid claimed={[]} selected={[]} onToggle={noop} showLegend />)
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Yours')).toBeInTheDocument()
    expect(screen.getByText('Taken')).toBeInTheDocument()
  })
})
